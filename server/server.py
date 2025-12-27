import eventlet
eventlet.monkey_patch()

from apps import create_app, socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5555, debug=True, allow_unsafe_werkzeug=True)