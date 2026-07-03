import { useRef, useEffect, useCallback, useState, useMemo } from "react";

// Configuration with validation
const createConfig = () => {
  const config = {
    SCALE_FACTOR: 0.7,
    BASE_CAPTURE_INTERVAL: 800, // 1.25 FPS for a balance of stability and responsiveness
    MAX_CAPTURE_INTERVAL: 1000, // 1 FPS minimum
    MAX_CONSECUTIVE_FAILURES: 5,
    FRAME_TIMEOUT: 5000, // 5 seconds for stability
    JPEG_QUALITY: 0.8,
    DEBOUNCE_DELAY: 100,
    BACKOFF_MULTIPLIER: 1.5,
    MAX_RECONNECT_ATTEMPTS: 5,
    MAX_RETRY_ATTEMPTS: 3,
    CANVAS_CLEANUP_INTERVAL: 30000, // 30 seconds
    LOG_LEVEL: (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ? 'debug' : 'warn'
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
const createLogger = (level: any) => ({
  debug: level === 'debug' ? console.log : () => { },
  info: ['debug', 'info'].includes(level) ? console.info : () => { },
  warn: ['debug', 'info', 'warn'].includes(level) ? console.warn : () => { },
  error: console.error
});

// Debounce utility
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: any;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const CONFIG = createConfig();
const logger = createLogger(CONFIG.LOG_LEVEL);

export function useVideoProcessing(
  isTracking: boolean,
  isCameraOn: boolean,
  socketRef: React.MutableRefObject<any>,
  cameraRef: React.MutableRefObject<HTMLVideoElement | null>,
  screenRef: React.MutableRefObject<HTMLVideoElement | null>
) {
  // Enhanced state management
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for DOM elements and processing state
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<any>(null);
  const framePendingRef = useRef(false);
  const frameTimeoutRef = useRef<any>(null);
  const lastFrameSentTimeRef = useRef(0);
  const captureIntervalRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Enhanced refs for better control
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const activeBoxesRef = useRef<Set<any>>(new Set());
  const consecutiveFailuresRef = useRef(0);
  const currentVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pendingFrameTimeoutRef = useRef<any>(null);
  const retryAttemptsRef = useRef(0);
  const canvasCleanupIntervalRef = useRef<any>(null);

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
  }, []);

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
  }, []);

  const recordError = useCallback((error: any, context = '') => {
    logger.error(`Error in ${context}:`, error);
  }, []);


  // Function to clean up all bounding boxes with better DOM management
  const hideAllBoxes = useCallback(() => {
    logger.debug("Hiding all boxes");

    if (boxRef.current) {
      boxRef.current.style.display = "none";
    }

    if (videoContainerRef.current) {
      const boxes = videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
      boxes.forEach((box) => {
        (box as HTMLElement).style.display = "none";
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          if (box.parentNode) {
            box.remove();
          }
        });
      });
    }

    activeBoxesRef.current.clear();
  }, []);

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
    setIsProcessing(false);

    // Hide all boxes
    hideAllBoxes();
  }, [hideAllBoxes, cleanupCanvas]);

  // Handle tracking state changes with better lifecycle management
  useEffect(() => {
    logger.debug("Tracking state changed:", isTracking);

    if (isTracking && !isInitializedRef.current) {
      logger.info("Initializing tracking");
      isInitializedRef.current = true;
      setIsProcessing(false);

      // Start periodic canvas cleanup
      canvasCleanupIntervalRef.current = setInterval(cleanupCanvas, CONFIG.CANVAS_CLEANUP_INTERVAL);

    } else if (!isTracking) {
      logger.info("Stopping tracking");
      isInitializedRef.current = false;
      cleanup();
    }

    return cleanup;
  }, [isTracking, cleanup, cleanupCanvas]);

  // Enhanced video element validation with better error messages
  const validateVideoElement = useCallback((videoElement: any) => {
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
  }, []);

  // Debounced video validation
  const debouncedValidateVideo = useMemo(
    () =>
      debounce((videoElement: any, callback: (result: { valid: boolean; reason: string | null }) => void) => {
        const result = validateVideoElement(videoElement);
        callback(result);
      }, CONFIG.DEBOUNCE_DELAY),
    [validateVideoElement]
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
      const { canvas, ctx } = initializeCanvas();

      // Update canvas dimensions if needed
      const scaledWidth = Math.floor(videoElement!.videoWidth * CONFIG.SCALE_FACTOR);
      const scaledHeight = Math.floor(videoElement!.videoHeight * CONFIG.SCALE_FACTOR);

      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        logger.debug("Canvas resized:", { width: scaledWidth, height: scaledHeight });
      }

      // Clear and draw frame
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoElement!, 0, 0, canvas.width, canvas.height);
      }

      // Convert to Binary (Blob -> ArrayBuffer) for efficiency
      canvas?.toBlob(async (blob) => {
        if (!blob) {
          logger.error("Failed to create blob from canvas");
          framePendingRef.current = false;
          return;
        }

        const arrayBuffer = await blob.arrayBuffer();
        
        framePendingRef.current = true;
        const sendTime = Date.now();
        lastFrameSentTimeRef.current = sendTime;

        // Set timeout for pending frame
        pendingFrameTimeoutRef.current = setTimeout(() => {
          if (framePendingRef.current) {
            logger.warn("Frame acknowledgment timeout");
            framePendingRef.current = false;
            recordError(new Error("Frame acknowledgment timeout"), 'captureFrame');
            scheduleNextCapture(CONFIG.BASE_CAPTURE_INTERVAL); // Try again after timeout
          }
        }, CONFIG.FRAME_TIMEOUT);

        const frameData = {
          frame: arrayBuffer,
          dimensions: {
            width: canvas?.width || 0,
            height: canvas?.height || 0,
            originalWidth: videoElement!.videoWidth,
            originalHeight: videoElement!.videoHeight
          },
          detectMultiple: true,
          isSharedScreen: !isCameraOn && !!screenRef.current,
          timestamp: sendTime,
          scaleFactor: CONFIG.SCALE_FACTOR,
          quality: CONFIG.JPEG_QUALITY,
          retryAttempt: retryAttemptsRef.current
        };

        // Emit binary data
        socketRef.current.emit("video_frame", frameData, (ack: any) => {
          const receiveTime = Date.now();
          const processingTime = receiveTime - sendTime;
          
          if (pendingFrameTimeoutRef.current) {
            clearTimeout(pendingFrameTimeoutRef.current);
            pendingFrameTimeoutRef.current = null;
          }

          framePendingRef.current = false;
          consecutiveFailuresRef.current = 0;
          retryAttemptsRef.current = 0;

          if (ack?.success) {
            logger.debug(`Frame processed in ${processingTime}ms`);
          } else {
            recordError(new Error(ack?.error || "Frame not acknowledged"), 'socketResponse');
            logger.warn("Server error:", ack?.error);
          }

          // Schedule next capture
          scheduleNextCapture(CONFIG.BASE_CAPTURE_INTERVAL);
        });
      }, "image/jpeg", CONFIG.JPEG_QUALITY);

      return true;

    } catch (error: any) {
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
    recordError
  ]);

  // Recursive scheduling to prevent overlapping requests
  const scheduleNextCapture = useCallback((delay = CONFIG.BASE_CAPTURE_INTERVAL) => {
    if (!isTracking) return;

    if (captureIntervalRef.current) {
      clearTimeout(captureIntervalRef.current);
    }

    captureIntervalRef.current = setTimeout(() => {
      if (!captureFrame()) {
        // If capture failed (e.g. video not ready), retry sooner
        scheduleNextCapture(CONFIG.DEBOUNCE_DELAY);
      }
    }, delay);
  }, [isTracking, captureFrame, CONFIG]);

  // Enhanced initialization with better video handling
  const initializeCapturing = useCallback((videoElement: any) => {
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
          }
        }
      });
    }

    resizeObserverRef.current.observe(videoElement);

    // Start the first capture
    scheduleNextCapture(0);

  }, [validateVideoElement, initializeCanvas, captureFrame, scheduleNextCapture, logger, recordError]);

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
        (box as HTMLElement).style.display = "none";
      });

      // Clear active boxes set
      activeBoxesRef.current.clear();

      // If no tracking data, just hide boxes
      if (!Array.isArray(trackingData) || trackingData.length === 0) {
        return;
      }

      // Define color mapping for emotions
      const EMOTION_COLORS = {
        'Interested': '#4CAF50',      // Vibrant Green
        'Bored': '#FFC107',           // Amber/Yellow
        'Lacking_Focus': '#F44336',    // Soft Red
        'default': '#2196F3'          // Blue for unknown
      };

      // Update boxes for each face
      trackingData.forEach((face, index) => {
        if (!face.box || !Array.isArray(face.box) || face.box.length !== 4) {
          return;
        }

        const emotion = face.label || 'Detecting...';
        const color = EMOTION_COLORS[face.label] || EMOTION_COLORS.default;
        const boxId = `face-box-${index}`;
        const labelId = `face-label-${index}`;

        // Find or create box element
        let boxElement = document.getElementById(boxId);
        if (!boxElement) {
          boxElement = document.createElement("div");
          boxElement.id = boxId;
          boxElement.className = "position-absolute";
          boxElement.setAttribute('role', 'img');
          boxElement.style.cssText = `
            border: 2px solid ${color};
            z-index: 9999;
            pointer-events: none;
            box-sizing: border-box;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3), inset 0 0 5px ${color}44;
          `;

          // Add label element with accessibility
          const labelElement = document.createElement("div");
          labelElement.id = labelId;
          labelElement.className = "position-absolute px-2 py-1";
          labelElement.style.cssText = `
            top: -30px;
            left: -2px;
            background-color: ${color};
            color: white;
            font-size: 11px;
            font-family: 'Inter', system-ui, sans-serif;
            font-weight: 600;
            border-radius: 4px 4px 0 0;
            white-space: nowrap;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
          `;

          boxElement.appendChild(labelElement);
          videoContainerRef.current.appendChild(boxElement);
        }

        // Calculate and apply position
        const boxPos = calculateBoxPosition(face.box, videoElement);

        if (boxPos.width > 0 && boxPos.height > 0) {
          requestAnimationFrame(() => {
            boxElement.style.left = `${boxPos.left}px`;
            boxElement.style.top = `${boxPos.top}px`;
            boxElement.style.width = `${boxPos.width}px`;
            boxElement.style.height = `${boxPos.height}px`;
            boxElement.style.display = "block";
            boxElement.style.borderColor = color;
            boxElement.style.boxShadow = `0 0 15px ${color}33, inset 0 0 5px ${color}22`;
          });

          // Update label with confidence if available
          const labelElement = document.getElementById(labelId);
          if (labelElement) {
            const confidenceStr = face.confidence ? ` - ${Math.round(face.confidence * 100)}%` : '';
            labelElement.textContent = `${emotion}${confidenceStr}`;
            labelElement.style.backgroundColor = color;
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

    isProcessing,

    // Utility functions
    cleanup,
    validateVideoElement,

    // New utility functions
    recordError,
    cleanupCanvas,

    // Configuration access
    config: CONFIG,
  };
}