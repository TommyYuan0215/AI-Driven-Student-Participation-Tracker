import { useRef, useEffect, useCallback, useState } from "react";

export function useVideoProcessing(
  isTracking,
  isCameraOn,
  socketRef,
  cameraRef,
  screenRef
) {
  // Enhanced state management
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    framesProcessed: 0,
    framesSent: 0,
    errors: 0,
    avgProcessingTime: 0
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

  // Configuration constants
  const CONFIG = {
    SCALE_FACTOR: 0.5,
    BASE_CAPTURE_INTERVAL: 100, // 10 FPS
    MAX_CAPTURE_INTERVAL: 1000, // 1 FPS minimum
    MAX_CONSECUTIVE_FAILURES: 5,
    FRAME_TIMEOUT: 2000, // 2 seconds
    JPEG_QUALITY: 0.6,
    MAX_PROCESSING_TIME_SAMPLES: 10,
    DEBOUNCE_DELAY: 100
  };

  // Enhanced canvas management
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      ctxRef.current = canvasRef.current.getContext("2d", {
        alpha: false,
        willReadFrequently: false
      });
    }
    return { canvas: canvasRef.current, ctx: ctxRef.current };
  }, []);

  // Function to clean up all bounding boxes
  const hideAllBoxes = useCallback(() => {
    console.log("Hiding all boxes");

    if (boxRef.current) {
      boxRef.current.style.display = "none";
    }

    if (videoContainerRef.current) {
      const boxes = videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
      boxes.forEach((box) => {
        box.style.display = "none";
        box.remove(); // Clean up DOM
      });
    }

    activeBoxesRef.current.clear();
  }, []);

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    console.log("Cleaning up video processing");

    // Clear all timeouts and intervals
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (frameTimeoutRef.current) {
      clearTimeout(frameTimeoutRef.current);
      frameTimeoutRef.current = null;
    }

    if (pendingFrameTimeoutRef.current) {
      clearTimeout(pendingFrameTimeoutRef.current);
      pendingFrameTimeoutRef.current = null;
    }

    // Disconnect resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // Reset state
    framePendingRef.current = false;
    consecutiveFailuresRef.current = 0;
    setIsProcessing(false);
    
    // Hide all boxes
    hideAllBoxes();
  }, [hideAllBoxes]);

  // Handle tracking state changes with better lifecycle management
  useEffect(() => {
    console.log("Tracking state changed:", isTracking);

    if (isTracking && !isInitializedRef.current) {
      console.log("Initializing tracking");
      isInitializedRef.current = true;
      setIsProcessing(false);
      
      // Reset stats
      setProcessingStats({
        framesProcessed: 0,
        framesSent: 0,
        errors: 0,
        avgProcessingTime: 0
      });
    } else if (!isTracking) {
      console.log("Stopping tracking");
      isInitializedRef.current = false;
      cleanup();
    }

    return cleanup;
  }, [isTracking, cleanup]);

  // Enhanced video element validation
  const validateVideoElement = useCallback((videoElement) => {
    if (!videoElement) {
      console.error("No video element found");
      return false;
    }

    if (videoElement.readyState < 2) { // HAVE_CURRENT_DATA
      console.warn("Video element not ready");
      return false;
    }

    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.warn("Video dimensions not available");
      return false;
    }

    return true;
  }, []);

  // Enhanced frame capture with better error handling
  const captureFrame = useCallback(() => {
    if (!isTracking) {
      console.warn("Tracking is OFF. Stopping frame capture.");
      return false;
    }

    if (!socketRef.current?.connected) {
      console.warn("Socket not connected. Skipping frame.");
      consecutiveFailuresRef.current++;
      return false;
    }

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    if (!validateVideoElement(videoElement)) {
      consecutiveFailuresRef.current++;
      return false;
    }

    currentVideoElementRef.current = videoElement;

    // Check if frame is already pending
    const currentTime = Date.now();
    if (framePendingRef.current) {
      if (currentTime - lastFrameSentTimeRef.current > CONFIG.FRAME_TIMEOUT) {
        console.warn("Frame timeout detected, resetting pending state");
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
      }

      // Clear and draw frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL("image/jpeg", CONFIG.JPEG_QUALITY);
      
      framePendingRef.current = true;
      lastFrameSentTimeRef.current = currentTime;

      // Set timeout for pending frame
      pendingFrameTimeoutRef.current = setTimeout(() => {
        if (framePendingRef.current) {
          console.warn("Frame acknowledgment timeout");
          framePendingRef.current = false;
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
        timestamp: currentTime,
        scaleFactor: CONFIG.SCALE_FACTOR,
        quality: CONFIG.JPEG_QUALITY
      };

      socketRef.current.emit("video_frame", frameData, (ack) => {
        if (pendingFrameTimeoutRef.current) {
          clearTimeout(pendingFrameTimeoutRef.current);
          pendingFrameTimeoutRef.current = null;
        }

        framePendingRef.current = false;
        consecutiveFailuresRef.current = 0;

        const processingTime = performance.now() - startTime;
        
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
          
          return newStats;
        });

        if (!ack?.success) {
          console.warn("Frame not acknowledged by server:", ack?.error);
        }
      });

      return true;

    } catch (error) {
      console.error("Error capturing frame:", error);
      framePendingRef.current = false;
      consecutiveFailuresRef.current++;
      
      setProcessingStats(prev => ({
        ...prev,
        errors: prev.errors + 1
      }));
      
      return false;
    }
  }, [isTracking, isCameraOn, socketRef, cameraRef, screenRef, validateVideoElement, initializeCanvas]);

  // Enhanced capture management with adaptive frame rate
  const manageCaptureInterval = useCallback(() => {
    if (consecutiveFailuresRef.current >= CONFIG.MAX_CONSECUTIVE_FAILURES) {
      // Reduce frame rate on consecutive failures
      const currentInterval = captureIntervalRef.current ? 
        CONFIG.BASE_CAPTURE_INTERVAL * Math.pow(2, Math.floor(consecutiveFailuresRef.current / CONFIG.MAX_CONSECUTIVE_FAILURES)) :
        CONFIG.BASE_CAPTURE_INTERVAL;
      
      const newInterval = Math.min(currentInterval, CONFIG.MAX_CAPTURE_INTERVAL);
      
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      
      console.warn(`Adjusting capture interval to ${newInterval}ms due to failures`);
      
      captureIntervalRef.current = setInterval(() => {
        if (captureFrame()) {
          consecutiveFailuresRef.current = Math.max(0, consecutiveFailuresRef.current - 1);
        }
      }, newInterval);
    }
  }, [captureFrame]);

  // Enhanced initialization with better video handling
  const initializeCapturing = useCallback((videoElement) => {
    if (!validateVideoElement(videoElement)) {
      console.error("Cannot initialize capturing - invalid video element");
      return;
    }

    console.log("Initializing video capture");
    setIsProcessing(true);

    // Ensure video is playing
    if (videoElement.paused) {
      console.warn("Video is paused. Attempting to play...");
      videoElement
        .play()
        .catch((e) => console.error("Couldn't play video:", e));
    }

    // Clear any existing intervals
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    // Reset failure counter
    consecutiveFailuresRef.current = 0;

    // Initialize canvas
    initializeCanvas();

    // Set up resize observer for video element
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === videoElement) {
            console.log("Video element resized, updating canvas");
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

  }, [validateVideoElement, initializeCanvas, captureFrame, manageCaptureInterval]);

  // Enhanced start function with better video readiness checking
  const startSendingVideo = useCallback(() => {
    if (!isTracking) {
      console.log("Can't start sending video - tracking is off");
      return;
    }

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;

    if (!videoElement) {
      console.error("No video element found!");
      return;
    }

    const checkVideoReady = () => {
      if (validateVideoElement(videoElement)) {
        initializeCapturing(videoElement);
      } else {
        console.log("Video not ready, checking again...");
        setTimeout(checkVideoReady, 100);
      }
    };

    checkVideoReady();
  }, [isTracking, isCameraOn, cameraRef, screenRef, validateVideoElement, initializeCapturing]);

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
      console.error("Error calculating box position:", error);
      return { left: 0, top: 0, width: 0, height: 0 };
    }
  }, []);

  // Enhanced bounding box updates with better DOM management
  const updateBoundingBoxes = useCallback((trackingData) => {
    if (!isTracking || !videoContainerRef.current) {
      hideAllBoxes();
      return;
    }

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    if (!validateVideoElement(videoElement)) {
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
          boxElement.style.cssText = `
            border: 3px solid #ff0000;
            z-index: 9999;
            pointer-events: none;
            box-sizing: border-box;
            transition: all 0.1s ease-out;
          `;

          // Add label element
          const labelElement = document.createElement("div");
          labelElement.id = labelId;
          labelElement.className = "position-absolute px-2 py-1";
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
          boxElement.style.left = `${boxPos.left}px`;
          boxElement.style.top = `${boxPos.top}px`;
          boxElement.style.width = `${boxPos.width}px`;
          boxElement.style.height = `${boxPos.height}px`;
          boxElement.style.display = "block";

          // Update label
          const labelElement = document.getElementById(labelId);
          if (labelElement) {
            // const confidence = face.confidence ? ` (${Math.round(face.confidence * 100)}%)` : "";
            const label = face.label || "Detecting...";
            labelElement.textContent = `${label}`;
          }

          activeBoxesRef.current.add(boxId);
        }
      });

      // Clean up unused boxes
      existingBoxes.forEach((box) => {
        if (!activeBoxesRef.current.has(box.id)) {
          box.remove();
        }
      });

    } catch (error) {
      console.error("Error updating bounding boxes:", error);
    }
  }, [isTracking, isCameraOn, cameraRef, screenRef, validateVideoElement, calculateBoxPosition, hideAllBoxes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Clean up canvas
      if (canvasRef.current) {
        canvasRef.current = null;
        ctxRef.current = null;
      }
    };
  }, [cleanup]);

  return {
    videoContainerRef,
    boxRef,
    startSendingVideo,
    calculateBoxPosition,
    hideAllBoxes,
    updateBoundingBoxes,
    
    // Enhanced return values
    isProcessing,
    processingStats,
    cleanup,
    
    // Utility functions
    validateVideoElement,
  };
}