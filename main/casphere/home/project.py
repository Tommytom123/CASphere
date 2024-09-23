from ..globalConfig import *
from ..core.SQL import executeQuery
from ..core.general import flattenArray, getSqlPlaceholders, formatDateTime, indexOf
from ..core.sessions import getUserInfoFromSessionToken
import datetime as dt

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
        #'img':{
        #    'dbColRead':'prj.image',
        #    'dbColInsert':'image',
        #    'valType': 'img', # What is inserted into the DB is a random Gen of the 
        #    'formFieldName': ''
        #},
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
            'formFieldName': ["yearGroupCheckbox_1","yearGroupCheckbox_2","yearGroupCheckbox_3","yearGroupCheckbox_4","yearGroupCheckbox_5"]
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
        'participants':{
            'dbColRead':'(SELECT GROUP_CONCAT(prt.participants) as participants FROM project_participants AS prt ON prt.project_id = prj.id GROUP BY prj.id)',

        },
        'maxParticipants':{
            'dbColRead':'prj.max_participant_count',
            'dbColInsert':'max_participant_count',
            'valType': 'int',
            'formFieldName': 'maxParticipantsInput'
        },
        'approved_by_id':{
            'dbColRead':'prj.approved_by_id'
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
        'LEFT JOIN users AS own ON prj.owner_id = own.id'
    ]
}

# Check user acess level
def checkAccessLevel(userSessionToken, action): # Still needs to be implemented
    return True

def formatFormValues(field, form, files):
    match (field["valType"]):
        case 'text':
            return form[field["formFieldName"]]
        case 'radioBtn':
            return form[field["formFieldName"]]
        case 'multiSelect': # The multiselect returns each checkbox as a seperate field if checked in the form values
            selected = ''
            for select in field['formFieldName']:
                if (form.get(select, False) != False):
                    select += form[select]
            return selected
        case 'img':
            return 'image'
        case _:
            return form.get(field["formFieldName"], None)
        
#Get the column and values for the query UPDATE/INSERT format
def getQueryColumnsValues(userSessionToken, form, files):
    columns = []
    values = []
    for Token, field in globalProjectStructure['fields'].items():
        try:
            if (field.get("valType",False) != False):
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
        except:
            print(field)
    return columns, values

#Submitting
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
    
    if (queryParams.get("onlyApproved",False)):
        None
    if (queryParams.get("onlyApproved",False)):
        None
    
    # Limits, offset and ordering by rank-
    limit = "" if overrideLimit else f"LIMIT {queryParams.get('after',0)}, {queryParams['limit'] if queryParams.get('limit',globalMaxRequestProjectsLimit) < globalMaxRequestProjectsLimit else globalMaxRequestProjectsLimit}"
    orderBy = 'ORDER BY ranking ASC' # LARGEST RANKING AT THE TOP

    # Combine all parts for the final query
    query = f"SELECT {', '.join(dbColumns)} FROM projects AS prj {' '.join(joins)} {'WHERE ' if len(whereConstraints) > 0 else ''}{' AND '.join(whereConstraints)} {orderBy} {limit}"
    return query, colNames, colTypes, values

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
# These functions are called by the main projectAction() function. 

def pinProject(userObj, projectId):
    # Adding to pinned projects table with a link to the userId and Project ID
    # Duplicate entries will not occur due to the UNIQUE constraint set in the DB, and the ignore clause in the query
    #https://www.w3schools.com/mysql/mysql_unique.asp    
    queryResponse = executeQuery("INSERT INTO projects_pinned (user_id, project_id) VALUES (%s, %s)", [userObj['userId'], projectId])
    return {'pinned': True}, 200

def unPinProject(userObj, projectId):
    queryResponse = executeQuery("DELETE FROM projects_pinned WHERE user_id = %s AND project_id = %s", [userObj['userId'], projectId])
    return {'pinned': False}, 200

def joinProject(userObj, projectId):
    queryResponse = executeQuery("INSERT INTO projects_participants (user_id, project_id) VALUES (%s, %s)", [userObj['userId'], projectId])
    return {'joined': True}, 200

def leaveProject(userObj, projectId):
    queryResponse = executeQuery("DELETE FROM projects_participants WHERE user_id = %s AND project_id = %s", [userObj['userId'], projectId])
    return {'joined': False}, 200

def approveProject(userObj, projectId):
    return

def deleteProject(userObj, projectId):
    return 

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
            case 'delete':
                return deleteProject(userInfo, projectId)
    except:
        return {}, 500