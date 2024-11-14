
import mysql.connector
from .general import replaceStringChars
from ..globalConfig import *
from ..globalSecrets import *

#https://dev.mysql.com/doc/connector-python/en/connector-python-connectargs.html
globalDbConnectionPool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name = "CASpherePool",
    pool_size = 8,
    host="localhost",
    user="root",
    password="root",
    database="casphere"#,
    #raw=True
)

# Filter to remove all HTML or other characters that could break the frontend rendering
globalToReplaceArr = [['<','['],['>',']']]

def filterValues(values):
    try:
        # I had initially assumed that the values could be passed as a multi dimensional arr to avoid writing multiple %s's
        # However that is not the case, instead it is a flattened arr where each idx corresponds with one %s and thus this IF statement is never true
        if (type(values) is list): 
            for i in range(len(values)):
                values[i] = filterValues(values[i])
            return values
        
        elif (type(values) is str): # base case
            return replaceStringChars(values, globalToReplaceArr)

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
        cursor.execute(query, filteredValues)
        response = cursor.fetchall()
        rowId = cursor.lastrowid
        if commitQuery:
            connection.commit()
        connection.close()
        return {'data':response, 'rowId':rowId}
    except Exception as err:
        print(err)
        print(query)
        print(filteredValues)
        return {'data':None, 'rowId':None, 'error':True}
#print(executeQuery("SELECT * FROM users WHERE first_name = %s", ['Bob']))