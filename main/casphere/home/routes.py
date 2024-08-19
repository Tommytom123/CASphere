from flask import redirect, request, session, render_template, jsonify, Blueprint
from ..globalConfig import *
from ..core.SQL import executeQuery
from .projectRetrieval import *


home_bp = Blueprint(
    'home_bp', __name__,
    template_folder='templates',
    static_folder='static'
)

# - Server Calls - 
@home_bp.route("/home", methods=['GET'])
def home():          
    if "loggedIn" in session:              
        return render_template("home.html",
                               name = session["fullName"]
                               )
    return redirect("/login")

#Data calls
@home_bp.route("/getProjects", methods=['POST'])
def getProjects():
    requestObj = request.json
    response = {'status':401}
    
    batchSize = 20 if requestObj.batchSize >= 20 else requestObj.batchSize # Max of 20 project can be called at once
    randomSeed = requestObj.randomSeed #
    after = requestObj.after #

    queryResponse = [[],[]] #executeQuery("")
    projectsArr = []
    for project in queryResponse:
        projectsArr.append()

    return jsonify(response)

