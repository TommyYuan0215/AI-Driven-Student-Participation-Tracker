from flask import Blueprint, request
from flask_socketio import emit
import os
import base64
import cv2
import numpy as np
import tensorflow as tf
from insightface.app import FaceAnalysis
import logging
import time
import threading
from collections import defaultdict, deque

# Configuration
CONFIG = {
    'DEBUG': False,
    'FACE_DETECTION_SIZE': (640, 640),  # Increased for better detection
    'FACE_CROP_SIZE': (224, 224),
    'BOX_EXPAND_RATIO': 0.2,
    'MAX_FACES': 20,  # Reduced for performance
    'CONFIDENCE_THRESHOLD': 0.5,  # Increased threshold
    'MODEL_BATCH_SIZE': 4,  # Reduced batch size
    'MAX_TRACK_AGE': 30,
    'FRAME_SKIP': 2,  # Process every 2nd frame for performance
    'MAX_QUEUE_SIZE': 10,
    'PING_TIMEOUT': 10,  # seconds
    'PING_INTERVAL': 5,  # seconds
    'MAX_RECONNECT_ATTEMPTS': 10,
    'CONNECTION_TIMEOUT': 10  # seconds
}

# Global state with thread safety
face_app = None
emotion_model = None
frame_count = 0
processing_lock = threading.Lock()
frame_queue = deque(maxlen=CONFIG['MAX_QUEUE_SIZE'])

# Emotion labels
EMOTION_LABELS = ["Bored", "Interested", "Lacking_Focus"]

class TrackingState:
    """Thread-safe tracking state management"""
    def __init__(self):
        self.frame_count = 0
        self.last_seen = defaultdict(int)
        self.lock = threading.Lock()
    
    def update_last_seen(self, face_id):
        with self.lock:
            self.last_seen[face_id] = self.frame_count
    
    def cleanup_old_tracks(self, max_age=30):
        with self.lock:
            current_frame = self.frame_count
            to_remove = [
                face_id for face_id, last_frame in self.last_seen.items()
                if current_frame - last_frame > max_age
            ]
            for face_id in to_remove:
                del self.last_seen[face_id]
    
    def increment_frame(self):
        with self.lock:
            self.frame_count += 1

# Global tracking state
tracking_state = TrackingState()

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
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('tracking_server.log', mode='a')
        ]
    )

def initialize_models():
    """Initialize face detection and emotion recognition models with error handling."""
    global face_app, emotion_model
    
    try:
        # Initialize RetinaFace detector with error handling
        try:
            face_app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
            face_app.prepare(ctx_id=-1, det_size=CONFIG['FACE_DETECTION_SIZE'])
            logging.info("✅ Face detection model initialized")
        except Exception as e:
            logging.error(f"❌ Face detection model failed: {e}")
            # Fallback to different model or provider
            try:
                face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
                face_app.prepare(ctx_id=-1, det_size=(480, 480))
                logging.info("✅ Face detection model initialized with fallback")
            except Exception as e2:
                logging.error(f"❌ Face detection fallback failed: {e2}")
                raise
        
        # Load emotion recognition model with better error handling
        model_paths = [
            os.path.join(os.path.dirname(__file__), "..", "models", "emotion_recognition_model.keras"),
            os.path.join(os.path.dirname(__file__), "models", "emotion_recognition_model.keras"),
            "emotion_recognition_model.keras",
            os.path.join("models", "emotion_recognition_model.h5"),  # Alternative format
        ]
        
        model_loaded = False
        for model_path in model_paths:
            model_path = os.path.abspath(model_path)
            if os.path.exists(model_path):
                try:
                    emotion_model = tf.keras.models.load_model(model_path, compile=False)
                    logging.info(f"✅ Emotion model loaded from: {model_path}")
                    model_loaded = True
                    break
                except Exception as e:
                    logging.warning(f"Failed to load model from {model_path}: {e}")
                    continue
        
        if not model_loaded:
            raise FileNotFoundError(f"Emotion model not found in any of these paths: {model_paths}")
            
    except Exception as e:
        logging.error(f"❌ Model initialization failed: {e}")
        raise

