import { useRef, useEffect } from "react";

export function useVideoProcessing(
  isTracking,
  isCameraOn,
  socketRef,
  cameraRef,
  screenRef
) {
  const videoContainerRef = useRef(null);
  const boxRef = useRef(null);
  const animationFrameRef = useRef(null);
  const framePendingRef = useRef(false);
  const frameTimeoutRef = useRef(null);
  const lastFrameSentTimeRef = useRef(0);
  const captureIntervalRef = useRef(null);

  // Function to hide all bounding boxes
  const hideAllBoxes = () => {
    console.log("Hiding all boxes");

    if (boxRef.current) {
      boxRef.current.style.display = "none";
    }

    if (videoContainerRef.current) {
      const boxes =
        videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
      boxes.forEach((box) => {
        box.style.display = "none";
      });
    }
  };

  // Handle tracking state changes
  useEffect(() => {
    console.log("Tracking state changed:", isTracking);

    if (isTracking) {
      console.log("Tracking started");
    } else {
      console.log("Tracking stopped, cleaning up");

      // Cancel animation frame when tracking stops
      if (animationFrameRef.current) {
        console.log("Canceling animation frame:", animationFrameRef.current);
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Clear capture interval
      if (captureIntervalRef.current) {
        console.log("Clearing capture interval");
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }

      // Explicitly hide all boxes
      hideAllBoxes();
    }

    // Clean up on unmount or when tracking state changes
    return () => {
      console.log("Cleanup function running");

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }

      hideAllBoxes();
    };
  }, [isTracking]);

  const startSendingVideo = () => {
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
      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        initializeCapturing(videoElement);
      } else {
        setTimeout(checkVideoReady, 100);
      }
    };

    checkVideoReady();
  };

  const initializeCapturing = (videoElement) => {
    if (videoElement.paused) {
      console.warn("Video is paused. Attempting to play...");
      videoElement
        .play()
        .catch((e) => console.error("Couldn't play video:", e));
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scaleFactor = 0.5;
    canvas.width = videoElement.videoWidth * scaleFactor;
    canvas.height = videoElement.videoHeight * scaleFactor;

    // Clear any existing interval
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    let captureInterval = 100;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;

    const captureFrame = () => {
      // Double-check tracking is still on
      if (!isTracking) {
        console.warn("Tracking is OFF. Stopping video frame capture.");
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current);
          captureIntervalRef.current = null;
        }
        return;
      }

      if (!socketRef.current || !socketRef.current.connected) {
        console.warn(
          "Socket not available or not connected! Skipping frame send."
        );
        consecutiveFailures++;

        if (consecutiveFailures >= maxConsecutiveFailures) {
          if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
          }
          const newInterval = captureInterval * 2;
          captureInterval = newInterval;
          captureIntervalRef.current = setInterval(captureFrame, newInterval);
          consecutiveFailures = 0;
          console.warn("Reduced frame rate due to connection issues");
        }
        return;
      }

      const currentTime = Date.now();
      if (
        framePendingRef.current &&
        currentTime - lastFrameSentTimeRef.current > 500
      ) {
        console.warn("Forcing reset of pending frame flag due to timeout");
        framePendingRef.current = false;
      }

      if (framePendingRef.current) {
        console.log("Frame pending, skipping this capture");
        return;
      }

      try {
        consecutiveFailures = 0;

        if (
          canvas.width !== videoElement.videoWidth * scaleFactor ||
          canvas.height !== videoElement.videoHeight * scaleFactor
        ) {
          canvas.width = videoElement.videoWidth * scaleFactor;
          canvas.height = videoElement.videoHeight * scaleFactor;
        }

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.5);

        framePendingRef.current = true;
        lastFrameSentTimeRef.current = Date.now();

        socketRef.current.emit("video_frame", {
          frame: imageData,
          dimensions: {
            width: canvas.width,
            height: canvas.height,
          },
          detectMultiple: true,
          timestamp: Date.now(),
        });

        if (frameTimeoutRef.current) {
          clearTimeout(frameTimeoutRef.current);
        }

        frameTimeoutRef.current = setTimeout(() => {
          if (framePendingRef.current) {
            console.warn("Frame acknowledgment timed out");
            framePendingRef.current = false;
          }
        }, 1000);
      } catch (error) {
        console.error("Error capturing video frame:", error);
        framePendingRef.current = false;
        consecutiveFailures++;

        if (consecutiveFailures >= maxConsecutiveFailures) {
          if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
          }
          const newInterval = captureInterval * 2;
          captureInterval = newInterval;
          captureIntervalRef.current = setInterval(captureFrame, newInterval);
          consecutiveFailures = 0;
          console.warn("Reduced frame rate due to capture errors");
        }
      }
    };

    captureIntervalRef.current = setInterval(captureFrame, captureInterval);
  };

  const calculateBoxPosition = (box, videoElement) => {
    if (!box || !videoElement) return { left: 0, top: 0, width: 0, height: 0 };

    const transmissionScaleFactor = 0.5;

    const [rawX, rawY, rawWidth, rawHeight] = box;
    const x = rawX / transmissionScaleFactor;
    const y = rawY / transmissionScaleFactor;
    const width = rawWidth / transmissionScaleFactor;
    const height = rawHeight / transmissionScaleFactor;

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
      left: videoRect.left + x * scale + offsetX - containerRect.left,
      top: videoRect.top + y * scale + offsetY - containerRect.top,
      width: width * scale,
      height: height * scale,
    };
  };

  // We'll also add a method to manually update the UI when tracking data changes
  const updateBoundingBoxes = (trackingData) => {
    if (!isTracking) {
      hideAllBoxes();
      return;
    }

    // Skip if no container
    if (!videoContainerRef.current) return;

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    if (!videoElement) return;

    // Hide all existing boxes first
    const existingBoxes =
      videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
    existingBoxes.forEach((box) => {
      box.style.display = "none";
    });

    // If no tracking data, just hide boxes
    if (!Array.isArray(trackingData) || trackingData.length === 0) {
      return;
    }

    // Update boxes for each face
    trackingData.forEach((face, index) => {
      if (!face.box) return;

      // Find or create box
      let boxElement = document.getElementById(`face-box-${index}`);
      if (!boxElement) {
        boxElement = document.createElement("div");
        boxElement.id = `face-box-${index}`;
        boxElement.className = "position-absolute";
        boxElement.style.border = "3px solid red";
        boxElement.style.zIndex = "9999";
        boxElement.style.pointerEvents = "none";

        // Add label element
        const labelElement = document.createElement("div");
        labelElement.className = "position-absolute px-2 py-1";
        labelElement.style.top = "-25px";
        labelElement.style.left = "0";
        labelElement.style.backgroundColor = "red";
        labelElement.style.color = "white";
        labelElement.style.fontSize = "12px";
        labelElement.style.fontWeight = "bold";
        labelElement.style.borderRadius = "4px";
        labelElement.id = `face-label-${index}`;

        boxElement.appendChild(labelElement);
        videoContainerRef.current.appendChild(boxElement);
      }

      // Position box
      const boxPos = calculateBoxPosition(face.box, videoElement);
      boxElement.style.left = `${boxPos.left}px`;
      boxElement.style.top = `${boxPos.top}px`;
      boxElement.style.width = `${boxPos.width}px`;
      boxElement.style.height = `${boxPos.height}px`;
      boxElement.style.display = "block";

      // Update label
      const labelElement = document.getElementById(`face-label-${index}`);
      if (labelElement) {
        labelElement.textContent = `${face.label || "Detecting..."} ${
          face.confidence ? `(${Math.round(face.confidence * 100)}%)` : ""
        }`;
      }
    });
  };

  return {
    videoContainerRef,
    boxRef,
    startSendingVideo,
    calculateBoxPosition,
    hideAllBoxes,
    updateBoundingBoxes,
  };
}
