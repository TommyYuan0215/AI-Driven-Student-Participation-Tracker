import os
import base64
import cv2
import numpy as np
import ai_edge_litert.interpreter as litert 
from flask import Blueprint
from flask_socketio import emit
from insightface.app import FaceAnalysis

DEBUG = False

# Initialize RetinaFace detector
# Using CPUExecutionProvider as typical for headless laptop setups
face_app = FaceAnalysis(name="buffalo_s", providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=-1, det_size=(640, 640))

# Load emotion recognition LiteRT model
# Adjusted to ensure absolute path resolution
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(BASE_DIR, "models", "emotion_recognition_model.tflite")

# Initialize Global Interpreter Variables
interpreter = None
input_details = None
output_details = None

try:
    # Use LiteRT to support newer model opcodes (v12+)
    interpreter = litert.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    print(f"LiteRT model loaded successfully from: {model_path}", flush=True)
except Exception as e:
    print(f"CRITICAL: Failed to load LiteRT model: {e}", flush=True)

previous_boxes = {}

def smooth_box(new_box, face_id, alpha=0.2):
    """Applies simple EWMA smoothing to bounding boxes to reduce flicker."""
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

def preprocess_image(image_data, detect_multiple=True):
    """Decodes, crops, and resizes faces for the LiteRT model."""
    try:
        # Check if the data is binary or Base64 string
        if isinstance(image_data, bytes):
            nparr = np.frombuffer(image_data, np.uint8)
        elif isinstance(image_data, str) and "," in image_data:
            # Decode base64 image from SocketIO (legacy/fallback)
            header, encoded = image_data.split(",", 1)
            nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        else:
            return None, None

        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return None, None

        # InsightFace expects RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect faces using RetinaFace
        faces = face_app.get(img_rgb)
        if not faces:
            return None, None

        all_faces = []
        all_boxes = []

        for face in faces:
            x1, y1, x2, y2 = [int(coord) for coord in face.bbox]
            
            # Padding/Expansion to capture more context for emotion
            w, h = x2 - x1, y2 - y1
            expand = 0.2
            x1 = max(0, int(x1 - w * expand / 2))
            y1 = max(0, int(y1 - h * expand / 2))
            x2 = min(img_rgb.shape[1], int(x2 + w * expand / 2))
            y2 = min(img_rgb.shape[0], int(y2 + h * expand / 2))

            face_crop = img_rgb[y1:y2, x1:x2]
            if face_crop.size == 0:
                continue
            
            # Resize to ResNet/Model input size (224x224)
            face_crop = cv2.resize(face_crop, (224, 224), interpolation=cv2.INTER_AREA)
            face_crop = face_crop.astype(np.float32)
            
            # Add batch dimension
            all_faces.append(np.expand_dims(face_crop, axis=0))
            all_boxes.append([x1, y1, x2 - x1, y2 - y1])

        return all_faces, all_boxes

    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return None, None

def create_tracking_server(socketio):
    """Creates the Flask Blueprint and SocketIO event handlers."""
    tracking_route = Blueprint("tracking", __name__)

    @socketio.on("connect")
    def handle_connect():
        print("Student Tracker Client connected", flush=True)

    @socketio.on("ping")
    def handle_ping(data):
        """Custom ping handler for client health checks."""
        emit("pong", {"serverTimestamp": os.times()[4]})  # Use a simple timestamp

    @socketio.on("video_frame")
    def handle_video_frame(data):
        global interpreter, input_details, output_details
        import eventlet  # Ensure eventlet is available for sleep
        
        if interpreter is None:
            emit("tracking_update", {"error": "Model engine offline", "faces": []})
            return {"success": False, "error": "Model offline"}

        frame_data = data.get("frame")
        detect_multiple = data.get("detectMultiple", True)

        if not frame_data:
            return {"success": False, "error": "No frame data"}

        all_faces, all_boxes = preprocess_image(frame_data, detect_multiple)

        if not all_faces:
            emit("tracking_update", {"faces": []})
            return {"success": True}

        classes = ["Bored", "Interested", "Lacking_Focus"]
        results = []

        # Inference loop
        for idx, (face_img, box) in enumerate(zip(all_faces, all_boxes)):
            # Set LiteRT tensor
            interpreter.set_tensor(input_details[0]['index'], face_img)
            interpreter.invoke()
            
            # Get prediction results
            prediction = interpreter.get_tensor(output_details[0]['index'])[0]
            predicted_idx = np.argmax(prediction)
            predicted_label = classes[predicted_idx]
            confidence = float(prediction[predicted_idx])
            
            results.append({
                "label": predicted_label,
                "confidence": round(confidence, 2),
                "box": box,
                "id": idx
            })
            
            # Allow event loop to process other tasks (like pings)
            eventlet.sleep(0)

        # Broadcast results back to the student/teacher dashboard
        emit("tracking_update", {"faces": results})
        return {"success": True}

    return tracking_route