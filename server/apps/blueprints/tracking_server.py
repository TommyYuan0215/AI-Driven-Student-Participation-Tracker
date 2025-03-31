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
previous_boxes = {}  

def smooth_box(new_box, face_id, alpha=0.2):
    """
    Apply exponential smoothing to stabilize the bounding box.
    Each face is tracked separately by its ID.
    """
    global previous_boxes
    
    if face_id not in previous_boxes:
        previous_boxes[face_id] = new_box  # First frame for this face
        return new_box

    # Apply Exponential Moving Average (EMA) smoothing
    smoothed_box = [
        alpha * new + (1 - alpha) * old
        for new, old in zip(new_box, previous_boxes[face_id])
    ]

    previous_boxes[face_id] = smoothed_box  # Update previous box
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
        detect_multiple = data.get("detectMultiple", False)
        
        if frame_data:
            result = preprocess_image(frame_data, detect_multiple)
            
            if result is None or result[0] is None:
                return
                
            all_faces, all_boxes = result
            
            # For single face mode
            if not detect_multiple:
                img = all_faces[0]
                box = all_boxes[0]
                
                prediction = model.predict(img)
                classes = ["Interested", "Bored", "Lacking_Focus"]
                predicted_label = classes[np.argmax(prediction)]
                confidence = float(np.max(prediction))

                print(f"📦 Emitting: Label={predicted_label}, Confidence={confidence}, Box={box}", flush=True)

                emit("tracking_update", {
                    "label": predicted_label,
                    "confidence": confidence,
                    "box": box
                }, broadcast=True)
            
            # For multiple face mode
            else:
                results = []
                for i, (img, box) in enumerate(zip(all_faces, all_boxes)):
                    prediction = model.predict(img)
                    classes = ["Interested", "Bored", "Lacking_Focus"]
                    predicted_label = classes[np.argmax(prediction)]
                    confidence = float(np.max(prediction))
                    
                    results.append({
                        "label": predicted_label,
                        "confidence": confidence,
                        "box": box,
                        "id": i  # Adding an ID can be useful for tracking
                    })
                
                print(f"📦 Emitting multiple faces: {len(results)} faces detected", flush=True)
                
                emit("tracking_update", results, broadcast=True)

    return tracking_route

# Image Preprocessing Function (with mediapipe face detection)
def preprocess_image(image_data, detect_multiple=False):
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
        
        all_faces = []
        all_boxes = []
        
        # Process either all detections or just the first one
        detections_to_process = results.detections if detect_multiple else [results.detections[0]]
        
        for detection in detections_to_process:
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

            # We need a separate smoothing for each face
            # This is simplified - you may want to track each face separately
            smoothed_box = [x, y, box_w, box_h]  # No smoothing for multiple faces for now

            # Crop and preprocess face
            face_crop = img[y:y+box_h, x:x+box_w]

            if face_crop.size == 0:
                print(f"❌ Error: Face crop is empty for detection at {x},{y}!")
                continue

            # Resize and normalize
            face_crop = cv2.resize(face_crop, (224, 224))
            face_crop = face_crop.astype("float32") / 255.0
            
            all_faces.append(np.expand_dims(face_crop, axis=0))
            all_boxes.append(smoothed_box)
        
        if not all_faces:
            return None, None
            
        return all_faces, all_boxes

    except Exception as e:
        print("❌ Error processing image:", str(e))
        return None, None