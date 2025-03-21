from flask import Blueprint, Flask
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.vgg16 import preprocess_input
import mediapipe as mp
import base64
import re

tracking_route = Blueprint('tracking', __name__)

# Initialize SocketIO
socketio = SocketIO(cors_allowed_origins="*")

# Load the model
model = load_model('path/to/vggface_daisee_model_senet50_final.h5')

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection

# Dictionary to store student engagement metrics
student_metrics = {}

@socketio.on('video_frame')
def process_frame(data):
    try:
        # Extract base64 data from the frontend's format
        # Frontend sends data in format "data:image/jpeg;base64,/9j/4AAQSkZ..."
        base64_data = data['frame'].split(',')[1] if ',' in data['frame'] else data['frame']
        
        # Decode the base64 image
        frame_data = base64.b64decode(base64_data)
        np_arr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            print("Error: Could not decode image")
            return

        # Convert to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        detected_faces = {}
        
        with mp_face_detection.FaceDetection(min_detection_confidence=0.2) as face_detection:
            results = face_detection.process(rgb_frame)

            if results.detections:
                for idx, detection in enumerate(results.detections):
                    bboxC = detection.location_data.relative_bounding_box
                    ih, iw, _ = frame.shape
                    x, y, w, h = int(bboxC.xmin * iw), int(bboxC.ymin * ih), int(bboxC.width * iw), int(bboxC.height * ih)
                    
                    # Ensure coordinates are within image boundaries
                    x = max(0, x)
                    y = max(0, y)
                    w = min(w, iw - x)
                    h = min(h, ih - y)

                    if w <= 0 or h <= 0:
                        continue  # Skip invalid faces

                    # Draw rectangle around face
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)

                    # Extract and preprocess face
                    try:
                        face = frame[y:y + h, x:x + w]
                        face_resized = cv2.resize(face, (224, 224))
                        face_resized = np.expand_dims(face_resized, axis=0)
                        face_resized = preprocess_input(face_resized)

                        # Get prediction from model
                        prediction = model.predict(face_resized)
                        predicted_class = np.argmax(prediction, axis=-1)
                        labels = ['Boredom', 'Engagement', 'Frustration', 'Confusion']
                        predicted_label = labels[predicted_class[0]]
                        confidence = float(prediction[0][predicted_class[0]])

                        # Draw label on image
                        cv2.putText(frame, f"{predicted_label}: {confidence:.2f}", 
                                    (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                        
                        # Store face data for metrics
                        face_id = f"face_{idx}"  # Simple face ID for this example
                        detected_faces[face_id] = {
                            "label": predicted_label,
                            "confidence": confidence,
                            "position": {"x": x, "y": y, "width": w, "height": h}
                        }
                        
                        # Update overall metrics (simple example)
                        if face_id not in student_metrics:
                            student_metrics[face_id] = {label: 0 for label in labels}
                        student_metrics[face_id][predicted_label] += 1
                            
                    except Exception as e:
                        print(f"Error processing face {idx}: {e}")
                        continue

        # Encode processed frame
        _, buffer = cv2.imencode('.jpg', frame)
        processed_frame = base64.b64encode(buffer).decode('utf-8')

        # Send back processed frame and metrics
        emit('tracking_update', {
            'processed_frame': f"data:image/jpeg;base64,{processed_frame}",
            'detected_faces': detected_faces,
            'metrics': student_metrics
        })

    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        emit('error', {'message': f"Error processing frame: {str(e)}"})