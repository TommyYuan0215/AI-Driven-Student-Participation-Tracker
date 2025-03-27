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
        console.log("Tracking update:", data);
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
          cameraRef.current.play();
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
          screenRef.current.play();
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
    if (!isTracking) return;
  
    hasStoppedTracking.current = false;
    toast.success("Tracking started");
    startSendingVideo();
  
    return () => {
      if (!hasStoppedTracking.current) {
        toast.info("Tracking stopped");
        hasStoppedTracking.current = true;
      }
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    };
  }, [isTracking]);

  // Handle Tracking Toggle
  const handleTracking = () => {
    if (!mediaStreamRef.current && !isTracking) {
      toast.error("No active video stream to track!");
      return;
    }
    setIsTracking((prev) => !prev);
  };

  // Send Video Frames to Backend
  const startSendingVideo = () => {
    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;

    if (!videoElement) {
        console.error("No video element found!");
        return;
    }

    if (videoElement.paused) {
        console.warn("Video is paused. Ensure it's playing before capturing.");
        return;
    }

    console.log("Starting video frame capture...");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    console.log(`Canvas initialized with size: ${canvas.width}x${canvas.height}`);

    trackingIntervalRef.current = setInterval(() => {
        if (!socketRef.current) {
            console.error("Socket not available!");
            return;
        }

        if (!isTracking) {
            console.warn("Tracking is OFF. Stopping video frame capture.");
            clearInterval(trackingIntervalRef.current);
            return;
        }

        try {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/jpeg", 0.8);

            // Log only the first 50 characters to avoid flooding the console
            console.log("Sending frame:", imageData.substring(0, 50), "...");

            socketRef.current.emit("video_frame", { frame: imageData });
        } catch (error) {
            console.error("Error capturing video frame:", error);
        }
    }, 100);
  };

  const updateBoundingBox = () => {
    if (!trackingData?.box || !videoContainerRef.current) return;
  
    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    if (!videoElement) return;
  
    const containerRect = videoContainerRef.current.getBoundingClientRect();
    const videoRect = videoElement.getBoundingClientRect();
  
    const [x, y, width, height] = trackingData.box;
    const originalVideoWidth = videoElement.videoWidth;
    const originalVideoHeight = videoElement.videoHeight;
  
    if (!originalVideoWidth || !originalVideoHeight) return;
  
    const scaleX = videoRect.width / originalVideoWidth;
    const scaleY = videoRect.height / originalVideoHeight;
  
    const newBoxPosition = {
      left: videoRect.left + x * scaleX - containerRect.left,
      top: videoRect.top + y * scaleY - containerRect.top,
      width: width * scaleX,
      height: height * scaleY,
    };
  
    if (boxRef.current) {
      boxRef.current.style.left = `${newBoxPosition.left}px`;
      boxRef.current.style.top = `${newBoxPosition.top}px`;
      boxRef.current.style.width = `${newBoxPosition.width}px`;
      boxRef.current.style.height = `${newBoxPosition.height}px`;
    }
  
    requestAnimationFrame(updateBoundingBox); // Continuous update for smooth tracking
  };

  useEffect(() => {
    requestAnimationFrame(updateBoundingBox);
  }, [trackingData]);

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
            {isTracking && trackingData?.confidence > 0.5 && (
              <div
                ref={boxRef}
                className="position-absolute"
                style={{
                  border: "3px solid red",
                  zIndex: 100,
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
                  {trackingData?.label} ({Math.round(trackingData?.confidence * 100 || 0)}%)
                </div>
              </div>
            )}

            {!isCameraOn && !isShareScreen && (
              <div className="text-center text-mute">
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
              className={`bi bi-${isTracking ? "stop-fill" : "play-fill"}`}
            ></i>
            &nbsp;{isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default RealTimeMonitoring;
