
import secrets
import datetime as dt
from .general import formatDateTime
from .SQL import executeQuery
from ..globalConfig import *
from ..globalSecrets import *
import base64

#Session info and user info

def checkSessionValid(sessionToken):
    if (sessionToken == None or executeQuery("SELECT IFNULL(IF(`expiry_date` > NOW(), 1,0),0) FROM active_sessions WHERE token = %s",[sessionToken])['data'][0][0] == 0): # Client has no token, or its current one is out of date
        return False
    return True
    #Check if Token exists in DB and 

def deleteSession(sessionToken):
    executeQuery("DELETE FROM active_sessions WHERE token = %s", [sessionToken])

# If the user           
def createSession(userId, userInfo, oldToken = None):
    if oldToken:
        deleteSession(oldToken)
    # A base 64 encode of the email is done to ensure that there are no clashing token - even if they would be very rare (9^48 chance).
    # https://docs.python.org/3/library/secrets.html#module-secrets
    newToken = base64.b64encode(userInfo['email'].encode("ascii")).decode("ascii") + secrets.token_hex(48)
    startDate = dt.datetime.now()
    expireDate = startDate + dt.timedelta(hours=SESSION_LIFETIME)
    startDateStr = formatDateTime(startDate)
    expireDateStr = formatDateTime(expireDate)
    executeQuery("INSERT INTO active_sessions (token, user_id, start_date,expire_date) VALUES (%s,%s,%s,%s)", [newToken,userId,startDateStr,expireDateStr])

    return newToken

def getUserInfoFromSessionToken(sessionToken):
    dbResponse = executeQuery("SELECT u.id, concat(u.first_name, ' ',u.last_name) as full_name, u.email, u.year_group, u.access_level FROM active_sessions AS acts LEFT JOIN users AS u ON u.id = acts.user_id WHERE acts.expire_date > NOW() AND acts.token = %s", [sessionToken])
    if not dbResponse['data']: # Is list empty
        return None
    return {
        'userId':dbResponse['data'][0][0],
        'fullName':dbResponse['data'][0][1],
        'email':dbResponse['data'][0][2],
        'yearGroup':dbResponse['data'][0][3],
        'accessLevel':dbResponse['data'][0][4]
    }

def sessionExists(sessionToken): # Finish
    return True

def assignYearGroupFromSessionToken(sessionToken, year):
    if (sessionExists(sessionToken)):
        try:
            if year in ALLOWED_YEAR_GROUPS:
                dbResponse = executeQuery("UPDATE users AS u LEFT JOIN active_sessions AS acts on acts.user_id = u.id set u.year_group = %s where acts.token = %s", [year, sessionToken])
            return 200
        except:
            return  500
    return 401

def updateEmailFromSessionToken(sessionToken, newState):
    if (sessionExists(sessionToken)):
        try:
            dbResponse = executeQuery("UPDATE users AS u LEFT JOIN active_sessions AS acts on acts.user_id = u.id set u.email_permitted = %s where acts.token = %s", [newState, sessionToken])
            return 200
        except:
            return  500
    return 401

def getuserId(**kwargs):
    userEmail = kwargs['googleAccObj']['email']
    dbResponse = executeQuery("SELECT id FROM users WHERE email = %s", [userEmail])
    try:
        return dbResponse['data'][0][0]
    except:
        None

def createUser(googleAccObj):
    userArr = [
        googleAccObj['given_name'],
        googleAccObj['family_name'],
        None,
        googleAccObj['email'],
        'student'
    ]
    try:
        dbResponse = executeQuery("INSERT INTO users (first_name, last_name, year_group, email, access_level) VALUES (%s,%s,%s,%s,%s)", userArr)
        return dbResponse['dbToken']
    except Exception as err:
        print(err)
        return None