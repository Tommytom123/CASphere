from flask import redirect, request, session, render_template, jsonify, Blueprint
from ..globalConfig import *
from .projectRetrieval import *
from ..core.sessions import *

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
            return render_template("home2.html",
                                name = userDetails["fullName"],
                                userObject = userDetails
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

    queryResponse = [[],[]] 
    projectsArr = []
    for project in queryResponse:
        projectsArr.append()

    return jsonify(response)

