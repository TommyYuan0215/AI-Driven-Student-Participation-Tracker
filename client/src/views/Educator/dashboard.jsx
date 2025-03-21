import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

// WebSocket URL that been used to connect to backend
const SOCKET_URL = "http://localhost:5000";

function EducatorDashboard() {
  const [isTracking, setIsTracking] = useState(false);
  const [isShareScreen, setIsShareScreen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [socket, setSocket] = useState(null);

  const cameraRef = useRef(null);
  const screenRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Handle Camera Start/Stop
  const handleCamera = async () => {
    try {
      if (isCameraOn) {
        stopMediaStream();
        setIsCameraOn(false);
        toast.info("Camera turned off");
      } else {
        if (isShareScreen) stopScreenShare();

        const constraints = { video: true, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;

        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
          cameraRef.current.onloadedmetadata = () => cameraRef.current.play();
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
          video: { cursor: "always", displaySurface: "monitor" },
          audio: false,
        });

        mediaStreamRef.current = stream;
        if (screenRef.current) {
          screenRef.current.srcObject = stream;
          screenRef.current.onloadedmetadata = () => screenRef.current.play();
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
  };

  // Stop Screen Sharing
  const stopScreenShare = () => {
    stopMediaStream();
    setIsShareScreen(false);
    toast.info("Screen sharing stopped");
  };

  // Handle Tracking Toggle
  const handleTracking = () => {
    if (!isTracking) {
      if (!mediaStreamRef.current) {
        toast.error("No active video stream to track!");
        return;
      }

      const newSocket = io(SOCKET_URL);
      newSocket.on("connect", () => console.log("Connected to WebSocket"));
      newSocket.on("tracking_update", (data) =>
        console.log("Tracking update:", data)
      );
      newSocket.on("disconnect", () => console.log("WebSocket Disconnected"));

      setSocket(newSocket);
      toast.success("Tracking started");

      // Capture video frames and send to backend
      startSendingVideo(newSocket);
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      toast.info("Tracking stopped");
    }

    setIsTracking((prev) => !prev);
  };

  // Send Streaming Video (Camera or Share Screen Feed to backend)
  const startSendingVideo = (socket) => {
    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;

    if (!videoElement) {
      console.error("No active video element found!");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const sendFrame = () => {
      if (!socket || !videoElement || !isTracking) return;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg"); // Convert to base64

      socket.emit("video_frame", { frame: imageData });

      requestAnimationFrame(sendFrame);
    };

    sendFrame();
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopMediaStream();
    };
  }, []);

  // Stop camera when user closes tab or refreshes
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopMediaStream();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <Container fluid className="d-flex flex-column p-0 vh-85">
      <Row className="g-0 flex-grow-1">
        <Col xs={10} className="h-100 border-0 rounded-0">
          <div
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
                objectFit: "fill",
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
              <Card.Title className="text-center">Statistical List</Card.Title>
              <Card.Text>
                Detected students and their participation metrics will appear
                here.
              </Card.Text>
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

export default EducatorDashboard;
