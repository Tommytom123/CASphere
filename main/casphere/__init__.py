from flask import Flask
from .globalConfig import *

app = Flask(__name__)
app.config["SECRET_KEY"] = FLASK_SECRET

# https://www.freecodecamp.org/news/how-to-use-blueprints-to-organize-flask-apps/
# https://flask.palletsprojects.com/en/3.0.x/blueprints/
from .login import routes
app.register_blueprint(routes.login_bp)

from .home import routes
app.register_blueprint(routes.home_bp)

from ._general_static import routes
app.register_blueprint(routes.general_static_bp)

