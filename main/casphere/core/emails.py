# Handles all of the core email requests for this project
from .SQL import executeQuery
from ..globalConfig import *
from ..globalSecrets import *
import smtplib
from email.message import EmailMessage 

email_text = 'This is a test'

#By default only gets the email addresses for students
def getAllEmailAddresses(userType = ['student'], ): 
    response = executeQuery("SELECT email FROM users WHERE access_level in (?)", userType)
    print(response['data'])
    return response['data']

# Core email Functionality
def sendEmails(emailSubject, emailBody, recipients, bccRecipients = []):
    message = EmailMessage() 
    message['Subject'] = emailSubject 
    message['From'] = GLOBAL_GOOGLE_EMAIL
    message['To'] = ",".join(recipients)
    message['Bcc'] = ",".join(bccRecipients)
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