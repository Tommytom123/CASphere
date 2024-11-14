from ..globalConfig import *
from ..globalSecrets import *
from ..core.SQL import executeQuery
from ..core.general import flattenArray, getSqlPlaceholders, formatDateTime, indexOf, replaceStringChars
from ..core.sessions import getUserInfoFromSessionToken
from ..core.emails import sendEmails, getAllEmailAddresses
from casphere import app
from werkzeug.utils import secure_filename
import base64
import secrets
import datetime as dt
import os

globalMaxRequestProjectsLimit = 8 # Maximum number of projects which can be requested at a time
projectRankingFormulae = '(prj.id) AS ranking' #IF(prj.approved_by_id is not null, 100,0) + day(prj.date_start)

# Contains all the DB col names, names, join information (and required values)
#   For fields that have a manual entry (In the form) the valType and formFieldName are required for processing -> Seen in 
globalProjectStructure = { 
    'fields':{
        'id': {
            'dbColRead':'prj.id',
            'valType': 'int'
        }, 
        'title': {
            'dbColRead':'prj.title',
            'dbColInsert':'title',
            'valType': 'text',
            'formFieldName': 'addProjectTitle'
        }, 
        'description':{
            'dbColRead':'prj.description',
            'dbColInsert':'description',
            'valType': 'text',
            'formFieldName': 'addProjectDescription'
        },
        'startDate':{
            'dbColRead':'prj.date_start',
            'dbColInsert':'date_start',
            'valType': 'date',
            'formFieldName': 'addProjectStartDate'
        },
        'endDate':{
            'dbColRead':'prj.date_end',
            'dbColInsert':'date_end',
            'valType': 'date',
            'formFieldName': 'addProjectEndDate'
        },
        'img':{
            'dbColRead':'prj.image',
            'dbColInsert':'image',
            'valType': 'img', # What is inserted into the DB is a random Gen of the 
            'formFieldName': ''
        },
        'participantLim':{
            'dbColRead':'prj.participant_limit',
            'dbColInsert':'participant_limit',
            'formFieldName': 'maxParticipantsInput'
        },
        "strand":{
            'dbColRead':'prj.strand',
            'dbColInsert':'strand',
            'valType': 'radioBtn',
            'formFieldName': 'strandRadio'
        },
        'years':{
            'dbColRead':'prj.years',
            'dbColInsert':'years',
            'valType': 'multiSelect',
            'formFieldName': [["yearGroupCheckbox_1",'Y9'],["yearGroupCheckbox_2",'Y10'],["yearGroupCheckbox_3",'Y11'],["yearGroupCheckbox_4",'Y12'],["yearGroupCheckbox_5",'Y13']] # checkbox name, value to be stored if selected/'on'
        },
        'location':{
            'dbColRead':'prj.location',
            'dbColInsert':'location',
            'valType': 'text',
            'formFieldName': "addProjectLocation"
        },
        'ownerName':{
            'dbColRead':"CONCAT(own.first_name, ' ', own.last_name)",
            'dbColInsert':'owner_id',
            'valType': 'text',
            'insertFK': {'query':'SELECT u.id FROM users AS u JOIN active_sessions as acts ON acts.user_id = u.id WHERE acts.token = %s', 'value':'sessionToken'}
        },
        'ownerYear':{
            'dbColRead':"own.year_group",
            'valType': 'text',
        },
        'ownerEmail':{
            'dbColRead':"own.email",
            'valType': 'text',
        },
        'uploadedDate':{
            'dbColRead':'prj.uploaded_date',
            'dbColInsert':'uploaded_date',
            'valType': 'date',
            'default': lambda : formatDateTime(dt.datetime.now())
        },
       # 'participants':{
       #     'dbColRead':'(SELECT GROUP_CONCAT(prt.participants) as participants FROM project_participants AS prt ON prt.project_id = prj.id GROUP BY prj.id)',
       #     'valType': 'int'
       # },
        'participantCount':{
            'dbColRead':'prj_part.participant_count',
            'valType': 'int'
        },
        'maxParticipants':{
            'dbColRead':'prj.max_participant_count',
            'dbColInsert':'max_participant_count',
            'valType': 'int',
            'formFieldName': 'maxParticipantsInput'
        },
        'approved':{
            'dbColRead':'if(prj.approved_by_id IS NOT NULL, 1, 0)',
            'valType': 'int'
        },
        'pinned':{
            'dbColRead':'EXISTS(SELECT * FROM projects_pinned as pin WHERE pin.project_id = prj.id AND pin.user_id = %s) as pinned',
            'valType': 'bool',
            'reqValues':['userUID']
        },
        'joined':{
            'dbColRead':'EXISTS(SELECT * FROM projects_participants as part WHERE part.project_id = prj.id AND part.user_id = %s) as joined',
            'valType': 'bool',
            'reqValues':['userUID']
        }
        

    },
    'joins':[
        'LEFT JOIN users AS own ON prj.owner_id = own.id',
        'left join (select project_id, count(*) as participant_count from projects_participants group by project_id) as prj_part on prj.id = prj_part.project_id'
    ]
}

