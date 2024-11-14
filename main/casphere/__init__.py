from flask import Flask
from .globalConfig import *
from .globalSecrets import *

app = Flask(__name__)
app.config["SECRET_KEY"] = FLASK_SECRET
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'casphere/_general_static/static/uploads'

# https://www.freecodecamp.org/news/how-to-use-blueprints-to-organize-flask-apps/
# https://flask.palletsprojects.com/en/3.0.x/blueprints/
from .login import routes
app.register_blueprint(routes.login_bp)

from .home import routes
app.register_blueprint(routes.home_bp)

from ._general_static import routes
app.register_blueprint(routes.general_static_bp)

