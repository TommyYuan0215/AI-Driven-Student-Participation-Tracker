import React, { useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { socketRef, isConnected, setConnectionAttempts } = useSocket();

  const {
    isCameraOn,
    isShareScreen,
    cameraRef,
    screenRef,
    mediaStreamRef,
    handleCamera,
    handleShareScreen,
    stopScreenShare,
  } = useMediaStream();

  const {
    isTracking,
    sessionElapsedTime,
    trackingElapsedTime,
    trackingData,
    studentStats,
    handleTracking,
    handleEndMonitoringSession: endSession,
    formatElapsedTime,
    handleStopScreenShare,
  } = useTrackingSession(sessionId, socketRef, mediaStreamRef, stopScreenShare);

  const {
    videoContainerRef,
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

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "Are you sure you want to leave? Your session will be ended.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (isTracking) {
      setConnectionAttempts(0);
      if (!isConnected && socketRef.current) socketRef.current.connect();
      startSendingVideo();
    } else {
      hideAllBoxes();
    }
  }, [isTracking, isConnected]);

  useEffect(() => {
    if (isTracking && Array.isArray(trackingData)) {
      updateBoundingBoxes(trackingData);
    }
  }, [trackingData, isTracking]);

  const handleEndMonitoringSession = () => {
    endSession((path) => {
      if (location.pathname.includes(sessionId)) {
        setTimeout(() => navigate(path), 1000);
      }
    });
  };

  const handleCameraToggle = async () => {
    if (isCameraOn && isTracking) handleTracking();
    if (!isCameraOn && isShareScreen) await handleStopScreenShare();
    await handleCamera();
  };

  const handleShareScreenToggle = async () => {
    if (isShareScreen && isTracking) handleTracking();
    if (!isShareScreen && isCameraOn) await handleCameraToggle();
    await handleStopScreenShare();
    await handleShareScreen();
  };

  return (
    <Container fluid className="d-flex flex-column p-0 vh-100 overflow-hidden monitoring-container fade-in">
      <Row className="g-0 flex-grow-1 overflow-hidden">
        <Col xs={10} className="h-100 border-0 rounded-0 overflow-hidden">
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

        <Col xs={2} className="h-100 border-start border-secondary-subtle monitoring-sidebar">
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
        handleCamera={handleCameraToggle}
        handleShareScreen={handleShareScreenToggle}
        handleTracking={handleTracking}
        handleEndMonitoringSession={handleEndMonitoringSession}
      />
    </Container>
  );
}

export default RealTimeMonitoring;
