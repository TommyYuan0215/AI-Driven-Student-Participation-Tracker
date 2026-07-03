import eventlet
eventlet.monkey_patch()

from apps import create_app, socketio

app = create_app()

if __name__ == "__main__":
    # Production: this block is not used (Gunicorn is the process manager).
    # For local direct-run only — debug mode is intentionally disabled.
    socketio.run(app, host='0.0.0.0', port=5555, debug=False)