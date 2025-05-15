from flask import Blueprint
from flask_socketio import emit
import os
import base64
import cv2
import numpy as np
import tensorflow as tf
from insightface.app import FaceAnalysis

DEBUG = False

# Initialize RetinaFace detector
face_app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

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

            if all_faces:
                faces_batch = np.vstack(all_faces)  # shape: (num_faces, 224, 224, 3)
                predictions = model.predict(faces_batch)
                classes = ["Bored", "Interested", "Lacking_Focus"]
                for i, (prediction, box) in enumerate(zip(predictions, all_boxes)):
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

        # RetinaFace expects BGR images (OpenCV default)
        faces = face_app.get(img)
        if not faces:
            print("⚠️ No faces detected")
            return None, None

        all_faces = []
        all_boxes = []

        for face in faces:
            x1, y1, x2, y2 = [int(coord) for coord in face.bbox]
            # Expand the box a bit
            expand = 0.2
            w = x2 - x1
            h = y2 - y1
            x1 = max(0, int(x1 - w * expand / 2))
            y1 = max(0, int(y1 - h * expand / 2))
            x2 = min(img.shape[1], int(x2 + w * expand / 2))
            y2 = min(img.shape[0], int(y2 + h * expand / 2))

            face_crop = img[y1:y2, x1:x2]
            if face_crop.size == 0:
                continue
            face_crop = cv2.resize(face_crop, (224, 224), interpolation=cv2.INTER_AREA)
            face_crop = face_crop.astype("float32") / 255.0
            all_faces.append(np.expand_dims(face_crop, axis=0))
            all_boxes.append([x1, y1, x2 - x1, y2 - y1])

        return (all_faces, all_boxes) if all_faces else (None, None)

    except Exception as e:
        print("❌ Error processing image:", str(e))
        return None, None