def validate_frame_data(data):
    """Enhanced validation for frame data."""
    if not isinstance(data, dict):
        logging.error("Data is not a dictionary")
        return None, False
        
    frame_data = data.get("frame")
    detect_multiple = data.get("detectMultiple", True)  # Default to True
    
    if not frame_data:
        logging.error("No frame data provided")
        return None, detect_multiple
        
    if not isinstance(frame_data, str):
        logging.error("Frame data is not a string")
        return None, detect_multiple
        
    # Check if it's a valid base64 data URL
    if not frame_data.startswith('data:image/'):
        logging.error("Invalid image data format - missing data URL prefix")
        return None, detect_multiple
        
    return frame_data, detect_multiple

def decode_image(image_data):
    """Enhanced image decoding with better error handling."""
    try:
        # Validate data URL format
        if "," not in image_data:
            logging.error("Invalid image data format - missing comma separator")
            return None
            
        header, encoded = image_data.split(",", 1)
        
        # Validate base64 encoding
        try:
            image_bytes = base64.b64decode(encoded, validate=True)
        except Exception as e:
            logging.error(f"Base64 decoding failed: {e}")
            return None
        
        if len(image_bytes) == 0:
            logging.error("Empty image data after decoding")
            return None
            
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            logging.error("OpenCV image decoding failed")
            return None
            
        # Validate image dimensions
        if img.shape[0] < 50 or img.shape[1] < 50:
            logging.error(f"Image too small: {img.shape}")
            return None
            
        # Convert BGR to RGB for consistent processing
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        logging.debug(f"Image decoded successfully: {img.shape}")
        
        return img
        
    except Exception as e:
        logging.error(f"Image decoding error: {e}")
        return None

def expand_face_bbox(bbox, img_shape, expand_ratio=None):
    """Enhanced bounding box expansion with validation."""
    if expand_ratio is None:
        expand_ratio = CONFIG['BOX_EXPAND_RATIO']
    
    try:
        x1, y1, x2, y2 = [float(coord) for coord in bbox]
        img_h, img_w = img_shape[:2]
        
        # Validate bbox
        if x2 <= x1 or y2 <= y1:
            logging.warning(f"Invalid bbox dimensions: {bbox}")
            return None
            
        w, h = x2 - x1, y2 - y1
        
        # Calculate expansion
        expand_w = w * expand_ratio / 2
        expand_h = h * expand_ratio / 2
        
        # Apply expansion with bounds checking
        x1 = max(0, int(x1 - expand_w))
        y1 = max(0, int(y1 - expand_h))
        x2 = min(img_w, int(x2 + expand_w))
        y2 = min(img_h, int(y2 + expand_h))
        
        return [x1, y1, x2, y2]
        
    except (ValueError, TypeError) as e:
        logging.error(f"Bbox expansion error: {e}")
        return None

def preprocess_face_crop(face_crop):
    """Enhanced face preprocessing with validation."""
    try:
        if face_crop.size == 0:
            raise ValueError("Empty face crop")
            
        # Check minimum size
        if face_crop.shape[0] < 32 or face_crop.shape[1] < 32:
            logging.warning(f"Face crop too small: {face_crop.shape}")
            return None
            
        # Resize to model input size
        face_crop = cv2.resize(
            face_crop, 
            CONFIG['FACE_CROP_SIZE'], 
            interpolation=cv2.INTER_CUBIC
        )
        
        # Convert to float32 and normalize
        face_crop = face_crop.astype('float32')
        
        # Convert RGB to BGR for ResNet50
        face_crop = face_crop[..., ::-1]
        
        # Subtract ImageNet mean
        mean = np.array([103.939, 116.779, 123.68], dtype=np.float32)
        face_crop -= mean
        
        logging.debug(f"Face preprocessed: shape={face_crop.shape}, range=[{face_crop.min():.3f}, {face_crop.max():.3f}]")
        return face_crop
        
    except Exception as e:
        logging.error(f"Face preprocessing error: {e}")
        return None

def detect_faces(img):
    """Enhanced face detection with better error handling."""
    try:
        if face_app is None:
            logging.error("Face detection model not initialized")
            return []
            
        faces = face_app.get(img)
        if not faces:
            logging.debug("No faces detected")
            return []
            
        face_data = []
        for i, face in enumerate(faces[:CONFIG['MAX_FACES']]):
            try:
                # Check confidence
                confidence = getattr(face, 'det_score', 1.0)
                if confidence < CONFIG['CONFIDENCE_THRESHOLD']:
                    logging.debug(f"Face {i} below confidence threshold: {confidence}")
                    continue
                    
                bbox = [float(coord) for coord in face.bbox]
                expanded_bbox = expand_face_bbox(bbox, img.shape[:2])
                
                if expanded_bbox is None:
                    continue
                    
                x1, y1, x2, y2 = expanded_bbox
                face_crop = img[y1:y2, x1:x2]
                
                if face_crop.size == 0:
                    logging.debug(f"Empty face crop for face {i}")
                    continue
                    
                processed_face = preprocess_face_crop(face_crop)
                if processed_face is None:
                    continue
                    
                face_data.append({
                    'face': processed_face,
                    'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                    'id': int(i),
                    'confidence': float(confidence)
                })
                
            except Exception as e:
                logging.warning(f"Failed to process face {i}: {e}")
                continue
                
        logging.debug(f"Detected {len(face_data)} valid faces")
        return face_data
        
    except Exception as e:
        logging.error(f"Face detection error: {e}")
        return []

