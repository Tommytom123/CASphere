
import secrets
import datetime as dt
from .general import formatDateTime
from .SQL import executeQuery
from ..globalConfig import *

#Session info and user info

def checkSessionValid(sessionKey):
    if (sessionKey == None or executeQuery("SELECT IFNULL(IF(`expiry_date` > NOW(), 1,0),0) FROM active_sessions WHERE unique_key = %s",[sessionKey])['data'][0][0] == 0): # Client already has a key
        return False
    return True
    #Check if key exists in DB and 

def deleteSession(sessionKey):
    executeQuery("DELETE FROM active_sessions WHERE unique_key = %s", [sessionKey])

# If the user           
def createSession(userID, oldKey = None, recallError = False):
    if recallError: # If the function is recalled in the instance of a suspected clash 
        return None
    if oldKey:
        deleteSession(oldKey)
    newKey = secrets.token_hex(64) # https://docs.python.org/3/library/secrets.html#module-secrets
    startDate = dt.datetime.now()
    expireDate = startDate + dt.timedelta(hours=SESSION_LIFETIME)
    startDateStr = formatDateTime(startDate)
    expireDateStr = formatDateTime(expireDate)
    #try:
    executeQuery("INSERT INTO active_sessions (unique_key, user_id, start_date,expire_date) VALUES (%s,%s,%s,%s)", [newKey,userID,startDateStr,expireDateStr])
    #except: #Condition will be met in the (very rare) case of clashing session keys. The function will then be recalled
    #    createSession(userID, recallError = True)
    return newKey

def getUserInfoFromSessionKey(sessionKey):
    dbResponse = executeQuery("SELECT u.id, concat(u.first_name, ' ',u.last_name) as full_name, u.email, u.year_group, u.access_level FROM active_sessions AS acts LEFT JOIN users AS u ON u.id = acts.user_id WHERE acts.expire_date > NOW() AND acts.unique_key = %s", [sessionKey])
    print(dbResponse)
    if not dbResponse['data']:
        return None
    return {
        'userId':dbResponse['data'][0][0],
        'fullName':dbResponse['data'][0][1],
        'email':dbResponse['data'][0][2],
        'yearGroup':dbResponse['data'][0][3],
        'accessLevel':dbResponse['data'][0][4]
    }


def getUserId(**kwargs):
    userEmail = kwargs['googleAccObj']['email']
    print(userEmail)
    dbResponse = executeQuery("SELECT id FROM users WHERE email = %s", [userEmail])
    print(dbResponse)
    try:
        return dbResponse['data'][0][0]
    except:
        None

def createUser(googleAccObj):
    print(googleAccObj)
    userArr = [
        googleAccObj['given_name'],
        googleAccObj['family_name'],
        None,
        googleAccObj['email'],
        'student'
    ]
    try:
        dbResponse = executeQuery("INSERT INTO users (first_name, last_name, year_group, email, access_level) VALUES (%s,%s,%s,%s,%s)", userArr)
        print(dbResponse)
        return dbResponse['dbKey']
    except Exception as err:
        print(err)
        return None