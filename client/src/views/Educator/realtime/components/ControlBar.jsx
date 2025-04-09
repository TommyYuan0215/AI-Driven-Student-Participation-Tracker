import React from "react";
import { Button } from "react-bootstrap";

function ControlBar({
  sessionElapsedTime,
  trackingElapsedTime,
  formatElapsedTime,
  isCameraOn,
  isShareScreen,
  isTracking,
  handleCamera,
  handleShareScreen,
  handleTracking,
  handleEndMonitoringSession,
}) {
  return (
    <div
      className="g-0 border-top d-flex align-items-center"
      style={{ height: "7vh", backgroundColor: "#2A2A2A" }}
    >
      <div className="col-2 d-flex align-items-center ps-3">
        <span className="text-white rounded px-2 py-1 d-flex align-items-center justify-content-start fw-bold">
          <i className="bi bi-alarm me-2"></i>Elapsed:{" "}
          {formatElapsedTime(sessionElapsedTime)}
        </span>
      </div>
      <div className="col-8 d-flex align-items-center justify-content-center gap-3">
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
            className={`bi bi-${
              isTracking ? "stop-btn" : "person-bounding-box"
            }`}
          ></i>
          &nbsp;{isTracking ? "Stop Tracking" : "Start Tracking"}
        </Button>

        <Button variant="danger" onClick={handleEndMonitoringSession}>
          <i className="bi bi-door-open"></i> &nbsp;End Monitoring Session
        </Button>
      </div>
      <div className="col-2 d-flex align-items-center justify-content-end pe-3">
        <span className="text-white rounded px-2 py-1 d-flex align-items-center fw-bold">
          <i className="bi bi-clock me-2"></i>
          Tracking: {formatElapsedTime(trackingElapsedTime)}
        </span>
      </div>
    </div>
  );
}

export default ControlBar;
