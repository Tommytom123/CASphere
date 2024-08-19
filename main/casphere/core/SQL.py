import mysql.connector

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
    if (connection == None):
        connection = globalDbConnectionPool.get_connection()
    cursor = connection.cursor()
    filteredValues = filterValues(values)
    response = cursor.execute(query, filteredValues)
    
    print(response)

#executeQuery("SELECT * FROM users")