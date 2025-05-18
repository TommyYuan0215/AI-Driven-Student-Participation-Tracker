import React, { useEffect } from "react";

function VideoFeed({
  videoContainerRef,
  cameraRef,
  screenRef,
  isCameraOn,
  isShareScreen,
  isTracking,
  trackingData,
  updateBoundingBoxes,
}) {
  // Update bounding boxes when tracking data or tracking state changes
  useEffect(() => {
    if (isTracking && Array.isArray(trackingData)) {
      updateBoundingBoxes(trackingData);
    } else if (!isTracking) {
      // Make sure all boxes are hidden when tracking is off
      const hideBoxes = () => {
        if (videoContainerRef.current) {
          const boxes = videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
          boxes.forEach((box) => {
            box.style.display = "none";
          });
        }
      };
      hideBoxes();
    }
  }, [isTracking, trackingData, updateBoundingBoxes]);

  return (
    <div
      ref={videoContainerRef}
      className="video-container position-relative d-flex align-items-center justify-content-center"
      style={{ 
        minHeight: "85vh",
        backgroundColor: "#000",
        overflow: "hidden"
      }}
    >
      {/* Camera Video */}
      <video
        ref={cameraRef}
        className="position-absolute"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: isCameraOn ? "block" : "none"
        }}
        autoPlay
        playsInline
        muted
      />

      {/* Screen Share Video */}
      <video
        ref={screenRef}
        className="position-absolute"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: isShareScreen ? "block" : "none"
        }}
        autoPlay
        playsInline
        muted
      />

      {/* No Video Message */}
      {!isCameraOn && !isShareScreen && (
        <div className="text-center text-white">
          <div className="d-flex justify-content-center align-items-center mb-3">
            <i className="bi bi-cast fs-1 me-3"></i>
            <i className="bi bi-camera fs-1"></i>
          </div>
          <p className="mb-0">
            Click 'Start Share Screen' or 'Start Camera' to begin
          </p>
        </div>
      )}
    </div>
  );
}

export default VideoFeed;
