from flask import Blueprint

# Defining a blueprint
general_static_bp = Blueprint(
    'general_static_bp', __name__,
    template_folder='templates',
    static_folder='static', static_url_path='/general_static/static'
)
