# Handles all of the core email requests for this project
from .SQL import executeQuery
from .general import flattenArray
from ..globalConfig import *
from ..globalSecrets import *
import smtplib
from email.message import EmailMessage 

email_text = 'This is a test'

#By default only gets the email addresses for students
def getAllEmailAddresses(yearGroups, userType = ['student']): 
    response = executeQuery(f"SELECT email FROM users WHERE year_group in ({('%s,'*len(yearGroups))[:-1]}) AND access_level in ({('%s,'*len(userType))[:-1]})", flattenArray([yearGroups, userType]))
    return response['data']

# Core email Functionality
def sendEmails(emailSubject, emailBody, recipients, bccRecipients = []):

    message = EmailMessage() 
    message['Subject'] = emailSubject 
    message['From'] = GLOBAL_GOOGLE_EMAIL
    message['To'] = ",".join(recipients) #if len(recipients) != 0 else ''
    message['Bcc'] = ",".join(bccRecipients) #if len(bccRecipients) != 0 else ''
    message.set_content(emailBody)
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtpserver:
            smtpserver.ehlo()
            smtpserver.login(GLOBAL_GOOGLE_EMAIL, GLOBAL_GOOGLE_EMAIL_APP_PASSWORD)
            smtpserver.send_message(message) 
            smtpserver.close()
            return True
    except:
        print("Error sending mails")
    return False