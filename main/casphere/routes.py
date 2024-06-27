from casphere import app
import pandas as pd
import requests
import json
from flask import Flask, redirect, request, session, render_template, jsonify, url_for
import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests
# Error codes: https://www.w3.org/Protocols/HTTP/HTRESP.html

# Google OAuth Secrets
CLIENT_ID = '300028427783-2mnga77mhs3dcrl36rmsk8to8bc9dk0v.apps.googleusercontent.com'
CLIENT_SECRET = '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'

# Helper functions
def decode_jwt(token):
    try:
        # Specify the CLIENT_ID of the app that accesses the backend:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        return idinfo
    except ValueError:
        # Invalid token
        return None

# - Server Calls - 

@app.route("/", methods=['GET'])
def main():                              
    return redirect("/login")

@app.route("/home", methods=['GET'])
def home():          
    if "loggedIn" in session:              
        return render_template("home.html")
    return redirect("/login")

@app.route("/login", methods=['GET'])
def login():
    return render_template("login.html")

@app.route("/login/callback", methods=['POST'])
def loginCallback():
    authToken = request.json["authToken"]
    userInfo = decode_jwt(authToken)
    if userInfo != None: #if Google account authorised
        print(userInfo)
        # Add user info to session
        # Check if user already exists in db (Create account if neccecary)
        
        session['loggedIn'] = True
        session['fullName'] = userInfo["name"]
        session['email'] = userInfo["email"] # 
        session["userID"] = 149835 # Key in database
        session["secret"] = "h9ht39h" # Generated secret which matches database user info
        
        return jsonify({'status':200}) #Return succes
    return jsonify({'status':401}) #Return Not authorized

@app.route("/logout", methods=['POST'])
def logout():
    return render_template("login.html")



if __name__ == "__main__":
    app.run(ssl_context="adhoc")
