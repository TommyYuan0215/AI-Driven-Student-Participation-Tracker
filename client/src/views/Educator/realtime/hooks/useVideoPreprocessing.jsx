import { useRef, useEffect, useCallback, useState, useMemo } from "react";

// Configuration with validation
const createConfig = () => {
  const config = {
    SCALE_FACTOR: 0.5,
    BASE_CAPTURE_INTERVAL: 100, // 10 FPS
    MAX_CAPTURE_INTERVAL: 1000, // 1 FPS minimum
    MAX_CONSECUTIVE_FAILURES: 5,
    FRAME_TIMEOUT: 2000, // 2 seconds
    JPEG_QUALITY: 0.6,
    MAX_PROCESSING_TIME_SAMPLES: 10,
    DEBOUNCE_DELAY: 100,
    BACKOFF_MULTIPLIER: 1.5,
    MAX_RETRY_ATTEMPTS: 3,
    CANVAS_CLEANUP_INTERVAL: 30000, // 30 seconds
    LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
  };

  // Validate configuration
  if (config.SCALE_FACTOR <= 0 || config.SCALE_FACTOR > 1) {
    console.warn('Invalid SCALE_FACTOR, using default 0.5');
    config.SCALE_FACTOR = 0.5;
  }

  if (config.JPEG_QUALITY <= 0 || config.JPEG_QUALITY > 1) {
    console.warn('Invalid JPEG_QUALITY, using default 0.6');
    config.JPEG_QUALITY = 0.6;
  }

  return config;
};