# Check user access level
def checkAccessLevel(userSessionToken, action): # Still needs to be implemented
    return True

def formatFormValues(field, form, files):
    match (field["valType"]):
        case 'text':
            return form[field["formFieldName"]]
        case 'radioBtn':
            return form[field["formFieldName"]]
        case 'multiSelect': # The multiselect returns each checkbox as a seperate field if checked in the form values
            selected = []
            for select in field['formFieldName']:
                
                if (form.get(select[0], False) != False):
                    selected.append(select[1])
            print(selected)
            return ','.join(selected)
        case 'img':
            return uploadImage(files['projImg'])
        case _:
            return form.get(field["formFieldName"], None)
        
#Get the column and values for the query UPDATE/INSERT format
def getQueryColumnsValues(userSessionToken, form, files):
    columns = []
    values = []
    for Token, field in globalProjectStructure['fields'].items():
        try:
            if (field.get("valType",False) != False and field.get("dbColInsert",False) != False): # If it has a specified type
                # If the value needs to be inserted into a seperate table (Eg: in a many-many instance)
                    # Not implemented as of yet
                    
                # If the value is a FK-Primary Token link
                if (field.get("insertFK",False) != False):
                    match (field['insertFK']["value"]):
                        case "sessionToken":
                            queryValue = userSessionToken
                        case _:
                            queryValue = formatFormValues(field, form, files)
                    response = executeQuery(field['insertFK']['query'], [queryValue])
                    if not not response['data'][0]: # Not Empty
                        columns.append(field["dbColInsert"])
                        values.append(response['data'][0][0]) 
                    continue
                
                # If the value is generated serverside (Eg: in the case of the uploaded date)
                if (field.get("default",False) != False):
                    columns.append(field["dbColInsert"])
                    values.append(field["default"]())
                    continue

                # Else, a normal value
                columns.append(field["dbColInsert"])
                values.append(formatFormValues(field, form, files))
        except Exception as err:
            #print(err)
            print(f"error{field}")
    return columns, values

# Takes an image which is to be stored, and stores it into the uploads directory. It returns its unique filename of which is to be stored in the DB
def uploadImage(img):
    encodedInfo = replaceStringChars(base64.b64encode(f'{img.filename}{dt.datetime.now().timestamp()}'.encode('ascii')).decode('ascii'), [['+','-'],['/','('],['=',')']]) #Replaces non compatible b64 chars in a url from +/= to -_.
    secretElement = secrets.token_hex(6)
    filename = secure_filename(f'{encodedInfo}_{secretElement}.png')
    try:
        allowedFormats = {'png', 'jpg', 'jpeg'}
        if not verifyFileFormat(filename, allowedFormats):
            return None
        img.save(os.path.join(f"{app.config['UPLOAD_FOLDER']}{IMAGE_DIRECTORY}", filename))

    except Exception as err:
        print(err)

    return filename

#Checks if file format is accepted
def verifyFileFormat(filename, allowedFormats):
    if filename.split('.')[1] in allowedFormats:
        return True
    return False

#formats the image - resizes, changes format, compresses, etc - so it can be efficiently stored
def formatImage(img):
    #Add more here if necessary
    return img


# - Function called to submit a project object to the DB -
def submitProject(userSessionToken, form, files):
    successCode = 401
    if(checkAccessLevel(userSessionToken, "addProject")):
        try:
            columns, values = getQueryColumnsValues(userSessionToken, form, files)
            response = executeQuery(f"INSERT INTO projects ({','.join(columns)}) VALUES ({getSqlPlaceholders(values)})", values) 
            if (response.get('error',False)):
                successCode = 500
            else:
                successCode = 200
        except Exception as err:
            print(err)
            successCode = 500
    return successCode


