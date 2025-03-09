
from flask import Flask
from flask_socketio import SocketIO
from flask_session import Session
from flask_cors import CORS
from apps.blueprints.database import databases_route
# from apps.blueprints.vggface_model_test import vggface_model_route, init_socketio
from apps.blueprints.user_credential import userCredential_route
from apps.blueprints.user_management import userManagement_route
from apps.blueprints.content_management import contentManagement_route
from apps.blueprints.settings import settings_route

# Initialize Flask extensions
socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = 'mysecret'
    app.config['SESSION_TYPE'] = 'filesystem'

    # Allow all origins
    CORS(app, supports_credentials=True)

    # Initialize extensions
    socketio.init_app(app)
    Session(app)

    # Register blueprints based on the routes
    app.register_blueprint(databases_route, url_prefix='/database')
    # app.register_blueprint(vggface_model_route, url_prefix='/vggface')
    app.register_blueprint(userCredential_route, url_prefix='/credential')
    app.register_blueprint(userManagement_route, url_prefix='/usermanagement')
    app.register_blueprint(contentManagement_route, url_prefix='/contentmanagement')
    app.register_blueprint(settings_route, url_prefix='/settings')

    return app