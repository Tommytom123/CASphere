from flask import redirect, request, session, render_template, jsonify, Blueprint
from ..globalConfig import *
from .project import *
from ..core.sessions import *

#https://flask.palletsprojects.com/en/3.0.x/errorhandling/

home_bp = Blueprint(
    'home_bp', __name__,
    template_folder='templates',
    static_folder='static', static_url_path='/home/static'
)

# - Server Calls - 
@home_bp.route("/home", methods=['GET'])
def home():          
    if ("TOKEN" in session):
        userDetails = getUserInfoFromSessionToken(session["TOKEN"])
        if userDetails:              
            return render_template("home.html",
                                name = userDetails["fullName"]
                                )  
    return redirect("/login")

#Data calls
@home_bp.route("/getUserObj", methods=['POST'])
def getUserObjReq():
    userObj = getUserInfoFromSessionToken(session["TOKEN"])
    return userObj, None if not userObj else 200

@home_bp.route("/assignYearGroup", methods=['POST'])
def assignYearGroupReq():
    responseCode = assignYearGroupFromSessionToken(session["TOKEN"], request.json['newYearGroup'])
    return {'action':'assignYearGroup'}, responseCode

@home_bp.route("/submitProject", methods=['POST'])
def submitProjectReq():
    responseCode = submitProject(session["TOKEN"], request.form, request.files)
    return {'action':'submitProject'}, responseCode


@home_bp.route("/getProjects", methods=['POST'])
def getProjectsReq():
    projectObjs = getProjects(**request.json)
    return {'projects':projectObjs}, 200

