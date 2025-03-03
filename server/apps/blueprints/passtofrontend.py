from flask import Flask, jsonify, request
import cv2
import mediapipe as mp
import numpy as np
from tensorflow.keras.models import load_model
from your_gaze_tracking_module import GazeTracking

# Initialize Flask app
app = Flask(__name__)

# Load pre-trained models
vggface_model = load_model('fine_tuned_vggface.h5')  # Load your fine-tuned VGGFace model
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
gaze_tracker = GazeTracking()  # Assuming you have a gaze tracking implementation

# Define a function to process the webcam frame
def process_frame(frame):
    # Convert to RGB for pose detection
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pose_results = pose.process(rgb_frame)
    
    # Perform gaze tracking
    gaze_tracker.refresh(frame)
    gaze_info = gaze_tracker.pupil_positions()  # Placeholder for actual gaze data
    
    # Use VGGFace to get features
    face_features = get_face_features(frame)  # This should use your fine-tuned VGGFace model
    
    # Combine these features and classify engagement
    engagement_status = classify_engagement(pose_results, gaze_info, face_features)
    
    return engagement_status

# Placeholder for face feature extraction (you need to implement this)
def get_face_features(frame):
    # Assuming your fine-tuned VGGFace model outputs embeddings
    return vggface_model.predict(frame)  # Example, adapt based on your model output

# Placeholder function for engagement classification (using pose, gaze, and face features)
def classify_engagement(pose_results, gaze_info, face_features):
    # Combine all data and classify engagement
    # Here you can define your logic based on pose landmarks, gaze, and face features
    return "Engaged" if some_condition else "Not Engaged"

@app.route('/process_frame', methods=['POST'])
def process_video_frame():
    # Get the frame from the frontend (you can send it as base64 or image file)
    frame = request.files['frame'].read()
    frame = np.frombuffer(frame, dtype=np.uint8)
    frame = cv2.imdecode(frame, cv2.IMREAD_COLOR)
    
    # Process the frame
    engagement_status = process_frame(frame)
    
    return jsonify({"engagement_status": engagement_status})

if __name__ == '__main__':
    app.run(debug=True)
