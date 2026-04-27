from flask import Flask, session, jsonify
from flask_socketio import SocketIO
from flask_session import Session
from flask_cors import CORS
from datetime import datetime, timedelta


# Create a Global SocketIO to passing the values to other blueprints
socketio = SocketIO(
      cors_allowed_origins=["http://localhost:5180", "http://127.0.0.1:5180"],
      allow_credentials=True,
      ping_interval=25,  
      ping_timeout=60    
  )
SESSION_TIMEOUT = timedelta(hours=3)

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = 'mysecret'
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['PERMANENT_SESSION_LIFETIME'] = SESSION_TIMEOUT
    app.config['SESSION_REFRESH_EACH_REQUEST'] = False  # Prevent auto-refresh

    # Allow all origins
    CORS(app, resources={r"/*": {"origins": ["http://localhost:5180", "http://127.0.0.1:5180"]}}, supports_credentials=True)

    # Initialize extensions
    socketio.init_app(app)
    Session(app)
    
    # Enfore session timeout before every request
    @app.before_request
    def enforce_session_timeout():
        if "last_activity" in session:
            last_active = datetime.fromisoformat(session["last_activity"])
            if datetime.utcnow() - last_active > SESSION_TIMEOUT:
                session.clear()  # Expire session
                return jsonify({"status": "error", "message": "Session expired. Please log in again."}), 401

        # 🔥 Update session activity timestamp
        session["last_activity"] = datetime.utcnow().isoformat()
    
    # Register blueprints (import AFTER app creation to avoid circular import)
    from apps.blueprints.database import databases_route
    from apps.blueprints.tracking_server import create_tracking_server
    from apps.blueprints.tracking_session import tracking_session_route
    from apps.blueprints.user_credential import userCredential_route
    from apps.blueprints.user_management import userManagement_route
    from apps.blueprints.content_management import contentManagement_route
    from apps.blueprints.settings import settings_route
    from apps.blueprints.report_generator import report_generator_route

    # Register blueprints based on the imported routes
    app.register_blueprint(databases_route, url_prefix='/database')
    app.register_blueprint(create_tracking_server(socketio), url_prefix='/tracking')
    app.register_blueprint(tracking_session_route, url_prefix='/tracking_session')
    app.register_blueprint(userCredential_route, url_prefix='/credential')
    app.register_blueprint(userManagement_route, url_prefix='/usermanagement')
    app.register_blueprint(contentManagement_route, url_prefix='/contentmanagement')
    app.register_blueprint(settings_route, url_prefix='/settings')
    app.register_blueprint(report_generator_route, url_prefix='/report_generator')

    return app