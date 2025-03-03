from flask import Blueprint
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
import mediapipe as mp
from keras_vggface import VGGFace
from keras.models import Model
from keras.layers import Dense, GlobalAveragePooling2D
from keras.optimizers import Adam
import keras.utils as image

# Initialize the Blueprint for face detection
vggface_model_route = Blueprint('vggface_model_route', __name__)

# Initialize MediaPipe for face detection
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

# Load VGGFace model without the top layers
base_model = VGGFace(model='vgg16', include_top=False, input_shape=(224, 224, 3))

# Add custom classification layers on top of the VGGFace base model
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(1024, activation='relu')(x)
x = Dense(3, activation='softmax')(x)  # Classes: 'engaged', 'bored', 'neutral'

# Create the final model
model = Model(inputs=base_model.input, outputs=x)

# Compile the model
model.compile(optimizer=Adam(learning_rate=0.0001), loss='categorical_crossentropy', metrics=['accuracy'])

# Function to process and predict engagement from a face image
def process_and_predict_face(face_roi):
    # Preprocess the face ROI
    face_resized = cv2.resize(face_roi, (224, 224))  # Resize to match VGGFace input size
    img_array = image.img_to_array(face_resized)
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    img_array = img_array / 255.0  # Normalize the image

    # Predict engagement level (engaged, bored, neutral)
    predictions = model.predict(img_array)

    # Get the predicted class and confidence
    predicted_class = np.argmax(predictions)
    classes = ['engaged', 'bored', 'neutral']
    label = classes[predicted_class]
    confidence = np.max(predictions) * 100  # Confidence as a percentage

    return label, confidence

# Function to register the socketio event handlers
def init_socketio(socketio):
    @socketio.on('video_frame')
    def handle_video_frame(data):
        # Decode the frame from the client (base64 or raw binary)
        np_data = np.frombuffer(data['frame'], dtype=np.uint8)  # Ensure data is passed correctly
        frame = cv2.imdecode(np_data, cv2.IMREAD_COLOR)

        # Check if frame is not None
        if frame is not None:
            # Processing frame (Face Detection and Prediction)
            # Convert frame to RGB for face detection
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Assume face_detection is initialized and working properly
            results = face_detection.process(rgb_frame)

            if results.detections:
                for detection in results.detections:
                    bboxC = detection.location_data.relative_bounding_box
                    ih, iw, _ = frame.shape
                    x, y, w, h = int(bboxC.xmin * iw), int(bboxC.ymin * ih), int(bboxC.width * iw), int(bboxC.height * ih)

                    # Extract face region of interest (ROI)
                    face_roi = rgb_frame[y:y + h, x:x + w]

                    # Perform the engagement prediction on the face ROI
                    label, confidence = process_and_predict_face(face_roi)

                    # Draw the bounding box and label on the frame
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                    cv2.putText(frame, f"{label}: {confidence:.2f}%", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                    # Send the predicted label and confidence back to the client
                    emit('face_prediction', {'label': label, 'confidence': confidence})

            # Optionally, send back the frame to the client (for display or further processing)
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            emit('video_feed', {'frame': frame_bytes})

# Register the event handler function within the blueprint
vggface_model_route.init_socketio = init_socketio
