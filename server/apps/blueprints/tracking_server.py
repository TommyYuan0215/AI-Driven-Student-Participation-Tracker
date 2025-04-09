from flask import Blueprint
from flask_socketio import emit
import os
import base64
import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp

DEBUG = False

# Initialize MediaPipe face detection
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(min_detection_confidence=0.3)

# Load emotion recognition model
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "emotion_recognition_model.h5"))
model = tf.keras.models.load_model(model_path, compile=False)

previous_boxes = {}

def smooth_box(new_box, face_id, alpha=0.2):
    global previous_boxes
    if face_id not in previous_boxes:
        previous_boxes[face_id] = new_box
        return new_box

    smoothed_box = [
        alpha * new + (1 - alpha) * old
        for new, old in zip(new_box, previous_boxes[face_id])
    ]

    previous_boxes[face_id] = smoothed_box
    return [int(coord) for coord in smoothed_box]

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
        if DEBUG:
            print("🟢 Received video frame!")

        frame_data = data.get("frame")
        detect_multiple = data.get("detectMultiple", False)

        if frame_data:
            result = preprocess_image(frame_data, detect_multiple)

            if result is None or result[0] is None:
                if DEBUG:
                    print("⚠️ No face detected in frame.")
                emit("tracking_update", {"faces": []}, broadcast=True)
                return

            all_faces, all_boxes = result
            results = []

            for i, (img, box) in enumerate(zip(all_faces, all_boxes)):
                prediction = model.predict(img)
                classes = ["Bored", "Interested", "Lacking_Focus"]
                predicted_label = classes[np.argmax(prediction)]
                confidence = float(np.max(prediction))

                results.append({
                    "label": predicted_label,
                    "confidence": confidence,
                    "box": box,
                    "id": i
                })

            if DEBUG:
                print(f"📦 Emitting {len(results)} face(s) detected")

            emit("tracking_update", {"faces": results}, broadcast=True)

    return tracking_route

def preprocess_image(image_data, detect_multiple=True):
    try:
        # Decode image
        header, encoded = image_data.split(",", 1)
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            print("❌ Error: Image decoding failed!")
            return None, None

        # Convert to grayscale and equalize histogram to improve face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        # Convert back to RGB for face detection
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Use multiple detection strategies
        detections = []
        
        # MediaPipe Detection (Short Range)
        with mp_face_detection.FaceDetection(
            min_detection_confidence=0.3,
            model_selection=1  # Full range model
        ) as face_detector:
            mp_results = face_detector.process(img_rgb)
            if mp_results.detections:
                detections.extend(mp_results.detections)

        # Optional: Additional Detection Methods
        # You could add more detection methods here, such as:
        # - Haar Cascade Classifier
        # - DNN-based face detectors
        
        if not detections:
            print("⚠️ No faces detected")
            return None, None

        h_img, w_img, _ = img.shape
        all_faces = []
        all_boxes = []

        # Process all detected faces
        for detection in detections:
            bboxC = detection.location_data.relative_bounding_box

            # Compute absolute coordinates
            x = max(0, int(bboxC.xmin * w_img))
            y = max(0, int(bboxC.ymin * h_img))
            box_w = min(int(bboxC.width * w_img), w_img - x)
            box_h = min(int(bboxC.height * h_img), h_img - y)

            # Expand detection box slightly
            expand_factor = 1.3
            x_expanded = max(0, int(x - (box_w * (expand_factor - 1) / 2)))
            y_expanded = max(0, int(y - (box_h * (expand_factor - 1) / 2)))
            w_expanded = min(int(box_w * expand_factor), w_img - x_expanded)
            h_expanded = min(int(box_h * expand_factor), h_img - y_expanded)

            # Crop face region
            face_crop = img[y_expanded:y_expanded+h_expanded, x_expanded:x_expanded+w_expanded]

            if face_crop.size == 0:
                print(f"❌ Error: Face crop is empty!")
                continue

            # Resize with better interpolation
            face_crop = cv2.resize(face_crop, (224, 224), interpolation=cv2.INTER_AREA)
            face_crop = face_crop.astype("float32") / 255.0

            all_faces.append(np.expand_dims(face_crop, axis=0))
            all_boxes.append([x_expanded, y_expanded, w_expanded, h_expanded])

        return (all_faces, all_boxes) if all_faces else (None, None)

    except Exception as e:
        print("❌ Error processing image:", str(e))
        return None, None