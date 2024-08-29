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
    if ("KEY" in session):
        userDetails = getUserInfoFromSessionKey(session['KEY'])
        if userDetails:              
            return render_template("home.html",
                                name = userDetails["fullName"]
                                )  
    return redirect("/login")

#Data calls
@home_bp.route("/getUserObj", methods=['POST'])
def getUserObjReq():
    userObj = getUserInfoFromSessionKey(session["KEY"])
    return userObj, None if not userObj else 200

@home_bp.route("/assignYearGroup", methods=['POST'])
def assignYearGroupReq():
    responseCode = assignYearGroupFromSessionKey(session["KEY"], request.json['newYearGroup'])
    return {'action':'assignYearGroup'}, responseCode

@home_bp.route("/submitProject", methods=['POST'])
def submitProjectReq():
    responseCode = submitProject(session["KEY"], request.form, request.files)
    return {'action':'submitProject'}, responseCode


@home_bp.route("/getProjects", methods=['POST'])
def getProjectsReq():
    projectObjs = getProjects(**request.json)
    return {'projects':projectObjs}, 200

