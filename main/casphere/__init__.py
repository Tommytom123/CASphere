from flask import Flask


app = Flask(__name__)
app.config["SECRET_KEY"] = "0jkh43789thpq9hugvbuitft578yaerfuphhufp"


 

from casphere import routes