# In the project query builder, in the case of a %s, 
# there is a seperate array 'reqValues' which refers
# to what this placeholder value is supposed to be
def getValueFromType(valueType, userInfo):
    match valueType:
        case "userUID":
            return userInfo["userId"]
    return None
        

# Retrieval
def getReadColumns(userInfo = None, values = None):
    values = [] if values == None else values
    dbColumns = []
    colNames = []
    colTypes = []
    
    for key, field in globalProjectStructure['fields'].items():
        if ((field.get("valType",False) != False) and (field.get("dbColRead",False) != False) ): #and (("reqValues" in field) == (userInfo != None)) # If readable and if a (reqValue + userValue) Or (No reqValue and No uservalue)
            colNames.append(key) 
            dbColumns.append(field["dbColRead"])
            colTypes.append(field["valType"])

            if (field.get("reqValues",False)):
                for valueType in field["reqValues"]:
                    values.append(getValueFromType(valueType, userInfo))


    return dbColumns, colNames, colTypes, values

def buildProjectObject(projRow, colNames, colTypes):
    projectObj = {}
    for key in globalProjectStructure['fields']:
        idx = indexOf(colNames, key)
        if idx != -1: 
            try:
                match (colTypes[idx]):
                    case "int":
                        projectObj[key] = int(projRow[idx]) if projRow[idx] != None else None
                    case "date":
                        projectObj[key] = formatDateTime(projRow[idx])
                    case "multiSelect":
                        projectObj[key] = list(projRow[idx])
                    case _:
                        projectObj[key] = projRow[idx]
            except:
                projectObj[key] = None
    return projectObj

def buildProjectSearchQuery(userInfo, queryParams, overrideLimit):
    # Get Column info
    dbColumns, colNames, colTypes, values = getReadColumns(userInfo)
    # Adding further default columns
    dbColumns.append(projectRankingFormulae)
    colNames.append('ranking')
    colTypes.append('int')

    # Get joins required for above data retrieval
    joins = globalProjectStructure['joins']

    # Get searching Info    
    whereConstraints = []
    if (queryParams.get("userOwned",False) == True):
        whereConstraints.append("prj.owner_id = %s")
        values.append(userInfo["userId"])
    if (queryParams.get("userJoined",False) == True):
        values.append(userInfo["userId"])
        whereConstraints.append("EXISTS(SELECT * FROM projects_participants as part WHERE part.project_id = prj.id AND part.user_id = %s) = 1")
    if (queryParams.get("onlyPinned",False) == True):
        values.append(userInfo["userId"])
        whereConstraints.append("EXISTS(SELECT * FROM projects_pinned as pin WHERE pin.project_id = prj.id AND pin.user_id = %s) = 1")
    
    if (queryParams.get("searchTerm",False)):
        values.append(f"%{queryParams['searchTerm']}%") #Format to use the mysql like % symbol (regardless of char before/after % symbol)
        whereConstraints.append("prj.title LIKE %s")
    
    if (queryParams.get("yearGroup",False) != False): #if the yearGroup specified in the params exists
        values.append(f"%{queryParams['yearGroup']}%") 
        whereConstraints.append("prj.years LIKE %s")
    
    if (queryParams.get("onlyApproved",False)):
        None
    
    # Limits, offset and ordering by rank-
    limit = "" if overrideLimit else f"LIMIT {queryParams.get('after',0)}, {queryParams['limit'] if queryParams.get('limit',globalMaxRequestProjectsLimit) < globalMaxRequestProjectsLimit else globalMaxRequestProjectsLimit}"
    orderBy = 'ORDER BY ranking ASC' # LARGEST RANKING AT THE TOP

    # Combine all parts for the final query
    query = f"SELECT {', '.join(dbColumns)} FROM projects AS prj {' '.join(joins)} {'WHERE ' if len(whereConstraints) > 0 else ''}{' AND '.join(whereConstraints)} {orderBy} {limit}"
    return query, colNames, colTypes, values

