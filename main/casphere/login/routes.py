
from flask import redirect, request, session, render_template, jsonify, Blueprint
import requests
from google.oauth2 import id_token
from google.auth.transport import requests
from ..globalConfig import *
from ..globalSecrets import *
from ..core.sessions import *
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
        userId = getuserId(googleAccObj = userInfo)
        if userId == None:
            print("create user")
            userId = createUser(googleAccObj = userInfo)
        session["TOKEN"] = createSession(userId, userInfo, session.get('TOKEN',None)) # Create a new session/reset old session if it already existed
        return jsonify({'status':200}) #Return succes
    return jsonify({'status':401}) #Return Not authorized

@login_bp.route("/logout", methods=['GET'])
def logout():
    if (session.get('TOKEN',None) != None):
        deleteSession(session["TOKEN"])
    return redirect("/login")



