from flask import Blueprint
from flask_socketio import emit
import os
import base64
import cv2
import numpy as np
import tensorflow as tf
from insightface.app import FaceAnalysis
import logging
import time

# Configuration
CONFIG = {
    'DEBUG': False,
    'FACE_DETECTION_SIZE': (640, 640),  # Increased for better accuracy
    'FACE_CROP_SIZE': (224, 224),
    'BOX_EXPAND_RATIO': 0.2,
    'SMOOTHING_ALPHA': 0.2,
    'MAX_FACES': 20,
    'CONFIDENCE_THRESHOLD': 0.5,  # Increased for more reliable detections
    'MODEL_BATCH_SIZE': 8
}

# Global state
face_app = None
emotion_model = None
previous_boxes = {}
frame_count = 0

# Emotion labels
EMOTION_LABELS = ["Bored", "Interested", "Lacking_Focus"]

def ensure_json_serializable(obj):
    """Convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: ensure_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [ensure_json_serializable(item) for item in obj]
    else:
        return obj

def setup_logging():
    """Configure logging for the application."""
    logging.basicConfig(
        level=logging.INFO if CONFIG['DEBUG'] else logging.WARNING,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

def initialize_models():
    """Initialize face detection and emotion recognition models."""
    global face_app, emotion_model
    
    try:
        # Initialize RetinaFace detector with large model
        face_app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
        face_app.prepare(ctx_id=-1, det_size=CONFIG['FACE_DETECTION_SIZE'])
        logging.info("✅ Face detection model initialized")
        
        # Load emotion recognition model
        model_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "models", "emotion_recognition_model.keras")
        )
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
            
        emotion_model = tf.keras.models.load_model(model_path, compile=False)
        logging.info("✅ Emotion recognition model loaded")
        
    except Exception as e:
        logging.error(f"❌ Model initialization failed: {e}")
        raise

def validate_frame_data(data):
    """Validate and extract frame data from WebSocket message."""
    if not isinstance(data, dict):
        return None, False
        
    frame_data = data.get("frame")
    detect_multiple = data.get("detectMultiple", False)
    
    if not frame_data or not isinstance(frame_data, str):
        return None, detect_multiple
        
    return frame_data, detect_multiple

def decode_image(image_data):
    """Decode base64 image data to OpenCV format."""
    try:
        if "," not in image_data:
            logging.error("Invalid image data format")
            return None
            
        header, encoded = image_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            logging.error("Image decoding failed")
            return None
            
        # Convert BGR to RGB for consistent processing
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        logging.debug(f"Image decoded successfully: {img.shape}")
        
        return img
        
    except Exception as e:
        logging.error(f"Image decoding error: {e}")
        return None

def expand_face_bbox(bbox, img_shape, expand_ratio=None):
    """Expand face bounding box with safety checks."""
    if expand_ratio is None:
        expand_ratio = CONFIG['BOX_EXPAND_RATIO']
        
    x1, y1, x2, y2 = bbox
    w, h = x2 - x1, y2 - y1
    
    # Calculate expansion
    expand_w = w * expand_ratio / 2
    expand_h = h * expand_ratio / 2
    
    # Apply expansion with bounds checking
    x1 = max(0, int(x1 - expand_w))
    y1 = max(0, int(y1 - expand_h))
    x2 = min(img_shape[1], int(x2 + expand_w))
    y2 = min(img_shape[0], int(y2 + expand_h))
    
    return [x1, y1, x2, y2]

def preprocess_face_crop(face_crop):
    """Preprocess face crop for emotion recognition."""
    if face_crop.size == 0:
        raise ValueError("Empty face crop")
        
    # Resize to model input size
    face_crop = cv2.resize(
        face_crop, 
        CONFIG['FACE_CROP_SIZE'], 
        interpolation=cv2.INTER_CUBIC
    )
    
    # Normalize to match training preprocessing
    face_crop = face_crop.astype('float32')
    
    # Add additional preprocessing if needed (e.g., normalization)
    # face_crop = face_crop / 255.0  # Uncomment if model expects [0,1] range
    
    logging.debug(f"Face preprocessed: shape={face_crop.shape}, range=[{face_crop.min():.3f}, {face_crop.max():.3f}]")
    
    return face_crop

def detect_faces(img):
    """Detect faces in image and return face data."""
    try:
        # Ensure image is properly sized for detection
        if img.shape[0] > CONFIG['FACE_DETECTION_SIZE'][0] or img.shape[1] > CONFIG['FACE_DETECTION_SIZE'][1]:
            scale = min(CONFIG['FACE_DETECTION_SIZE'][0] / img.shape[0], 
                       CONFIG['FACE_DETECTION_SIZE'][1] / img.shape[1])
            new_size = (int(img.shape[1] * scale), int(img.shape[0] * scale))
            img = cv2.resize(img, new_size, interpolation=cv2.INTER_LINEAR)
        
        faces = face_app.get(img)
        if not faces:
            return []
            
        face_data = []
        for i, face in enumerate(faces[:CONFIG['MAX_FACES']]):
            # Check confidence if available
            if hasattr(face, 'det_score') and face.det_score < CONFIG['CONFIDENCE_THRESHOLD']:
                continue
                
            bbox = [int(coord) for coord in face.bbox]
            expanded_bbox = expand_face_bbox(bbox, img.shape[:2])
            
            x1, y1, x2, y2 = expanded_bbox
            face_crop = img[y1:y2, x1:x2]
            
            if face_crop.size == 0:
                continue
                
            try:
                processed_face = preprocess_face_crop(face_crop)
                face_data.append({
                    'face': processed_face,
                    'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],  # Ensure integers
                    'id': int(i),  # Ensure integer
                    'confidence': float(getattr(face, 'det_score', 1.0))  # Ensure float
                })
            except Exception as e:
                logging.warning(f"Failed to preprocess face {i}: {e}")
                continue
                
        return face_data
        
    except Exception as e:
        logging.error(f"Face detection error: {e}")
        return []

def predict_emotions(face_data):
    """Predict emotions for detected faces."""
    if not face_data or emotion_model is None:
        return []
        
    try:
        # Batch process faces
        faces_batch = np.array([fd['face'] for fd in face_data])
        
        # Process in batches to manage memory
        batch_size = CONFIG['MODEL_BATCH_SIZE']
        predictions = []
        
        for i in range(0, len(faces_batch), batch_size):
            batch = faces_batch[i:i + batch_size]
            batch_predictions = emotion_model.predict(batch, verbose=0)
            predictions.extend(batch_predictions)
        
        results = []
        for i, (pred, fd) in enumerate(zip(predictions, face_data)):
            predicted_class = np.argmax(pred)
            confidence = float(pred[predicted_class])
            
            # Apply smoothing to bounding box
            smoothed_box = smooth_bounding_box(fd['bbox'], fd['id'])
            
            results.append({
                'label': EMOTION_LABELS[predicted_class],
                'confidence': float(confidence),  # Convert numpy float32 to Python float
                'box': [int(x) for x in smoothed_box],  # Ensure all box coords are Python int
                'id': int(fd['id']),  # Convert to Python int
                'detection_confidence': float(fd['confidence'])  # Convert numpy float32 to Python float
            })
            
        return results
        
    except Exception as e:
        logging.error(f"Emotion prediction error: {e}")
        return []

def smooth_bounding_box(new_box, face_id, alpha=None):
    """Apply temporal smoothing to bounding boxes."""
    global previous_boxes
    
    if alpha is None:
        alpha = CONFIG['SMOOTHING_ALPHA']
    
    if face_id not in previous_boxes:
        previous_boxes[face_id] = new_box
        return new_box

    smoothed_box = [
        alpha * new + (1 - alpha) * old
        for new, old in zip(new_box, previous_boxes[face_id])
    ]

    previous_boxes[face_id] = smoothed_box
    return [int(coord) for coord in smoothed_box]

def cleanup_old_tracks(max_age=30):
    """Clean up old face tracking data."""
    global previous_boxes, frame_count
    
    frame_count += 1
    if frame_count % max_age == 0:
        # Simple cleanup - in production, you'd want timestamp-based cleanup
        if len(previous_boxes) > CONFIG['MAX_FACES'] * 2:
            # Keep only the most recent tracks
            keys_to_keep = list(previous_boxes.keys())[-CONFIG['MAX_FACES']:]
            previous_boxes = {k: previous_boxes[k] for k in keys_to_keep}

def process_video_frame(frame_data, detect_multiple=True):
    """Main processing pipeline for video frames."""
    # Decode image
    img = decode_image(frame_data)
    if img is None:
        return []
    
    # Detect faces
    face_data = detect_faces(img)
    if not face_data:
        return []
    
    # Predict emotions
    results = predict_emotions(face_data)
    
    # Cleanup old tracks
    cleanup_old_tracks()
    
    return results

def create_tracking_server(socketio):
    """Create Flask-SocketIO tracking server with enhanced error handling."""
    
    # Initialize models and logging
    setup_logging()
    initialize_models()
    
    tracking_route = Blueprint("tracking", __name__)

    @socketio.on("connect")
    def handle_connect():
        logging.info("✅ Client connected")
        emit("connection_status", {"status": "connected", "timestamp": float(time.time())})

    @socketio.on("disconnect")
    def handle_disconnect():
        logging.info("❌ Client disconnected")
        # Clean up client-specific data if needed
        global previous_boxes
        previous_boxes.clear()

    @socketio.on("video_frame")
    def handle_video_frame(data):
        try:
            start_time = time.time()
            
            # Validate input
            frame_data, detect_multiple = validate_frame_data(data)
            if not frame_data:
                emit("tracking_update", {"faces": [], "error": "Invalid frame data"})
                return
            
            # Process frame
            results = process_video_frame(frame_data, detect_multiple)
            
            # Ensure all data is JSON serializable
            results = ensure_json_serializable(results)
            
            processing_time = (time.time() - start_time) * 1000  # ms
            
            # Emit results
            response = {
                "faces": results,
                "processing_time": float(round(processing_time, 2)),  # Ensure it's Python float
                "timestamp": float(time.time())  # Ensure it's Python float
            }
            
            logging.debug(f"📦 Processed frame: {len(results)} faces, {processing_time:.1f}ms")
            emit("tracking_update", response, broadcast=True)
            
        except Exception as e:
            logging.error(f"Frame processing error: {e}")
            emit("tracking_update", {
                "faces": [], 
                "error": str(e),
                "timestamp": float(time.time())  # Ensure it's Python float
            })

    @socketio.on("get_config")
    def handle_get_config():
        """Send current configuration to client."""
        emit("config_update", {
            "max_faces": CONFIG['MAX_FACES'],
            "emotion_labels": EMOTION_LABELS,
            "detection_size": CONFIG['FACE_DETECTION_SIZE']
        })

    @socketio.on("update_config")
    def handle_update_config(new_config):
        """Update configuration dynamically."""
        try:
            for key, value in new_config.items():
                if key in CONFIG:
                    CONFIG[key] = value
                    logging.info(f"Updated config: {key} = {value}")
            
            emit("config_updated", {"status": "success"})
        except Exception as e:
            logging.error(f"Config update error: {e}")
            emit("config_updated", {"status": "error", "message": str(e)})

    return tracking_route

# Utility functions for external use
def get_model_info():
    """Get information about loaded models."""
    return {
        "face_detection": face_app is not None,
        "emotion_recognition": emotion_model is not None,
        "emotion_labels": EMOTION_LABELS,
        "config": CONFIG
    }

def reset_tracking_state():
    """Reset all tracking state."""
    global previous_boxes, frame_count
    previous_boxes.clear()
    frame_count = 0
    logging.info("Tracking state reset")