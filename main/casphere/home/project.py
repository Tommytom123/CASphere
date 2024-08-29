from ..globalConfig import *
from ..core.SQL import executeQuery
from ..core.general import flattenArray, getSqlPlaceholders, formatDateTime, indexOf
import datetime as dt

globalMaxRequestProjectsLimit = 3 # Maximum number of projects which can be requested at a time
projectRankingFormulae = '(IF(prj.approved_by_id is not null, 100,0) + day(prj.date_start)) AS ranking'

# Contains all the DB col names, names, join information (and required values)
#   For fields that have a manual entry (In the form) the formType and formFieldName are required for processing -> Seen in 
globalProjectStructure = { 
    'fields':{
        'title': {
            'dbColRead':'prj.title',
            'dbColInsert':'title',
            'formType': 'text',
            'formFieldName': 'addProjectTitle'
        }, 
        'description':{
            'dbColRead':'prj.description',
            'dbColInsert':'description',
            'formType': 'text',
            'formFieldName': 'addProjectDescription'
        },
        'startDate':{
            'dbColRead':'prj.date_start',
            'dbColInsert':'date_start',
            'formType': 'date',
            'formFieldName': 'addProjectStartDate'
        },
        'endDate':{
            'dbColRead':'prj.date_end',
            'dbColInsert':'date_end',
            'formType': 'date',
            'formFieldName': 'addProjectEndDate'
        },
        #'img':{
        #    'dbColRead':'prj.image',
        #    'dbColInsert':'image',
        #    'formType': 'img',
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
            'formType': 'radioBtn',
            'formFieldName': 'strandRadio'
        },
        'years':{
            'dbColRead':'prj.years',
            'dbColInsert':'years',
            'formType': 'multiSelect',
            'formFieldName': ["yearGroupCheckbox_1","yearGroupCheckbox_2","yearGroupCheckbox_3","yearGroupCheckbox_4","yearGroupCheckbox_5"]
        },
        'location':{
            'dbColRead':'prj.location',
            'dbColInsert':'location',
            'formType': 'text',
            'formFieldName': "addProjectLocation"
        },
        'owner':{
            'dbColRead':"CONCAT(own.first_name, ' ', own.last_name)",
            'dbColInsert':'owner_id',
            'formType': 'int',
            'insertFK': {'query':'SELECT u.id FROM users AS u JOIN active_sessions as acts ON acts.user_id = u.id WHERE acts.unique_key = %s', 'value':'sessionKey'}
        },
        'uploadedDate':{
            'dbColRead':'prj.uploaded_date',
            'dbColInsert':'uploaded_date',
            'formType': 'date',
            'default': lambda : formatDateTime(dt.datetime.now())
        },
        'participants':{
            'dbColRead':'(SELECT GROUP_CONCAT(prt.participants) as participants FROM project_participants AS prt ON prt.project_id = prj.id GROUP BY prj.id)',
        },
        'maxParticipants':{
            'dbColRead':'prj.max_participant_count',
            'dbColInsert':'max_participant_count',
            'formType': 'int',
            'formFieldName': 'maxParticipantsInput'
        },
        'approved_by_id':{
            'dbColRead':'prj.approved_by_id'
        },
        'pinned':{
            'dbColRead':'EXISTS(SELECT * FROM pinned_projects as pin WHERE pin.project_id = prj.id AND = %s)',
            'reqValues':['userUID']
        }

    },
    'joins':[
        'LEFT JOIN users as own ON prj.owner_id = own.id'
    ]
}

# Check user acess level
def checkAccessLevel(userSessionKey, action): # Still needs to be implemented
    return True

def formatFormValues(field, form, files):
    match (field["formType"]):
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
def getQueryColumnsValues(userSessionKey, form, files):
    columns = []
    values = []
    for key, field in globalProjectStructure['fields'].items():
        try:
            if (field.get("formType",False) != False):
                # If the value needs to be inserted into a seperate table (Eg: in a many-many instance)
                    # Not implemented as of yet
                    
                # If the value is a FK-Primary Key link
                if (field.get("insertFK",False) != False):
                    match (field['insertFK']["value"]):
                        case "sessionKey":
                            queryValue = userSessionKey
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
def submitProject(userSessionKey, form, files):
    successCode = 401
    if(checkAccessLevel(userSessionKey, "addProject")):
        try:
            columns, values = getQueryColumnsValues(userSessionKey, form, files)
            response = executeQuery(f"INSERT INTO projects ({','.join(columns)}) VALUES ({getSqlPlaceholders(values)})", values) 
            print(response)
            if (response.get('error',False)):
                successCode = 500
            else:
                successCode = 200
        except Exception as err:
            print(err)
            successCode = 500
    return successCode

# Retrieval
def getReadColumns():
    dbColumns = []
    colNames = []
    colTypes = []
    for key, field in globalProjectStructure['fields'].items():
        if ((field.get("formType",False) != False) and (field.get("dbColRead",False) != False)):
                colNames.append(key)
                dbColumns.append(field["dbColRead"])
                colTypes.append(field["formType"])
    return dbColumns, colNames, colTypes

def buildProjectSearchQuery(**kwargs):
    # Get Column info
    dbColumns, colNames, colTypes = getReadColumns()

    # Adding further default columns
    dbColumns.append(projectRankingFormulae)
    colNames.append('ranking')
    colTypes.append('int')

    # Get joins required for above data retrieval
    joins = globalProjectStructure['joins']

    # Get searching Info    
    whereConstraints = []
    values = []
    
    # Limits, offset and ordering by rank-
    limit = f"LIMIT {kwargs.get('after',0)}, {kwargs['limit'] if kwargs.get('limit',globalMaxRequestProjectsLimit) < globalMaxRequestProjectsLimit else globalMaxRequestProjectsLimit}"
    #https://www.geeksforgeeks.org/sql-limit-clause/
    orderBy = 'ORDER BY ranking DESC' # LARGEST RANKING AT THE TOP

    # Combine all parts for the final query
    query = f"SELECT {', '.join(dbColumns)} FROM projects AS prj {' '.join(joins)} {'WHERE ' if len(whereConstraints) > 0 else ''}{', '.join(whereConstraints)} {orderBy} {limit}"
    return query, colNames, colTypes, values

def buildProjectObject(projRow, colNames, colTypes):
    projectObj = {}
    for key in globalProjectStructure['fields']:
        idx = indexOf(colNames, key)
        if idx != -1: 
            match (colTypes[idx]):
                case "int":
                    projectObj[key] = int(projRow[idx]) if projRow[idx] != None else None
                case "date":
                    projectObj[key] = formatDateTime(projRow[idx])
                case "multiSelect":
                    projectObj[key] = list(projRow[idx])
                case _:
                    projectObj[key] = projRow[idx]
    return projectObj

def getProjects(**kwargs):
    query, colNames, colTypes, values = buildProjectSearchQuery(**kwargs)
    queryResponse = executeQuery(query, values)
    if queryResponse.get("error", False):
         raise Exception("Error executing query")
    projectObjs = []
    for projRow in queryResponse["data"]:
        projectObjs.append(buildProjectObject(projRow, colNames, colTypes))
    return projectObjs