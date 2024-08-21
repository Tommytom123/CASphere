import datetime as dt


# Functions to format a datetime object to be used in the DB
def formatDateTime(dateTime): 
    return dateTime.strftime('%Y-%m-%d %H:%M:%S')

def formatDate(date):
    return date.strftime('%Y-%m-%d')