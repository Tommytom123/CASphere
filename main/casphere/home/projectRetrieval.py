from ..globalConfig import *
from ..core.SQL import executeQuery

globalMaxRequestProjectsLimit = 20 # Maximum number of projects which can be requested at a time
projectRankingFormulae = '(RAND({seed}) + IF(prj.approved=1, 100,0)) AS ranking'

globalProjectStructure = { # Contains all the DB col names, names, join information (and required values)
    'fields':{
        'title': {
            'dbCol':'prj.title'
        }, 
        'description':{
            'dbCol':'prj.description'
        },
        'startDate':{
            'dbCol':'prj.start_date'
        },
        'img':{
            'dbCol':'prj.image'
        },
        'participantLim':{
            'dbCol':'prj.participant_limit'
        },
        'yearGroups':{
            'dbCol':'prj.year_groups'
        },
        'participants':{
            'dbCol':'(SELECT GROUP_CONCAT(prt.participants) as participants FROM project_participants AS prt ON prt.project_id = prj.id GROUP BY prj.id)'
        },
        'creator':{
            'dbCol':"CONCAT(cr.first_name, ' ', cr.last_name)"
        },
        'approved':{
            'dbCol':'prj.approved'
        },
        'pinned':{
            'dbCol':'EXISTS(SELECT * FROM pinned_projects as pin WHERE pin.project_id = prj.id AND = %s)',
            'reqValues':['userUID']
        }
    },
    'joins':[
        'LEFT JOIN users as cr ON prj.creator_id = cr.id'
    ]
}

def buildProjectSearchQuery(**kwargs):

    columnsDB = [projectRankingFormulae]
    columnsName = ['ranking']
    joins = ' '.join(globalProjectStructure['joins'])
    whereConstraints = []
    values = []
    # Get Column info
    for idx, key in enumerate(globalProjectStructure['fields'].keys()):
        columnsDB.append(globalProjectStructure['fields'][key]['dbCol'])
        columnsName.append(key)
        values.append
    # Get searching Info    
    
    # Limits and after-
    limit = f"LIMIT {kwargs['limit'] if kwargs.get('limit',globalMaxRequestProjectsLimit) < globalMaxRequestProjectsLimit else globalMaxRequestProjectsLimit}"
    after = f"AFTER {kwargs.get('after',0)}"
    orderBy = 'ORDER BY ranking DESC' # LARGEST RANKING AT THE TOP

    # Combine all parts for the final query
    query = f"SELECT {', '.join(columnsDB)} FROM projects {'WHERE' if len(whereConstraints) > 0 else ''} {', '.join(whereConstraints)} {orderBy} {limit} {after}"
    print(query)
    return query, values, columnsName


def getProjects(requestObj):
    query, columnsName = buildProjectSearchQuery(requestObj)
    queryResponse = executeQuery()

def buildProjectObject(projectArr):
    projectObj = {}
    for idx, key in enumerate(globalProjectStructure.keys()):
        projectObj[key] = projectArr[idx]
    return projectObj
