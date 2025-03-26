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
  const [trackingData, setTrackingData] = useState(null);
  const [studentStats, setStudentStats] = useState({});

  const cameraRef = useRef(null);
  const screenRef = useRef(null);
  const videoContainerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const socketRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  // Initialize WebSocket Connection
  useEffect(() => {
    // Connect to the WebSocket server
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket");
      toast.success("Connected to tracking server");
    });

    socketRef.current.on("tracking_update", (data) => {
      console.log("Tracking update:", data);
      setTrackingData(data);

      // Update statistics (for demonstration)
      setStudentStats((prev) => {
        const emotion = data.label;
        return {
          ...prev,
          [emotion]: (prev[emotion] || 0) + 1,
        };
      });
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
  }, []);

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

  // Effect to handle tracking state changes
  useEffect(() => {
    if (isTracking) {
      toast.success("Tracking started");
      startSendingVideo();
    } else {
      toast.info("Tracking stopped");
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    }
  }, [isTracking]);

  // Handle Tracking Toggle
  const handleTracking = () => {
    if (!mediaStreamRef.current && !isTracking) {
      toast.error("No active video stream to track!");
      return;
    }
    setIsTracking((prev) => !prev);
  };

  // Calculate bounding box position relative to video display
  const calculateBoundingBoxPosition = () => {
    if (!trackingData?.box || !videoContainerRef.current) return null;

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    if (!videoElement) return null;

    const containerRect = videoContainerRef.current.getBoundingClientRect();
    const videoRect = videoElement.getBoundingClientRect();

    // Get the actual display dimensions of the video within the container
    const displayWidth = videoRect.width;
    const displayHeight = videoRect.height;

    // Original box coordinates from backend
    const [x, y, width, height] = trackingData.box;

    // Scale factors (assuming backend processed a 224x224 image)
    const scaleX = displayWidth / 224;
    const scaleY = displayHeight / 224;

    return {
      left: x * scaleX,
      top: y * scaleY,
      width: width * scaleX,
      height: height * scaleY,
    };
  };

  // Send Video Frames to Backend
  const startSendingVideo = () => {
    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;

    if (!videoElement) {
      console.error("No video element found!");
      return;
    }

    console.log("Media Stream Tracks:", mediaStreamRef.current?.getTracks());
    console.log("Stream Active:", mediaStreamRef.current?.active);

    // Ensure video metadata is loaded
    if (videoElement.readyState < 2) {  // `2` means "HAVE_CURRENT_DATA"
      console.warn("Video not ready yet, waiting for metadata...");
      videoElement.addEventListener("loadedmetadata", startSendingVideo, { once: true });
      return;
    }

    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      console.error("Video not ready yet. Width/Height not set.");
      return;
    }

    if (videoElement.paused) {
      console.error("Video is paused. Ensure it's playing before capturing.");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Match canvas size to the video feed
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    trackingIntervalRef.current = setInterval(() => {

      if (!socketRef.current) {
        console.error("Socket not available!");
        return;
      }

      if (!isTracking) {
        console.error("Tracking is OFF!");
        return;
      }

      try {
        // Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert to Base64
        const imageData = canvas.toDataURL("image/jpeg", 0.8);

        // Debugging: Log first 50 characters of the Base64 string
        console.log("Sending frame:", imageData.substring(0, 50));

        // Send to backend
        socketRef.current.emit("video_frame", { frame: imageData });

      } catch (error) {
        console.error("Error capturing video frame:", error);
      }
    }, 100);
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopMediaStream();
      clearInterval(trackingIntervalRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Calculate box position
  const boxPosition = trackingData?.box ? calculateBoundingBoxPosition() : null;

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
            {boxPosition && isTracking && trackingData?.confidence > 0.5 && (
              <div
                className="position-relative"
                style={{
                  position: "absolute",
                  border: "3px solid red",
                  top: boxPosition.top,
                  left: boxPosition.left,
                  width: boxPosition.width,
                  height: boxPosition.height,
                  zIndex: 100,
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
                  {trackingData.label} (
                  {Math.round(trackingData.confidence * 100)}%)
                </div>
              </div>
            )}

            {/* Tracking Data Display */}
            {trackingData && isTracking && (
              <div
                className="position-absolute text-white bg-dark p-2 rounded"
                style={{ top: 20, left: 20, opacity: 0.8 }}
              >
                <p className="mb-1">
                  <strong>Emotion:</strong> {trackingData.label}
                </p>
                <p className="mb-0">
                  <strong>Confidence:</strong>{" "}
                  {(trackingData.confidence * 100).toFixed(2)}%
                </p>
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
