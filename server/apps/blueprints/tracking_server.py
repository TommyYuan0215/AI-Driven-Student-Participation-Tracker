from flask import Blueprint
from flask_socketio import emit
import os
import base64
import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp

# Initialize the mediapipe face detection
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(min_detection_confidence=0.5)

# Load Model
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "emotion_recognition_model.h5"))
model = tf.keras.models.load_model(model_path, compile=False)

# Global tracking variable for smoothing
previous_box = None  

def smooth_box(new_box, alpha=0.2):
    """
    Apply exponential smoothing to stabilize the bounding box.
    """
    global previous_box
    
    if previous_box is None:
        previous_box = new_box  # First frame, no smoothing needed
        return new_box

    # Apply Exponential Moving Average (EMA) smoothing
    smoothed_box = [
        alpha * new + (1 - alpha) * old
        for new, old in zip(new_box, previous_box)
    ]

    previous_box = smoothed_box  # Update previous box
    return [int(coord) for coord in smoothed_box]  # Convert back to integers

def create_tracking_server(socketio):
    tracking_route = Blueprint("tracking", __name__)

    @socketio.on("connect")
    def handle_connect():
        print("✅ Client connected", flush=True)

    @socketio.on("disconnect")
    def handle_disconnect():
        print("❌ Client disconnected", flush=True)

    @socketio.on("video_frame")
    def handle_video_frame(data):
        print("🟢 Received video frame!", flush=True)

        frame_data = data.get("frame")
        if frame_data:
            img, box = preprocess_image(frame_data)
            
            if img is not None and box is not None:
                x, y, box_w, box_h = smooth_box(box)  # Apply smoothing

                prediction = model.predict(img)
                classes = ["Interested", "Bored", "Lacking_Focus"]
                predicted_label = classes[np.argmax(prediction)]
                confidence = float(np.max(prediction))

                print(f"📦 Emitting: Label={predicted_label}, Confidence={confidence}, Smoothed Box={[x, y, box_w, box_h]}", flush=True)

                emit("tracking_update", {
                    "label": predicted_label,
                    "confidence": confidence,
                    "box": [int(x), int(y), int(box_w), int(box_h)]
                }, broadcast=True)

    return tracking_route

# Image Preprocessing Function (with mediapipe face detection)
def preprocess_image(image_data):
    try:
        print("🔍 Raw Data Length:", len(image_data))

        # Decode Base64 image
        header, encoded = image_data.split(",", 1)
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            print("❌ Error: Image decoding failed!")
            return None, None

        # Convert to RGB (MediaPipe requires RGB format)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_detector.process(img_rgb)

        if not results.detections:
            print("⚠️ No face detected")
            return None, None

        h_img, w_img, _ = img.shape  # Get image dimensions

        # Extract bounding box from MediaPipe
        detection = results.detections[0]
        bboxC = detection.location_data.relative_bounding_box

        x = int(bboxC.xmin * w_img)
        y = int(bboxC.ymin * h_img)
        box_w = int(bboxC.width * w_img)
        box_h = int(bboxC.height * h_img)

        # Ensure bounding box is valid
        x = max(0, x)
        y = max(0, y)
        box_w = min(box_w, w_img - x)
        box_h = min(box_h, h_img - y)

        # Apply smoothing
        smoothed_box = smooth_box([x, y, box_w, box_h])

        # Crop and preprocess face
        face_crop = img[smoothed_box[1]:smoothed_box[1]+smoothed_box[3], 
                        smoothed_box[0]:smoothed_box[0]+smoothed_box[2]]

        if face_crop.size == 0:
            print("❌ Error: Face crop is empty!")
            return None, None

        # Resize and normalize
        face_crop = cv2.resize(face_crop, (224, 224))
        face_crop = face_crop.astype("float32") / 255.0

        return np.expand_dims(face_crop, axis=0), smoothed_box  # Return smoothed bounding box

    except Exception as e:
        print("❌ Error processing image:", str(e))
        return None, None