def predict_emotions(face_data):
    """Enhanced emotion prediction with batch processing - no bounding box smoothing."""
    if not face_data or emotion_model is None:
        return []
        
    try:
        # Prepare batch
        faces_batch = np.array([fd['face'] for fd in face_data])
        logging.debug(f"Processing batch of {len(faces_batch)} faces")
        
        # Process in smaller batches to manage memory
        batch_size = CONFIG['MODEL_BATCH_SIZE']
        predictions = []
        
        for i in range(0, len(faces_batch), batch_size):
            batch = faces_batch[i:i + batch_size]
            try:
                batch_predictions = emotion_model.predict(batch, verbose=0)
                predictions.extend(batch_predictions)
            except Exception as e:
                logging.error(f"Batch prediction failed: {e}")
                # Return empty predictions for this batch
                predictions.extend([np.zeros(len(EMOTION_LABELS)) for _ in range(len(batch))])
        
        results = []
        for i, (pred, fd) in enumerate(zip(predictions, face_data)):
            try:
                predicted_class = np.argmax(pred)
                confidence = float(pred[predicted_class])
                
                # Use original bounding box without smoothing
                original_box = fd['bbox']
                
                # Update tracking state
                tracking_state.update_last_seen(fd['id'])
                
                results.append({
                    'label': EMOTION_LABELS[predicted_class],
                    'confidence': confidence,
                    'box': [int(x) for x in original_box],
                    'id': int(fd['id']),
                    'detection_confidence': float(fd['confidence']),
                    'raw_predictions': [float(p) for p in pred]  # For debugging
                })
                
            except Exception as e:
                logging.warning(f"Failed to process prediction for face {i}: {e}")
                continue
                
        return results
        
    except Exception as e:
        logging.error(f"Emotion prediction error: {e}")
        return []

def process_video_frame(frame_data, detect_multiple=True):
    """Enhanced main processing pipeline with performance optimizations."""
    try:
        # Frame skipping for performance
        tracking_state.increment_frame()
        if tracking_state.frame_count % CONFIG['FRAME_SKIP'] != 0:
            return []  # Skip this frame
        
        # Decode image
        img = decode_image(frame_data)
        if img is None:
            return []
        
        # Detect faces
        face_data = detect_faces(img)
        if not face_data:
            return []
        
        # Limit faces if not detecting multiple
        if not detect_multiple and face_data:
            face_data = [face_data[0]]  # Keep only the first face
        
        # Predict emotions
        results = predict_emotions(face_data)
        
        # Cleanup old tracks periodically
        if tracking_state.frame_count % CONFIG['MAX_TRACK_AGE'] == 0:
            tracking_state.cleanup_old_tracks(CONFIG['MAX_TRACK_AGE'])
        
        return results
        
    except Exception as e:
        logging.error(f"Frame processing error: {e}")
        return []