# - Main function called to get a set of "paged" projects -
def getProjects(userInfo, queryParams, overrideLimit = False):
    query, colNames, colTypes, values = buildProjectSearchQuery(userInfo, queryParams, overrideLimit)
    queryResponse = executeQuery(query, values)
    if queryResponse.get("error", False):
        raise Exception("Error executing query")
    projectObjs = []
    for projRow in queryResponse["data"]:
        projectObjs.append(buildProjectObject(projRow, colNames, colTypes))
    return projectObjs

# Other Variations of getProjects

def getUserOwnedProjects(userInfo, queryParams): 
    queryParams["userOwned"] = True
    return getProjects(userInfo, queryParams, True)

def getUserJoinedProjects(userInfo, queryParams):
    queryParams["userJoined"] = True
    return getProjects(userInfo, queryParams, True)

# -- Further project based actions --
def getProjectParticipantCount(projectId):
    #try:
    queryResponse = executeQuery("SELECT count(*) as participant_count FROM projects_participants as pp WHERE pp.project_id = %s", [projectId])
    participantCount = queryResponse['data'][0][0]
    #except:
    #    participantCount = 0
    return participantCount

# These functions are called by the main projectAction() function (below). 

def pinProject(userInfo, projectId):
    # Adding to pinned projects table with a link to the userId and Project ID
    # Duplicate entries will not occur due to the UNIQUE constraint set in the DB, and the ignore clause in the query
    #https://www.w3schools.com/mysql/mysql_unique.asp    
    queryResponse = executeQuery("INSERT INTO projects_pinned (user_id, project_id) VALUES (%s, %s)", [userInfo['userId'], projectId])
    return {'pinned': True}, 200

def unPinProject(userInfo, projectId):
    queryResponse = executeQuery("DELETE FROM projects_pinned WHERE user_id = %s AND project_id = %s", [userInfo['userId'], projectId])
    return {'pinned': False}, 200

def joinProject(userInfo, projectId):
    #check if space still available in project

    queryResponse = executeQuery("INSERT INTO projects_participants (user_id, project_id) VALUES (%s, %s)", [userInfo['userId'], projectId])
    participantCount = getProjectParticipantCount(projectId)
    return {'joined': True, "participantCount": participantCount}, 200

def leaveProject(userInfo, projectId):
    queryResponse = executeQuery("DELETE FROM projects_participants WHERE user_id = %s AND project_id = %s", [userInfo['userId'], projectId])
    participantCount = getProjectParticipantCount(projectId)
    return {'joined': False, "participantCount": participantCount}, 200

def approveProject(userInfo, projectId):
    if (userInfo['accessLevel'] == 'admin'):
        queryResponse = executeQuery("UPDATE projects SET approved_by_id = %s WHERE id = %s", [userInfo['userId'], projectId])
        return {'approved': True}, 200
    return {}, 401

def unApproveProject(userInfo, projectId):
    if (userInfo['accessLevel'] == 'admin'):
        queryResponse = executeQuery("UPDATE projects SET approved_by_id = NULL WHERE id = %s", [projectId])
        return {'approved': False}, 200
    return {}, 401

def deleteProject(userInfo, projectId):
    if (userInfo['accessLevel'] == 'admin'):
        queryResponse = executeQuery("UPDATE projects SET deleted = 1 WHERE id = %s", [projectId])
        return {'deleted': True}, 200
    return {}, 401

def emailUsersOnProject(userInfo, projectId):
    if (userInfo['accessLevel'] == 'admin'):
        userEmails = getAllEmailAddresses(['student'])
        projectDetails = executeQuery("SELECT * FROM projects WHERE project_id = ?", [projectId])
        emailBody = f"""
JOIN CAS PROJECT {projectDetails}

"""        
        sendEmails
    return {}, 401

def projectAction(sessionKey, action, projectId):
    try:
        userInfo = getUserInfoFromSessionToken(sessionKey)
        match action:
            case 'pin':
                return pinProject(userInfo, projectId)
            case 'unpin':
                return unPinProject(userInfo, projectId)
            case 'join':
                return joinProject(userInfo, projectId)
            case 'leave':
                return leaveProject(userInfo, projectId)
            # Req admin priveliges
            case 'approve':
                return approveProject(userInfo, projectId)
            case 'unapprove':
                return unApproveProject(userInfo, projectId)
            case 'delete':
                return deleteProject(userInfo, projectId)
    except Exception as error:
        print(error)
        return {}, 500