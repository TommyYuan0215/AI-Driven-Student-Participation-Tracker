// File: RealTimeMonitoring.jsx
import React, { useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useSession from "../../../hooks/useSession";

// Import custom components
import VideoFeed from "./components/VideoFeed";
import ControlBar from "./components/ControlBar";
import EmotionStatistics from "./components/EmotionCharts";

// Import custom hooks
import { useMediaStream } from "./hooks/useMediaStream";
import { useSocket } from "./hooks/useSocket";
import { useVideoProcessing } from "./hooks/useVideoPreprocessing";
import { useTrackingSession } from "./hooks/useTrackingSession";

function RealTimeMonitoring() {
  // Get session ID from URL and navigation
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Session user data
  const { userData } = useSession(navigate);
  const currentUserID = userData?.userID;

  // Initialize hooks - order matters!
  const { socketRef, isConnected, connectionAttempts, setConnectionAttempts } =
    useSocket();

  const {
    isCameraOn,
    isShareScreen,
    cameraRef,
    screenRef,
    mediaStreamRef,
    handleCamera,
    handleShareScreen,
    stopMediaStream,
    stopScreenShare,
  } = useMediaStream();

  // Initialize tracking session first to get isTracking
  const {
    isTracking,
    sessionElapsedTime,
    trackingElapsedTime,
    trackingData,
    studentStats,
    handleTracking,
    handleEndMonitoringSession: endSession,
    formatElapsedTime,
  } = useTrackingSession(sessionId, currentUserID, socketRef, mediaStreamRef);

  // Then use isTracking in video processing
  const {
    videoContainerRef,
    boxRef,
    startSendingVideo,
    updateBoundingBoxes,
    hideAllBoxes,
  } = useVideoProcessing(
    isTracking,
    isCameraOn,
    socketRef,
    cameraRef,
    screenRef
  );

  // Prevent page refresh
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave this page? Your session will be ended.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Start sending video when tracking starts
  useEffect(() => {
    if (isTracking) {
      console.log("Starting video tracking...");

      // Reset connection attempts counter when tracking starts
      setConnectionAttempts(0);

      // Make sure we're connected to the socket
      if (!isConnected && socketRef.current) {
        socketRef.current.connect();
      }

      // Start sending video frames
      startSendingVideo();
    } else {
      console.log("Tracking stopped, hiding boxes");
      // Ensure boxes are hidden when tracking stops
      hideAllBoxes();
    }
  }, [isTracking, isConnected]);

  // Update boxes when tracking data changes
  useEffect(() => {
    if (isTracking && Array.isArray(trackingData)) {
      updateBoundingBoxes(trackingData);
    }
  }, [trackingData, isTracking]);

  // Handle tracking toggle with validation
  const handleTrackingToggle = () => {
    if (!isShareScreen && !isCameraOn && !isTracking) {
      return handleTracking(); // This will show the toast error
    }

    handleTracking();
  };

  // Wrapper for end monitoring session
  const handleEndMonitoringSession = () => {
    endSession((path) => {
      if (location.pathname === `/educator/tracking/${sessionId}`) {
        setTimeout(() => {
          navigate(path);
        }, 1000);
      }
    });
  };

  return (
    <Container fluid className="d-flex flex-column p-0 vh-85">
      <Row className="g-0 flex-grow-1">
        <Col xs={10} className="h-100 border-0 rounded-0">
          <VideoFeed
            videoContainerRef={videoContainerRef}
            cameraRef={cameraRef}
            screenRef={screenRef}
            isCameraOn={isCameraOn}
            isShareScreen={isShareScreen}
            isTracking={isTracking}
            trackingData={trackingData}
            updateBoundingBoxes={updateBoundingBoxes}
          />
        </Col>

        <Col xs={2} className="vh-85" style={{ backgroundColor: "#2A2A2A" }}>
          <EmotionStatistics
            studentStats={studentStats}
            isTracking={isTracking}
          />
        </Col>
      </Row>

      <ControlBar
        sessionElapsedTime={sessionElapsedTime}
        trackingElapsedTime={trackingElapsedTime}
        formatElapsedTime={formatElapsedTime}
        isCameraOn={isCameraOn}
        isShareScreen={isShareScreen}
        isTracking={isTracking}
        handleCamera={handleCamera}
        handleShareScreen={handleShareScreen}
        handleTracking={handleTrackingToggle}
        handleEndMonitoringSession={handleEndMonitoringSession}
      />
    </Container>
  );
}

export default RealTimeMonitoring;