// Logging utility
const createLogger = (level) => ({
  debug: level === 'debug' ? console.log : () => {},
  info: ['debug', 'info'].includes(level) ? console.info : () => {},
  warn: ['debug', 'info', 'warn'].includes(level) ? console.warn : () => {},
  error: console.error
});

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export function useVideoProcessing(
  isTracking,
  isCameraOn,
  socketRef,
  cameraRef,
  screenRef
) {
  // Memoized configuration and logger
  const CONFIG = useMemo(() => createConfig(), []);
  const logger = useMemo(() => createLogger(CONFIG.LOG_LEVEL), [CONFIG.LOG_LEVEL]);

  // Enhanced state management
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    framesProcessed: 0,
    framesSent: 0,
    errors: 0,
    avgProcessingTime: 0,
    successRate: 0,
    lastError: null
  });

  // Refs for DOM elements and processing state
  const videoContainerRef = useRef(null);
  const boxRef = useRef(null);
  const animationFrameRef = useRef(null);
  const framePendingRef = useRef(false);
  const frameTimeoutRef = useRef(null);
  const lastFrameSentTimeRef = useRef(0);
  const captureIntervalRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // Enhanced refs for better control
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const activeBoxesRef = useRef(new Set());
  const processingTimeRef = useRef([]);
  const consecutiveFailuresRef = useRef(0);
  const currentVideoElementRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const pendingFrameTimeoutRef = useRef(null);
  const retryAttemptsRef = useRef(0);
  const canvasCleanupIntervalRef = useRef(null);
  const metricsRef = useRef({
    totalFrames: 0,
    successfulFrames: 0,
    errors: []
  });

  // Enhanced canvas management with cleanup
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      ctxRef.current = canvasRef.current.getContext("2d", {
        alpha: false,
        willReadFrequently: false,
        desynchronized: true // Better performance
      });
      
      logger.debug("Canvas initialized");
    }
    return { canvas: canvasRef.current, ctx: ctxRef.current };
  }, [logger]);

  // Canvas cleanup utility
  const cleanupCanvas = useCallback(() => {
    if (canvasRef.current && ctxRef.current) {
      try {
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Reset canvas dimensions to free memory
        canvasRef.current.width = 1;
        canvasRef.current.height = 1;
        logger.debug("Canvas cleaned up");
      } catch (error) {
        logger.error("Error cleaning up canvas:", error);
      }
    }
  }, [logger]);

  // Enhanced error tracking
  const recordError = useCallback((error, context = '') => {
    const errorRecord = {
      timestamp: Date.now(),
      error: error.message || error,
      context,
      stack: error.stack
    };
    
    metricsRef.current.errors.push(errorRecord);
    
    // Keep only last 50 errors to prevent memory leak
    if (metricsRef.current.errors.length > 50) {
      metricsRef.current.errors.shift();
    }
    
    setProcessingStats(prev => ({
      ...prev,
      errors: prev.errors + 1,
      lastError: errorRecord,
      successRate: metricsRef.current.totalFrames > 0 ? 
        (metricsRef.current.successfulFrames / metricsRef.current.totalFrames) * 100 : 0
    }));
  }, []);

  // Exponential backoff calculation
  const getBackoffInterval = useCallback((failureCount) => {
    return Math.min(
      CONFIG.BASE_CAPTURE_INTERVAL * Math.pow(CONFIG.BACKOFF_MULTIPLIER, failureCount),
      CONFIG.MAX_CAPTURE_INTERVAL
    );
  }, [CONFIG]);

  // Function to clean up all bounding boxes with better DOM management
  const hideAllBoxes = useCallback(() => {
    logger.debug("Hiding all boxes");

    if (boxRef.current) {
      boxRef.current.style.display = "none";
    }

    if (videoContainerRef.current) {
      const boxes = videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
      boxes.forEach((box) => {
        box.style.display = "none";
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          if (box.parentNode) {
            box.remove();
          }
        });
      });
    }

    activeBoxesRef.current.clear();
  }, [logger]);

  // Enhanced cleanup function with better resource management
  const cleanup = useCallback(() => {
    logger.info("Cleaning up video processing");

    // Clear all timeouts and intervals
    [
      animationFrameRef,
      captureIntervalRef,
      frameTimeoutRef,
      pendingFrameTimeoutRef,
      canvasCleanupIntervalRef
    ].forEach(ref => {
      if (ref.current) {
        if (ref === animationFrameRef) {
          cancelAnimationFrame(ref.current);
        } else {
          clearTimeout(ref.current);
          clearInterval(ref.current);
        }
        ref.current = null;
      }
    });

    // Disconnect resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // Clean up canvas
    cleanupCanvas();

    // Reset state and refs
    framePendingRef.current = false;
    consecutiveFailuresRef.current = 0;
    retryAttemptsRef.current = 0;
    currentVideoElementRef.current = null;
    processingTimeRef.current = [];
    
    // Reset metrics
    metricsRef.current = {
      totalFrames: 0,
      successfulFrames: 0,
      errors: []
    };
    
    setIsProcessing(false);
    
    // Hide all boxes
    hideAllBoxes();
  }, [hideAllBoxes, cleanupCanvas, logger]);

  // Handle tracking state changes with better lifecycle management
  useEffect(() => {
    logger.debug("Tracking state changed:", isTracking);

    if (isTracking && !isInitializedRef.current) {
      logger.info("Initializing tracking");
      isInitializedRef.current = true;
      setIsProcessing(false);
      
      // Reset stats
      setProcessingStats({
        framesProcessed: 0,
        framesSent: 0,
        errors: 0,
        avgProcessingTime: 0,
        successRate: 0,
        lastError: null
      });

      // Start periodic canvas cleanup
      canvasCleanupIntervalRef.current = setInterval(cleanupCanvas, CONFIG.CANVAS_CLEANUP_INTERVAL);
      
    } else if (!isTracking) {
      logger.info("Stopping tracking");
      isInitializedRef.current = false;
      cleanup();
    }

    return cleanup;
  }, [isTracking, cleanup, cleanupCanvas, CONFIG.CANVAS_CLEANUP_INTERVAL, logger]);

  // Enhanced video element validation with better error messages
  const validateVideoElement = useCallback((videoElement) => {
    if (!videoElement) {
      logger.error("No video element found");
      return { valid: false, reason: "No video element" };
    }

    if (videoElement.readyState < 2) {
      logger.warn("Video element not ready, readyState:", videoElement.readyState);
      return { valid: false, reason: "Video not ready" };
    }

    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      logger.warn("Video dimensions not available:", { 
        width: videoElement.videoWidth, 
        height: videoElement.videoHeight 
      });
      return { valid: false, reason: "Invalid dimensions" };
    }

    if (videoElement.ended || videoElement.paused) {
      logger.warn("Video is not playing:", { 
        ended: videoElement.ended, 
        paused: videoElement.paused 
      });
      return { valid: false, reason: "Video not playing" };
    }

    return { valid: true, reason: null };
  }, [logger]);

  // Debounced video validation
  const debouncedValidateVideo = useCallback(
    debounce((videoElement, callback) => {
      const result = validateVideoElement(videoElement);
      callback(result);
    }, CONFIG.DEBOUNCE_DELAY),
    [validateVideoElement, CONFIG.DEBOUNCE_DELAY]
  );

  // Enhanced frame capture with better error handling and retry logic
  const captureFrame = useCallback(() => {
    if (!isTracking) {
      logger.warn("Tracking is OFF. Stopping frame capture.");
      return false;
    }

    if (!socketRef.current?.connected) {
      logger.warn("Socket not connected. Skipping frame.");
      consecutiveFailuresRef.current++;
      return false;
    }

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    const validation = validateVideoElement(videoElement);
    
    if (!validation.valid) {
      consecutiveFailuresRef.current++;
      recordError(new Error(`Video validation failed: ${validation.reason}`), 'captureFrame');
      return false;
    }

    currentVideoElementRef.current = videoElement;

    // Enhanced frame pending check
    const currentTime = Date.now();
    if (framePendingRef.current) {
      const timeSinceLastFrame = currentTime - lastFrameSentTimeRef.current;
      if (timeSinceLastFrame > CONFIG.FRAME_TIMEOUT) {
        logger.warn("Frame timeout detected, resetting pending state");
        framePendingRef.current = false;
        if (pendingFrameTimeoutRef.current) {
          clearTimeout(pendingFrameTimeoutRef.current);
          pendingFrameTimeoutRef.current = null;
        }
      } else {
        return false; // Skip if frame is still pending
      }
    }

    try {
      const startTime = performance.now();
      
      const { canvas, ctx } = initializeCanvas();
      
      // Update canvas dimensions if needed
      const scaledWidth = Math.floor(videoElement.videoWidth * CONFIG.SCALE_FACTOR);
      const scaledHeight = Math.floor(videoElement.videoHeight * CONFIG.SCALE_FACTOR);
      
      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        logger.debug("Canvas resized:", { width: scaledWidth, height: scaledHeight });
      }

      // Clear and draw frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL("image/jpeg", CONFIG.JPEG_QUALITY);
      
      framePendingRef.current = true;
      lastFrameSentTimeRef.current = currentTime;
      metricsRef.current.totalFrames++;

      // Set timeout for pending frame
      pendingFrameTimeoutRef.current = setTimeout(() => {
        if (framePendingRef.current) {
          logger.warn("Frame acknowledgment timeout");
          framePendingRef.current = false;
          recordError(new Error("Frame acknowledgment timeout"), 'captureFrame');
        }
      }, CONFIG.FRAME_TIMEOUT);

      // Enhanced frame data with metadata
      const frameData = {
        frame: imageData,
        dimensions: {
          width: canvas.width,
          height: canvas.height,
          originalWidth: videoElement.videoWidth,
          originalHeight: videoElement.videoHeight
        },
        detectMultiple: true,
        isSharedScreen: !isCameraOn && !!screenRef.current,
        timestamp: currentTime,
        scaleFactor: CONFIG.SCALE_FACTOR,
        quality: CONFIG.JPEG_QUALITY,
        retryAttempt: retryAttemptsRef.current
      };

      // Enhanced socket emission with error handling
      const emitPromise = new Promise((resolve, reject) => {
        socketRef.current.emit("video_frame", frameData, (ack) => {
          resolve(ack);
        });
        
        // Handle socket errors
        socketRef.current.once('error', (error) => {
          reject(error);
        });
      });

      emitPromise
        .then((ack) => {
          if (pendingFrameTimeoutRef.current) {
            clearTimeout(pendingFrameTimeoutRef.current);
            pendingFrameTimeoutRef.current = null;
          }

          framePendingRef.current = false;
          consecutiveFailuresRef.current = 0;
          retryAttemptsRef.current = 0;

          const processingTime = performance.now() - startTime;
          
          if (ack?.success) {
            metricsRef.current.successfulFrames++;
          }
          
          // Update processing stats
          setProcessingStats(prev => {
            const newStats = {
              ...prev,
              framesProcessed: prev.framesProcessed + 1,
              framesSent: ack?.success ? prev.framesSent + 1 : prev.framesSent,
              errors: ack?.success ? prev.errors : prev.errors + 1
            };

            // Calculate average processing time
            processingTimeRef.current.push(processingTime);
            if (processingTimeRef.current.length > CONFIG.MAX_PROCESSING_TIME_SAMPLES) {
              processingTimeRef.current.shift();
            }
            
            newStats.avgProcessingTime = processingTimeRef.current.reduce((a, b) => a + b, 0) / processingTimeRef.current.length;
            newStats.successRate = metricsRef.current.totalFrames > 0 ? 
              (metricsRef.current.successfulFrames / metricsRef.current.totalFrames) * 100 : 0;
            
            return newStats;
          });

          if (!ack?.success) {
            recordError(new Error(ack?.error || "Frame not acknowledged"), 'socketResponse');
            logger.warn("Frame not acknowledged by server:", ack?.error);
          }
        })
        .catch((error) => {
          logger.error('Socket emission error:', error);
          framePendingRef.current = false;
          consecutiveFailuresRef.current++;
          recordError(error, 'socketEmission');
        });

      return true;

    } catch (error) {
      logger.error("Error capturing frame:", error);
      framePendingRef.current = false;
      consecutiveFailuresRef.current++;
      recordError(error, 'captureFrame');
      
      return false;
    }
  }, [
    isTracking, 
    isCameraOn, 
    socketRef, 
    cameraRef, 
    screenRef, 
    validateVideoElement, 
    initializeCanvas, 
    CONFIG, 
    logger, 
    recordError
  ]);

  // Enhanced capture management with adaptive frame rate and retry logic
  const manageCaptureInterval = useCallback(() => {
    if (consecutiveFailuresRef.current >= CONFIG.MAX_CONSECUTIVE_FAILURES) {
      const backoffInterval = getBackoffInterval(Math.floor(consecutiveFailuresRef.current / CONFIG.MAX_CONSECUTIVE_FAILURES));
      
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      
      logger.warn(`Adjusting capture interval to ${backoffInterval}ms due to failures`);
      
      captureIntervalRef.current = setInterval(() => {
        if (captureFrame()) {
          consecutiveFailuresRef.current = Math.max(0, consecutiveFailuresRef.current - 1);
        } else if (retryAttemptsRef.current < CONFIG.MAX_RETRY_ATTEMPTS) {
          retryAttemptsRef.current++;
          logger.debug(`Retry attempt ${retryAttemptsRef.current}/${CONFIG.MAX_RETRY_ATTEMPTS}`);
        }
      }, backoffInterval);
    }
  }, [captureFrame, getBackoffInterval, CONFIG, logger]);

  // Enhanced initialization with better video handling
  const initializeCapturing = useCallback((videoElement) => {
    const validation = validateVideoElement(videoElement);
    if (!validation.valid) {
      logger.error("Cannot initialize capturing - invalid video element:", validation.reason);
      return;
    }

    logger.info("Initializing video capture");
    setIsProcessing(true);

    // Ensure video is playing
    if (videoElement.paused) {
      logger.warn("Video is paused. Attempting to play...");
      videoElement
        .play()
        .catch((e) => {
          logger.error("Couldn't play video:", e);
          recordError(e, 'videoPlay');
        });
    }

    // Clear any existing intervals
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    // Reset counters
    consecutiveFailuresRef.current = 0;
    retryAttemptsRef.current = 0;

    // Initialize canvas
    initializeCanvas();

    // Set up resize observer for video element
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === videoElement) {
            logger.debug("Video element resized, updating canvas");
            // Canvas will be updated on next frame capture
          }
        }
      });
    }
    
    resizeObserverRef.current.observe(videoElement);

    // Start regular capture
    captureIntervalRef.current = setInterval(() => {
      if (!captureFrame()) {
        manageCaptureInterval();
      }
    }, CONFIG.BASE_CAPTURE_INTERVAL);

  }, [validateVideoElement, initializeCanvas, captureFrame, manageCaptureInterval, CONFIG, logger, recordError]);

  // Enhanced start function with better video readiness checking
  const startSendingVideo = useCallback(() => {
    if (!isTracking) {
      logger.info("Can't start sending video - tracking is off");
      return;
    }

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;

    if (!videoElement) {
      logger.error("No video element found!");
      recordError(new Error("No video element found"), 'startSendingVideo');
      return;
    }

    const checkVideoReady = () => {
      debouncedValidateVideo(videoElement, (validation) => {
        if (validation.valid) {
          initializeCapturing(videoElement);
        } else {
          logger.debug("Video not ready, checking again...", validation.reason);
          setTimeout(checkVideoReady, 100);
        }
      });
    };

    checkVideoReady();
  }, [
    isTracking, 
    isCameraOn, 
    cameraRef, 
    screenRef, 
    debouncedValidateVideo, 
    initializeCapturing, 
    logger, 
    recordError
  ]);

  // Enhanced bounding box calculation with better error handling
  const calculateBoxPosition = useCallback((box, videoElement) => {
    if (!box || !videoElement || !videoContainerRef.current) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    try {
      const [rawX, rawY, rawWidth, rawHeight] = box;
      const scaleFactor = 1 / CONFIG.SCALE_FACTOR;
      
      const x = rawX * scaleFactor;
      const y = rawY * scaleFactor;
      const width = rawWidth * scaleFactor;
      const height = rawHeight * scaleFactor;

      const videoWidth = videoElement.videoWidth || 640;
      const videoHeight = videoElement.videoHeight || 480;

      const videoRect = videoElement.getBoundingClientRect();
      const containerRect = videoContainerRef.current.getBoundingClientRect();

      const scaleX = videoRect.width / videoWidth;
      const scaleY = videoRect.height / videoHeight;
      const scale = Math.min(scaleX, scaleY);

      const offsetX = (videoRect.width - videoWidth * scale) / 2;
      const offsetY = (videoRect.height - videoHeight * scale) / 2;

      return {
        left: Math.max(0, videoRect.left + x * scale + offsetX - containerRect.left),
        top: Math.max(0, videoRect.top + y * scale + offsetY - containerRect.top),
        width: Math.max(0, width * scale),
        height: Math.max(0, height * scale),
      };
    } catch (error) {
      logger.error("Error calculating box position:", error);
      recordError(error, 'calculateBoxPosition');
      return { left: 0, top: 0, width: 0, height: 0 };
    }
  }, [CONFIG.SCALE_FACTOR, logger, recordError]);

  // Enhanced bounding box updates with better DOM management and accessibility
  const updateBoundingBoxes = useCallback((trackingData) => {
    if (!isTracking || !videoContainerRef.current) {
      hideAllBoxes();
      return;
    }

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    const validation = validateVideoElement(videoElement);
    if (!validation.valid) {
      return;
    }

    try {
      // Hide all existing boxes first
      const existingBoxes = videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
      existingBoxes.forEach((box) => {
        box.style.display = "none";
      });

      // Clear active boxes set
      activeBoxesRef.current.clear();

      // If no tracking data, just hide boxes
      if (!Array.isArray(trackingData) || trackingData.length === 0) {
        return;
      }

      // Update boxes for each face
      trackingData.forEach((face, index) => {
        if (!face.box || !Array.isArray(face.box) || face.box.length !== 4) {
          return;
        }

        const boxId = `face-box-${index}`;
        const labelId = `face-label-${index}`;
        
        // Find or create box element
        let boxElement = document.getElementById(boxId);
        if (!boxElement) {
          boxElement = document.createElement("div");
          boxElement.id = boxId;
          boxElement.className = "position-absolute";
          boxElement.setAttribute('role', 'img');
          boxElement.setAttribute('aria-label', 'Face detection box');
          boxElement.style.cssText = `
            border: 3px solid #ff0000;
            z-index: 9999;
            pointer-events: none;
            box-sizing: border-box;
            transition: all 0.1s ease-out;
          `;

          // Add label element with accessibility
          const labelElement = document.createElement("div");
          labelElement.id = labelId;
          labelElement.className = "position-absolute px-2 py-1";
          labelElement.setAttribute('aria-live', 'polite');
          labelElement.style.cssText = `
            top: -28px;
            left: 0;
            background-color: #ff0000;
            color: white;
            font-size: 12px;
            font-weight: bold;
            border-radius: 4px;
            white-space: nowrap;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
          `;

          boxElement.appendChild(labelElement);
          videoContainerRef.current.appendChild(boxElement);
        }

        // Calculate and apply position
        const boxPos = calculateBoxPosition(face.box, videoElement);
        
        if (boxPos.width > 0 && boxPos.height > 0) {
          // Use requestAnimationFrame for smooth updates
          requestAnimationFrame(() => {
            boxElement.style.left = `${boxPos.left}px`;
            boxElement.style.top = `${boxPos.top}px`;
            boxElement.style.width = `${boxPos.width}px`;
            boxElement.style.height = `${boxPos.height}px`;
            boxElement.style.display = "block";
          });

          // Update label
          const labelElement = document.getElementById(labelId);
          if (labelElement) {
            const confidence = face.confidence ? ` (${Math.round(face.confidence * 100)}%)` : "";
            const label = face.label || "Detecting...";
            labelElement.textContent = `${label}${confidence}`;
          }

          activeBoxesRef.current.add(boxId);
        }
      });

      // Clean up unused boxes with requestAnimationFrame
      existingBoxes.forEach((box) => {
        if (!activeBoxesRef.current.has(box.id)) {
          requestAnimationFrame(() => {
            if (box.parentNode) {
              box.remove();
            }
          });
        }
      });

    } catch (error) {
      logger.error("Error updating bounding boxes:", error);
      recordError(error, 'updateBoundingBoxes');
    }
  }, [
    isTracking, 
    isCameraOn, 
    cameraRef, 
    screenRef, 
    validateVideoElement, 
    calculateBoxPosition, 
    hideAllBoxes, 
    logger, 
    recordError
  ]);

  // Cleanup on unmount with enhanced resource management
  useEffect(() => {
    return () => {
      cleanup();
      // Clean up canvas references
      if (canvasRef.current) {
        canvasRef.current = null;
        ctxRef.current = null;
      }
      // Clear processing time array
      processingTimeRef.current = [];
    };
  }, [cleanup]);

  // Enhanced return object with additional utilities
  return {
    // Core functionality
    videoContainerRef,
    boxRef,
    startSendingVideo,
    calculateBoxPosition,
    hideAllBoxes,
    updateBoundingBoxes,
    
    // Enhanced state and metrics
    isProcessing,
    processingStats,
    
    // Utility functions
    cleanup,
    validateVideoElement,
    
    // New utility functions
    recordError,
    cleanupCanvas,
    
    // Configuration access
    config: CONFIG,
    
    // Debugging helpers (only in development)
    ...(CONFIG.LOG_LEVEL === 'debug' && {
      getMetrics: () => metricsRef.current,
      getProcessingTimes: () => processingTimeRef.current,
      getActiveBoxes: () => Array.from(activeBoxesRef.current)
    })
  };
}