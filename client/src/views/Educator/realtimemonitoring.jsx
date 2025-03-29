import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

// WebSocket URL (Update if needed)
const SOCKET_URL = "http://localhost:5000";

function RealTimeMonitoring() {
  const [isTracking, setIsTracking] = useState(false);
  const [isShareScreen, setIsShareScreen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [trackingData, setTrackingData] = useState({});
  const [studentStats, setStudentStats] = useState({});

  const cameraRef = useRef(null);
  const screenRef = useRef(null);
  const videoContainerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const socketRef = useRef(null);
  const boxRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const hasStoppedTracking = useRef(false);
  const animationFrameRef = useRef(null);

  // Initialize WebSocket Connection while start tracking
  useEffect(() => {
    if (isTracking) {
      // Connect to the WebSocket server only if tracking is enabled
      socketRef.current = io(SOCKET_URL);
  
      socketRef.current.on("connect", () => {
        console.log("Connected to WebSocket");
        toast.success("Connected to tracking server");
      });
  
      socketRef.current.on("tracking_update", (data) => {
        console.log("Tracking update received:", data);
        setTrackingData(data);
  
        // Update statistics
        setStudentStats((prev) => ({
          ...prev,
          [data.label]: (prev[data.label] || 0) + 1,
        }));
      });
  
      socketRef.current.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        toast.error("Failed to connect to tracking server");
      });
  
      socketRef.current.on("disconnect", () => {
        console.log("WebSocket Disconnected");
        toast.warn("Disconnected from tracking server");
      });
  
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } else {
      // If tracking is disabled, make sure to disconnect
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("Tracking stopped, WebSocket disconnected");
      }
    }
  }, [isTracking]);

  // Handle Camera Start/Stop
  const handleCamera = async () => {
    try {
      if (isCameraOn) {
        stopMediaStream();
        setIsCameraOn(false);
        toast.info("Camera turned off");
      } else {
        if (isShareScreen) stopScreenShare();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        mediaStreamRef.current = stream;

        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
          await cameraRef.current.play().catch(err => console.error("Play error:", err));
        }

        setIsCameraOn(true);
        toast.success("Camera turned on");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera");
    }
  };

  // Handle Screen Share Start/Stop
  const handleShareScreen = async () => {
    try {
      if (!isShareScreen) {
        if (isCameraOn) stopMediaStream();

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        mediaStreamRef.current = stream;

        if (screenRef.current) {
          screenRef.current.srcObject = stream;
          await screenRef.current.play().catch(err => console.error("Play error:", err));
        }

        stream.getVideoTracks()[0].onended = () => stopScreenShare();
        setIsShareScreen(true);
        toast.success("Screen sharing started");
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
      toast.error("Failed to start screen sharing");
    }
  };

  // Stop Media Stream
  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (cameraRef.current) cameraRef.current.srcObject = null;
    if (screenRef.current) screenRef.current.srcObject = null;

    // Also stop tracking if it's running
    if (isTracking) {
      handleTracking();
    }
  };

  // Stop Screen Sharing
  const stopScreenShare = () => {
    stopMediaStream();
    setIsShareScreen(false);
    toast.info("Screen sharing stopped");
  };

  // Tracking Handlers
  useEffect(() => {
    if (!isTracking) {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (!hasStoppedTracking.current) {
        toast.info("Tracking stopped");
        hasStoppedTracking.current = true;
      }
      // Hide the bounding box when tracking stops
      if (boxRef.current) {
        boxRef.current.style.display = 'none';
      }
      return;
    }
  
    hasStoppedTracking.current = false;
    toast.success("Tracking started");
    startSendingVideo();
    
    // Start the bounding box update animation
    updateBoundingBox();
  
    return () => {
      if (!hasStoppedTracking.current) {
        toast.info("Tracking stopped");
        hasStoppedTracking.current = true;
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isTracking]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopMediaStream();
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Handle Tracking Toggle
  const handleTracking = () => {
    if (!mediaStreamRef.current && !isTracking) {
      toast.error("No active video stream to track!");
      return;
    }
    setIsTracking((prev) => !prev);
  };

  // Log tracking data changes for debugging
  useEffect(() => {
    console.log("TrackingData updated:", trackingData);
  }, [trackingData]);

  // Send Video Frames to Backend
  const startSendingVideo = () => {
    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;

    if (!videoElement) {
      console.error("No video element found!");
      return;
    }

    // Wait for video to have dimensions
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
      videoElement.play().catch(e => console.error("Couldn't play video:", e));
    }

    console.log("Starting video frame capture...");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Set canvas dimensions to match video dimensions
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    console.log(`Canvas initialized with size: ${canvas.width}x${canvas.height}`);

    // Clear any existing interval
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    trackingIntervalRef.current = setInterval(() => {
      if (!socketRef.current || !socketRef.current.connected) {
        console.error("Socket not available or not connected!");
        return;
      }

      if (!isTracking) {
        console.warn("Tracking is OFF. Stopping video frame capture.");
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
        return;
      }

      try {
        // Check if video dimensions have changed
        if (canvas.width !== videoElement.videoWidth || 
            canvas.height !== videoElement.videoHeight) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
        }
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.7); // Reduced quality for better performance

        // Log only the first 50 characters to avoid flooding the console
        console.log("Sending frame:", imageData.substring(0, 50), "...");

        socketRef.current.emit("video_frame", { 
          frame: imageData,
          dimensions: {
            width: canvas.width,
            height: canvas.height
          }
        });
      } catch (error) {
        console.error("Error capturing video frame:", error);
      }
    }, 200); // Reduced frequency to 5 frames per second for better performance
  };

  // This function updates the position of the bounding box based on tracking data
  const updateBoundingBox = () => {
    if (!isTracking) return;
    
    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    if (!videoElement || !videoContainerRef.current || !boxRef.current) return;
    
    // Debug log to see if this function is being called
    console.log("Updating bounding box...");
    
    // If we have tracking data with a box property
    if (trackingData && trackingData.box) {
      console.log("Using tracking data box:", trackingData.box);
      
      // Get the current video dimensions
      const videoWidth = videoElement.videoWidth || 640;  // Fallback to common sizes
      const videoHeight = videoElement.videoHeight || 480;
      
      // Get the bounding box from tracking data
      const [x, y, width, height] = trackingData.box;
      
      // Get the display dimensions
      const videoRect = videoElement.getBoundingClientRect();
      const containerRect = videoContainerRef.current.getBoundingClientRect();
      
      console.log("Video element size:", videoRect.width, "x", videoRect.height);
      console.log("Original video size:", videoWidth, "x", videoHeight);
      
      // Calculate the scaling factors based on object-fit: contain
      const scaleX = videoRect.width / videoWidth;
      const scaleY = videoRect.height / videoHeight;
      const scale = Math.min(scaleX, scaleY);
      
      // Calculate offsets for centering
      const offsetX = (videoRect.width - videoWidth * scale) / 2;
      const offsetY = (videoRect.height - videoHeight * scale) / 2;
      
      // Calculate the position of the bounding box in the displayed video
      const boxLeft = videoRect.left + (x * scale) + offsetX - containerRect.left;
      const boxTop = videoRect.top + (y * scale) + offsetY - containerRect.top;
      const boxWidth = width * scale;
      const boxHeight = height * scale;
      
      console.log("Calculated box position:", 
        { left: boxLeft, top: boxTop, width: boxWidth, height: boxHeight });
      
      // Update the bounding box position with fixed values (debugging step)
      boxRef.current.style.position = 'absolute';
      boxRef.current.style.left = `${boxLeft}px`;
      boxRef.current.style.top = `${boxTop}px`;
      boxRef.current.style.width = `${boxWidth}px`;
      boxRef.current.style.height = `${boxHeight}px`;
      boxRef.current.style.display = 'block';
      boxRef.current.style.border = '3px solid red';
      boxRef.current.style.zIndex = '9999';
    } else {
      console.log("No valid tracking data box available");
      // Show a default box for debugging purposes
      if (isTracking) {
        boxRef.current.style.position = 'absolute';
        boxRef.current.style.left = '25%';
        boxRef.current.style.top = '25%';
        boxRef.current.style.width = '100px';
        boxRef.current.style.height = '100px';
        boxRef.current.style.display = 'block';
        boxRef.current.style.border = '3px solid yellow'; // Different color to indicate default box
        boxRef.current.style.zIndex = '9999';
      } else {
        boxRef.current.style.display = 'none';
      }
    }
    
    // Continue the animation loop
    animationFrameRef.current = requestAnimationFrame(updateBoundingBox);
  };

  // Handle window resize for box position updates
  useEffect(() => {
    const handleResize = () => {
      console.log("Window resize detected");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      updateBoundingBox();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update box position whenever tracking data changes
  useEffect(() => {
    console.log("Tracking data changed, updating box");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updateBoundingBox();
  }, [trackingData, isCameraOn, isShareScreen]);

  return (
    <Container fluid className="d-flex flex-column p-0 vh-85">
      <Row className="g-0 flex-grow-1">
        <Col xs={10} className="h-100 border-0 rounded-0">
          <div
            ref={videoContainerRef}
            className="camera-container h-100 d-flex align-items-center justify-content-center border rounded bg-light position-relative"
            style={{ minHeight: "85vh", backgroundColor: "#000" }}
          >
            <video
              ref={screenRef}
              className="position-absolute w-100 h-100"
              autoPlay
              playsInline
              muted
              style={{
                objectFit: "contain",
                visibility: isShareScreen ? "visible" : "hidden",
              }}
            />
            <video
              ref={cameraRef}
              className="position-absolute w-100 h-100"
              autoPlay
              playsInline
              muted
              style={{
                objectFit: "contain",
                visibility: isCameraOn ? "visible" : "hidden",
                backgroundColor: "#000000",
              }}
            />

            {/* Emotion Detection Bounding Box */}
            <div
              ref={boxRef}
              className="position-absolute"
              style={{
                border: "3px solid red",
                zIndex: 9999,
                pointerEvents: "none", // Prevents blocking interactions
              }}
            >
              {/* Emotion Label */}
              <div
                className="position-absolute px-2 py-1"
                style={{
                  top: "-25px",
                  left: "0",
                  backgroundColor: "red",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  borderRadius: "4px",
                }}
              >
                {trackingData?.label || "Detecting..."} 
                {trackingData?.confidence ? `(${Math.round(trackingData.confidence * 100)}%)` : ""}
              </div>
            </div>

            {!isCameraOn && !isShareScreen && (
              <div className="text-center text-muted">
                <span className="d-flex justify-content-center align-items-center">
                  <i className="bi bi-cast fs-1"></i>
                  &emsp;
                  <i className="bi bi-camera fs-1"></i>
                </span>
                <p className="mt-2">
                  Click 'Start Share Screen' or 'Start Camera' to begin
                </p>
              </div>
            )}
          </div>
        </Col>

        <Col xs={2} className="vh-85" style={{ backgroundColor: "#2A2A2A" }}>
          <Card
            className="h-100 border-0"
            style={{ backgroundColor: "#2A2A2A" }}
          >
            <Card.Body className="p-3 text-white">
              <Card.Title className="text-center">
                Emotion Statistics
              </Card.Title>

              {Object.keys(studentStats).length > 0 ? (
                <div className="mt-3">
                  {Object.entries(studentStats).map(([emotion, count]) => (
                    <div
                      key={emotion}
                      className="d-flex justify-content-between my-2"
                    >
                      <span>{emotion}:</span>
                      <span className="badge bg-primary">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Card.Text className="text-muted mt-3">
                  Start tracking to see statistics
                </Card.Text>
              )}

              {isTracking && (
                <div className="mt-4 p-2 bg-success text-center rounded">
                  Tracking Active
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row
        className="g-0 border-top"
        style={{ height: "7vh", backgroundColor: "#2A2A2A" }}
      >
        <Col
          xs={12}
          className="d-flex align-items-center justify-content-center gap-3"
        >
          <Button
            variant={isCameraOn ? "danger" : "primary"}
            className="px-3"
            onClick={handleCamera}
          >
            <i className={`bi bi-${isCameraOn ? "stop-btn" : "camera"}`}></i>{" "}
            &nbsp;
            {isCameraOn ? "Stop Camera" : "Start Camera"}
          </Button>

          <Button
            variant={isShareScreen ? "danger" : "primary"}
            className="px-3"
            onClick={handleShareScreen}
          >
            <i className={`bi bi-${isShareScreen ? "stop-btn" : "cast"}`}></i>{" "}
            &nbsp;
            {isShareScreen ? "Stop Share Screen" : "Start Share Screen"}
          </Button>

          <Button
            variant={isTracking ? "danger" : "success"}
            disabled={!isCameraOn && !isShareScreen}
            className="px-3"
            onClick={handleTracking}
          >
            <i
              className={`bi bi-${isTracking ? "stop-btn" : "person-bounding-box"}`}
            ></i>
            &nbsp;{isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default RealTimeMonitoring;