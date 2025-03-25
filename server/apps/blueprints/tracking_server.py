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
model = tf.keras.models.load_model(model_path, compile=False)

# Load Haar Cascade classifier for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Function to preprocess images before passing them to the model
def preprocess_image(image_data):
    try:
        header, encoded = image_data.split(",", 1)  # Split base64 header
        print("Received image data, processing...")  # Debugging
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("Failed to decode image")
            return None, None

        # Convert image to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detect faces using Haar Cascade
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        if len(faces) > 0:
            # Assuming we are interested in the first detected face
            x, y, w, h = faces[0]

            # Crop the face region for emotion prediction
            face_crop = img[y:y+h, x:x+w]
            face_crop = cv2.resize(face_crop, (224, 224))  # Resize to model input size
            face_crop = face_crop / 255.0  # Normalize pixel values
            return np.expand_dims(face_crop, axis=0), (x, y, w, h)
        else:
            print("No faces detected")
            return None, None
    except Exception as e:
        print("Error processing image:", str(e))
        return None, None


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
        img, box = preprocess_image(frame_data)
        if img is not None and box is not None:
            # Make emotion prediction
            prediction = model.predict(img)

            # Assuming softmax output with emotion classes
            classes = ["Engaged", "Bored", "Confused", "Frustrated"]
            predicted_label = classes[np.argmax(prediction)]
            confidence = float(np.max(prediction))

            # Send back the bounding box and emotion label
            emit("tracking_update", {
                "label": predicted_label,
                "confidence": confidence,
                "box": [*box]  # Send bounding box coordinates
            }, broadcast=True)
        else:
            # If no face is detected, send default data
            emit("tracking_update", {
                "label": "No face detected",
                "confidence": 0,
                "box": [0, 0, 0, 0]
            }, broadcast=True)