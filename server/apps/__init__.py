
from flask import Flask
from flask_socketio import SocketIO
from flask_session import Session
from flask_cors import CORS

# Create a Global SocketIO to passing the values to other blueprints
socketio = SocketIO(cors_allowed_origins=["http://localhost:5173"], allow_credentials=True)

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = 'mysecret'
    app.config['SESSION_TYPE'] = 'filesystem'

    # Allow all origins
    CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}}, supports_credentials=True)

    # Initialize extensions
    socketio.init_app(app)
    Session(app)
    
    # Register blueprints (import AFTER app creation to avoid circular import)
    from apps.blueprints.database import databases_route
    from apps.blueprints.tracking_server import create_tracking_server
    from apps.blueprints.user_credential import userCredential_route
    from apps.blueprints.user_management import userManagement_route
    from apps.blueprints.content_management import contentManagement_route
    from apps.blueprints.settings import settings_route

    # Register blueprints based on the imported routes
    app.register_blueprint(databases_route, url_prefix='/database')
    app.register_blueprint(create_tracking_server(socketio), url_prefix='/tracking')
    app.register_blueprint(userCredential_route, url_prefix='/credential')
    app.register_blueprint(userManagement_route, url_prefix='/usermanagement')
    app.register_blueprint(contentManagement_route, url_prefix='/contentmanagement')
    app.register_blueprint(settings_route, url_prefix='/settings')

    return app