def create_tracking_server(socketio):
    """Enhanced Flask-SocketIO tracking server with comprehensive error handling."""
    
    # Initialize models and logging
    setup_logging()
    
    try:
        initialize_models()
    except Exception as e:
        logging.error(f"Failed to initialize models: {e}")
        # Continue without models - will handle gracefully in processing
    
    tracking_route = Blueprint("tracking", __name__)

    @socketio.on("connect")
    def handle_connect():
        logging.info("✅ Client connected")
        try:
            emit("connection_status", {
                "status": "connected", 
                "timestamp": time.time(),
                "models_loaded": {
                    "face_detection": face_app is not None,
                    "emotion_recognition": emotion_model is not None
                }
            })
        except Exception as e:
            logging.error(f"Connection response error: {e}")

    @socketio.on("disconnect")
    def handle_disconnect():
        logging.info("❌ Client disconnected")
        try:
            # Reset tracking state for this client
            global tracking_state
            tracking_state = TrackingState()
            
            # Log disconnection reason if available
            disconnect_reason = getattr(request, 'event', {}).get('message', 'unknown')
            logging.info(f"Disconnect reason: {disconnect_reason}")
        except Exception as e:
            logging.error(f"Disconnect handling error: {e}")

    @socketio.on("video_frame")
    def handle_video_frame(data):
        try:
            start_time = time.time()
            
            # Check if models are loaded
            if face_app is None or emotion_model is None:
                emit("tracking_update", {
                    "faces": [], 
                    "error": "Models not loaded properly",
                    "timestamp": time.time()
                })
                return
            
            # Validate input
            frame_data, detect_multiple = validate_frame_data(data)
            if not frame_data:
                emit("tracking_update", {
                    "faces": [], 
                    "error": "Invalid frame data",
                    "timestamp": time.time()
                })
                return
            
            # Process frame with timeout protection
            try:
                with processing_lock:
                    results = process_video_frame(frame_data, detect_multiple)
            except Exception as e:
                logging.error(f"Processing error: {e}")
                results = []
            
            # Ensure all data is JSON serializable
            results = ensure_json_serializable(results)
            
            processing_time = (time.time() - start_time) * 1000  # ms
            
            # Emit results
            response = {
                "faces": results,
                "processing_time": round(processing_time, 2),
                "timestamp": time.time(),
                "frame_count": tracking_state.frame_count
            }
            
            logging.debug(f"📦 Processed frame: {len(results)} faces, {processing_time:.1f}ms")
            emit("tracking_update", response)
            
        except Exception as e:
            logging.error(f"Frame handling error: {e}")
            emit("tracking_update", {
                "faces": [], 
                "error": f"Processing error: {str(e)}",
                "timestamp": time.time()
            })

    @socketio.on("get_config")
    def handle_get_config():
        """Send current configuration to client."""
        try:
            emit("config_update", {
                "max_faces": CONFIG['MAX_FACES'],
                "emotion_labels": EMOTION_LABELS,
                "detection_size": CONFIG['FACE_DETECTION_SIZE'],
                "confidence_threshold": CONFIG['CONFIDENCE_THRESHOLD'],
                "models_loaded": get_model_info()
            })
        except Exception as e:
            logging.error(f"Config get error: {e}")

    @socketio.on("update_config")
    def handle_update_config(new_config):
        """Update configuration dynamically with validation."""
        try:
            updated_keys = []
            for key, value in new_config.items():
                if key in CONFIG:
                    # Basic validation
                    if key == 'MAX_FACES' and not (1 <= value <= 50):
                        continue
                    if key == 'CONFIDENCE_THRESHOLD' and not (0.0 <= value <= 1.0):
                        continue
                        
                    CONFIG[key] = value
                    updated_keys.append(key)
                    logging.info(f"Updated config: {key} = {value}")
            
            emit("config_updated", {
                "status": "success",
                "updated_keys": updated_keys
            })
            
        except Exception as e:
            logging.error(f"Config update error: {e}")
            emit("config_updated", {
                "status": "error", 
                "message": str(e)
            })

    @socketio.on("reset_tracking")
    def handle_reset_tracking():
        """Reset tracking state."""
        try:
            global tracking_state
            tracking_state = TrackingState()
            emit("tracking_reset", {"status": "success"})
            logging.info("Tracking state reset by client request")
        except Exception as e:
            logging.error(f"Reset tracking error: {e}")
            emit("tracking_reset", {"status": "error", "message": str(e)})

    return tracking_route

# Utility functions for external use
def get_model_info():
    """Get comprehensive information about loaded models."""
    return {
        "face_detection": face_app is not None,
        "emotion_recognition": emotion_model is not None,
        "emotion_labels": EMOTION_LABELS,
        "config": CONFIG.copy(),
        "tracking_stats": {
            "frame_count": tracking_state.frame_count,
            "active_tracks": len(tracking_state.last_seen)
        }
    }

def reset_tracking_state():
    """Reset all tracking state."""
    global tracking_state
    tracking_state = TrackingState()
    logging.info("Tracking state reset")

def health_check():
    """Perform system health check."""
    return {
        "status": "healthy" if (face_app is not None and emotion_model is not None) else "degraded",
        "models": get_model_info(),
        "memory_usage": "N/A",  # Could add psutil for memory monitoring
        "timestamp": time.time()
    }