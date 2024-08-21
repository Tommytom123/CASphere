from flask import Blueprint

# Defining a blueprint
general_static_bp = Blueprint(
    'general_static_bp', __name__,
    template_folder='templates',
    static_folder='static', static_url_path='/_general_static/static'
)
