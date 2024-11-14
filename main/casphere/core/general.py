import datetime as dt


# Functions to format a datetime object to be used in the DB
def formatDateTime(dateTime): 
    return dateTime.strftime('%Y-%m-%d %H:%M:%S')

def formatDate(date):
    return date.strftime('%Y-%m-%d')

#Flattens a 2d array to 1d
def flattenArray(arr):
    newArr = []
    for item in arr:
        if (type(item)) == list:
            for subItem in item:
                newArr.append(subItem)
            continue
        newArr.append(item)
    return newArr

def getSqlPlaceholders(arr):
    paramStr = '%s,' * len(arr)
    return paramStr[:-1] # Removes the trailing comma

def indexOf(arr, val):
    for i in range(len(arr)):
        if arr[i] == val:
            return i
    return -1 #Doesn't exist. We can't return false -> Since python != or == does not do strict type matching (like in js), as when checking if it exists and idx of 0 would == False

# Replaces
def replaceStringChars(str, toReplaceArr):
    for replaceItems in toReplaceArr:
        str = str.replace(replaceItems[0], replaceItems[1])
    return str.strip()