
from apps import create_app, socketio

# Create the Flask app using the factory
app = create_app()

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)