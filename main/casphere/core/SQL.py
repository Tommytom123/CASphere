
import mysql.connector
#from ..globalConfig import *

globalDbConnectionPool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name = "CASpherePool",
    pool_size = 8,
    host="localhost",
    user="root",
    password="root",
    database="casphere"
)

# Filter to remove all HTML or other characters that could break the frontend rendering
globalToReplaceArr = [['<','['],['>',']']]

def replaceStringChars(str):
    for replaceItems in globalToReplaceArr:
        str = str.replace(replaceItems[0], replaceItems[1])
    return str.strip()
    
def filterValues(values):
    try:
        # I had initially assumed that the values could be passed as a multi dimensional arr to avoid writing multiple %s's
        # However that is not the case, instead it is a flattened arr where each idx corresponds with one %s and thus this IF statement is never true
        if (type(values) is list): 
            for i in range(len(values)):
                values[i] = filterValues(values[i])
            return values
        
        elif (type(values) is str): # base case
            return replaceStringChars(values)

        else: # If int or other datatype that doesn't need replacing -> Base case
            return values
           
    except Exception as err:
        print(err)
        return None

def executeQuery(query, values = None, connection = None):
    try:
        commitQuery = False
        if (connection == None):
            connection = globalDbConnectionPool.get_connection()
            commitQuery = True
        cursor = connection.cursor()
        filteredValues = filterValues(values)
        #print("\n")
        #print(query)
        #print(filteredValues)
        #print("\n")
        cursor.execute(query, filteredValues)
        response = cursor.fetchall()
        primaryKey = cursor.lastrowid
        if commitQuery:
            connection.commit()
        connection.close()
        return {'data':response, 'dbKey':primaryKey}
    except:
        return None
#print(executeQuery("SELECT * FROM users WHERE first_name = %s", ['Bob']))