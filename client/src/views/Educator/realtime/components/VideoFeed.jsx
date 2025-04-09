import React, { useEffect } from "react";

function VideoFeed({
  videoContainerRef,
  cameraRef,
  screenRef,
  isCameraOn,
  isShareScreen,
  isTracking,
  trackingData,
  updateBoundingBoxes, // Add this new prop
}) {
  // Update bounding boxes when tracking data or tracking state changes
  useEffect(() => {
    if (isTracking && Array.isArray(trackingData)) {
      updateBoundingBoxes(trackingData);
    } else if (!isTracking) {
      // Make sure all boxes are hidden when tracking is off
      const hideBoxes = () => {
        if (videoContainerRef.current) {
          const boxes =
            videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
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

      {/* The bounding boxes are now managed by the updateBoundingBoxes function */}
      {/* and are created/updated dynamically as DOM elements */}

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
  );
}

export default VideoFeed;
