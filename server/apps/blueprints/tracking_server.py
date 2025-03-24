from flask import Blueprint
from flask_socketio import emit, SocketIO
import os
import base64
import cv2
import numpy as np
import tensorflow as tf

# Define the blueprint
tracking_route = Blueprint("tracking", __name__)

# Get the absolute path of the model file
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "emotion_recognition_model.h5"))

# Load the trained model
model = tf.keras.models.load_model(model_path)

# Function to preprocess images before passing them to the model
def preprocess_image(image_data):
    try:
        header, encoded = image_data.split(",", 1)  # Split base64 header
        print("Received image data, processing...")  # Debugging
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("Failed to decode image")
            return None

        img = cv2.resize(img, (224, 224))  # Ensure size is correct
        img = img / 255.0  # Normalize pixel values
        return np.expand_dims(img, axis=0)  # Add batch dimension
    except Exception as e:
        print("Error processing image:", str(e))
        return None


# WebSocket event handlers
socketio = SocketIO(cors_allowed_origins="*")

@socketio.on("connect")
def handle_connect():
    print("Client connected")

@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")

@socketio.on("video_frame")
def handle_video_frame(data):
    frame_data = data.get("frame")
    if frame_data:
        img = preprocess_image(frame_data)
        if img is not None:
            prediction = model.predict(img)

            # Assuming softmax output with emotion classes
            classes = ["Engaged", "Bored", "Confused", "Frustrated"]
            predicted_label = classes[np.argmax(prediction)]
            confidence = float(np.max(prediction))

            # Generate a random bounding box (mock data, replace with actual face detection)
            box_x, box_y, box_w, box_h = 50, 50, 150, 150  

            emit("tracking_update", {
                "label": predicted_label,
                "confidence": confidence,
                "box": [box_x, box_y, box_w, box_h]
            }, broadcast=True)
