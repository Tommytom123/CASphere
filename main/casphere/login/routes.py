
from flask import redirect, request, session, render_template, jsonify, Blueprint
import requests
from google.oauth2 import id_token
from google.auth.transport import requests
from ..globalConfig import *
from ..core.SQL import executeQuery

# Error codes: https://www.w3.org/Protocols/HTTP/HTRESP.html

# Defining a blueprint
login_bp = Blueprint(
    'login_bp', __name__,
    template_folder='templates',
    static_folder='static', static_url_path='/login/static'
)

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

@login_bp.route("/", methods=['GET'])
def main():                              
    return redirect("/login")

@login_bp.route("/login", methods=['GET'])
def login():
    return render_template("login.html")

@login_bp.route("/login/callback", methods=['POST'])
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

@login_bp.route("/logout", methods=['GET'])
def logout():
    return render_template("login.html")



