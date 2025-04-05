import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import EmotionStatistics from "../../components/customized/EmotionCharts";
import { useParams } from "react-router-dom";
import useSession from "../../utils/sessionUtils";
import axios from "../../utils/axiosUtils";

// WebSocket URL (Update if needed)
const SOCKET_URL = "http://localhost:5000";

function RealTimeMonitoring() {
  // Use useParams to get sessionID from the url
  const { sessionId } = useParams();

  // Timer to track elapsed time based on sessionStart
  const [sessionElapsedTime, setSessionElapsedTime] = useState(0);
  const [trackingElapsedTime, setTrackingElapsedTime] = useState(0);

  // Add state variables for emotion tracking
  const [interestedCount, setInterestedCount] = useState(0);
  const [boredCount, setBoredCount] = useState(0);
  const [lackingFocusCount, setLackingFocusCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionElapsedTime((prevTime) => prevTime + 1); // Increment overall session time every second
    }, 1000);

    return () => clearInterval(interval); // Clean up on component unmount
  }, []);

  const formatElapsedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let formattedTime = "";
    if (hrs > 0) formattedTime += `${hrs} hr `;
    if (mins > 0) formattedTime += `${mins} min `;
    if (secs > 0 || formattedTime === "") formattedTime += `${secs} seconds`;

    return formattedTime.trim();
  };

  // useEffect hook to prevent refresh page
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave this page? Your session will be ended.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Function to navigate to other page
  const location = useLocation();
  const navigate = useNavigate();

  const { userData } = useSession(navigate);
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
  const currentUserID = userData?.userID;

  // Initialize WebSocket Connection while start tracking
  useEffect(() => {
    if (isTracking) {
      // Connect to WebSocket server
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on("connect", () => {
        toast.success("Connected to tracking server");
      });

      socketRef.current.on("tracking_update", (data) => {
        // Ensure `data.faces` exists and is an array
        const faces = data?.faces || [];

        setTrackingData(faces);

        // Compute new statistics based on detected faces
        const newStats = faces.reduce((stats, face) => {
          if (face.label) {
            stats[face.label] = (stats[face.label] || 0) + 1;
          }
          return stats;
        }, {});

        // Merge with previous stats
        setStudentStats((prev) => ({
          ...prev,
          ...newStats,
        }));
      });

      socketRef.current.on("connect_error", () => {
        toast.error("Failed to connect to tracking server");
      });

      socketRef.current.on("disconnect", () => {
        toast.warn("Disconnected from tracking server");
      });

      // Cleanup function: Disconnect when unmounting or when tracking stops
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null; // Ensure it's reset
        }
      };
    } else {
      // If tracking is disabled, disconnect WebSocket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null; // Ensure cleanup
      }
    }
  }, [isTracking]);

  // Update emotion counts whenever tracking data changes
  useEffect(() => {
    if (Array.isArray(trackingData) && trackingData.length > 0) {
      // Reset counts for this frame
      let interested = 0;
      let bored = 0;
      let lackingFocus = 0;

      // Count emotions in the current frame
      trackingData.forEach((face) => {
        if (face.label) {
          // Convert to lowercase for case-insensitive comparison
          const emotion = face.label.toLowerCase();
          if (emotion === "interested") {
            interested++;
          } else if (emotion === "bored") {
            bored++;
          } else if (emotion === "lacking_focus") {
            lackingFocus++;
          }
        }
      });

      // Update the state with new counts
      setInterestedCount(interested);
      setBoredCount(bored);
      setLackingFocusCount(lackingFocus);

      console.log(
        "Interested Count (before sending):",
        interestedCount,
        typeof interestedCount
      );
      console.log(
        "Bored Count (before sending):",
        boredCount,
        typeof boredCount
      );
      console.log(
        "Lacking Focus Count (before sending):",
        lackingFocusCount,
        typeof lackingFocusCount
      );
    }
  }, [trackingData]);

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
          await cameraRef.current
            .play()
            .catch((err) => console.error("Play error:", err));
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
          await screenRef.current
            .play()
            .catch((err) => console.error("Play error:", err));
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

      // Hide the main bounding box when tracking stops
      if (boxRef.current) {
        boxRef.current.style.display = "none";
      }

      // Hide all face boxes
      if (videoContainerRef.current) {
        const existingBoxes =
          videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
        existingBoxes.forEach((box) => {
          box.style.display = "none";
        });
      }

      return;
    }

    // Reset tracking state
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

  // Handle tracking time and send data every 60 seconds
  useEffect(() => {
    // Only run this effect when isTracking changes
    if (isTracking) {
      // Reset tracking time when tracking starts
      setTrackingElapsedTime(0);

      // Create interval to update tracking time
      trackingIntervalRef.current = setInterval(() => {
        setTrackingElapsedTime((prevTime) => {
          // Use the updated value right away
          const newTime = prevTime + 1;

          // Check if we need to send data (every 60 seconds)
          if (newTime % 60 === 0) {
            sendTrackingData();
          }

          return newTime;
        });
      }, 1000);
    } else {
      // Clear interval when tracking stops
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    }

    // Clean up on unmount or when isTracking changes
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    };
  }, [isTracking]);

  // Insert data into the database - Updated with emotion counts
  const sendTrackingData = async () => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
      const payload = {
        sessionID: sessionId,
        userID: currentUserID,
        timestamp: timestamp,
        interestedCount: interestedCount,
        boredCount: boredCount,
        lackingFocusCount: lackingFocusCount,
      };

      await axios.post("/tracking_session/tracking_emotion", payload);
      toast.success("Tracking data recorded!");
    } catch (error) {
      toast.error("Failed to send tracking data.");
      console.error(error);
    }
  };

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
      videoElement
        .play()
        .catch((e) => console.error("Couldn't play video:", e));
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match video dimensions
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

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
        if (
          canvas.width !== videoElement.videoWidth ||
          canvas.height !== videoElement.videoHeight
        ) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
        }

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.7); // Reduced quality for better performance

        socketRef.current.emit("video_frame", {
          frame: imageData,
          dimensions: {
            width: canvas.width,
            height: canvas.height,
          },
          detectMultiple: true,
        });
      } catch (error) {
        console.error("Error capturing video frame:", error);
      }
    }, 200);
  };

  // This function updates the position of the bounding box based on tracking data
  const calculateBoxPosition = (box, videoElement) => {
    if (!box || !videoElement) return { left: 0, top: 0, width: 0, height: 0 };

    const [x, y, width, height] = box;
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

  // This function updates the positions of all bounding boxes based on tracking data
  const updateBoundingBox = () => {
    if (!isTracking) {
      // Hide all boxes when tracking is off
      if (boxRef.current) {
        boxRef.current.style.display = "none";
      }

      if (videoContainerRef.current) {
        const existingBoxes =
          videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
        existingBoxes.forEach((box) => {
          box.style.display = "none";
        });
      }

      // No need to continue animation loop when tracking is off
      return;
    }

    const videoElement = isCameraOn ? cameraRef.current : screenRef.current;
    if (!videoElement || !videoContainerRef.current) return;

    // Check if trackingData is an array (multiple faces)
    if (Array.isArray(trackingData) && trackingData.length > 0) {
      // Update each face's box using DOM manipulation
      trackingData.forEach((face, index) => {
        // Find or create a box element for this face
        let boxElement = document.getElementById(`face-box-${index}`);
        if (!boxElement) {
          boxElement = document.createElement("div");
          boxElement.id = `face-box-${index}`;
          boxElement.className = "position-absolute";
          boxElement.style.border = "3px solid red";
          boxElement.style.zIndex = "9999";
          boxElement.style.pointerEvents = "none";

          // Add a label element for this face
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

        if (face.box) {
          // Get the bounding box from tracking data
          const [x, y, width, height] = face.box;

          // Get the current video dimensions
          const videoWidth = videoElement.videoWidth || 640;
          const videoHeight = videoElement.videoHeight || 480;

          // Get the display dimensions
          const videoRect = videoElement.getBoundingClientRect();
          const containerRect =
            videoContainerRef.current.getBoundingClientRect();

          // Calculate the scaling factors based on object-fit: contain
          const scaleX = videoRect.width / videoWidth;
          const scaleY = videoRect.height / videoHeight;
          const scale = Math.min(scaleX, scaleY);

          // Calculate offsets for centering
          const offsetX = (videoRect.width - videoWidth * scale) / 2;
          const offsetY = (videoRect.height - videoHeight * scale) / 2;

          // Calculate the position of the bounding box in the displayed video
          const boxLeft =
            videoRect.left + x * scale + offsetX - containerRect.left;
          const boxTop =
            videoRect.top + y * scale + offsetY - containerRect.top;
          const boxWidth = width * scale;
          const boxHeight = height * scale;

          // Update the bounding box position
          boxElement.style.left = `${boxLeft}px`;
          boxElement.style.top = `${boxTop}px`;
          boxElement.style.width = `${boxWidth}px`;
          boxElement.style.height = `${boxHeight}px`;
          boxElement.style.display = "block";

          // Update the label
          const labelElement = document.getElementById(`face-label-${index}`);
          if (labelElement) {
            labelElement.textContent = `${face.label || "Detecting..."} ${
              face.confidence ? `(${Math.round(face.confidence * 100)}%)` : ""
            }`;
          }
        } else {
          boxElement.style.display = "none";
        }
      });

      // Remove any extra boxes that aren't needed anymore
      const existingBoxes =
        videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
      existingBoxes.forEach((box) => {
        const boxIndex = parseInt(box.id.split("-")[2]);
        if (boxIndex >= trackingData.length) {
          videoContainerRef.current.removeChild(box);
        }
      });
    }
    // If trackingData is a single object (backward compatibility)
    else if (trackingData && trackingData.box && boxRef.current) {
      // Original single box update code
      const [x, y, width, height] = trackingData.box;
      const videoWidth = videoElement.videoWidth || 640;
      const videoHeight = videoElement.videoHeight || 480;
      const videoRect = videoElement.getBoundingClientRect();
      const containerRect = videoContainerRef.current.getBoundingClientRect();
      const scaleX = videoRect.width / videoWidth;
      const scaleY = videoRect.height / videoHeight;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (videoRect.width - videoWidth * scale) / 2;
      const offsetY = (videoRect.height - videoHeight * scale) / 2;
      const boxLeft = videoRect.left + x * scale + offsetX - containerRect.left;
      const boxTop = videoRect.top + y * scale + offsetY - containerRect.top;
      const boxWidth = width * scale;
      const boxHeight = height * scale;

      boxRef.current.style.left = `${boxLeft}px`;
      boxRef.current.style.top = `${boxTop}px`;
      boxRef.current.style.width = `${boxWidth}px`;
      boxRef.current.style.height = `${boxHeight}px`;
      boxRef.current.style.display = "block";
    } else {
      // Hide all boxes when no tracking data
      if (boxRef.current) {
        boxRef.current.style.display = "none";
      }

      const existingBoxes =
        videoContainerRef.current.querySelectorAll('[id^="face-box-"]');
      existingBoxes.forEach((box) => {
        box.style.display = "none";
      });
    }

    // Continue the animation loop
    animationFrameRef.current = requestAnimationFrame(updateBoundingBox);
  };

  // Handle window resize for box position updates
  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      updateBoundingBox();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Update box position whenever tracking data changes
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updateBoundingBox();
  }, [trackingData, isCameraOn, isShareScreen]);

  const handleEndMonitoringSession = async () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to end this session? All the data that has been tracked will be saved into databases for future references."
    );

    if (userConfirmed) {
      const response = await axios.post(
        "tracking_session/end_tracking_session",
        {
          sessionID: sessionId,
          sessionElapsedTime: sessionElapsedTime,
        }
      );

      if (response.status === 200) {
        toast.success(response.data.message);

        if (location.pathname === `/views/educator/tracking/${sessionId}`) {
          setTimeout(() => {
            navigate("/views/educator/dashboard");
          }, 1000);
        }
      } else {
        toast.error(response.data.error);
        return;
      }
    } else {
      toast.info("Session not ended.");
    }
  };

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
            {isTracking &&
              Array.isArray(trackingData) &&
              trackingData.map((face, index) => {
                // Determine which video element is active
                const activeVideoElement = isCameraOn
                  ? cameraRef.current
                  : screenRef.current;

                // Only proceed if we have a valid video element and face box
                if (activeVideoElement && face.box) {
                  const boxPos = calculateBoxPosition(
                    face.box,
                    activeVideoElement
                  );

                  return (
                    <div
                      key={index}
                      className="position-absolute"
                      style={{
                        border: "3px solid red",
                        zIndex: 9999,
                        pointerEvents: "none",
                        position: "absolute",
                        left: `${boxPos.left}px`,
                        top: `${boxPos.top}px`,
                        width: `${boxPos.width}px`,
                        height: `${boxPos.height}px`,
                        display: face.box ? "block" : "none",
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
                        {face.label || "Detecting..."}
                        {face.confidence
                          ? `(${Math.round(face.confidence * 100)}%)`
                          : ""}
                      </div>
                    </div>
                  );
                }
                return null; // Return null if no valid video element or face box
              })}

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
          <EmotionStatistics
            studentStats={studentStats}
            isTracking={isTracking}
          />
        </Col>
      </Row>

      <Row
        className="g-0 border-top"
        style={{ height: "7vh", backgroundColor: "#2A2A2A" }}
      >
        <Col xs={2} className="d-flex align-items-center ps-3">
          <span className="text-white rounded px-2 py-1 d-flex align-items-center justify-content-start fw-bold">
            <i className="bi bi-alarm me-2"></i>Elapsed:{" "}
            {formatElapsedTime(sessionElapsedTime)}
          </span>
        </Col>
        <Col
          xs={8}
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
              className={`bi bi-${
                isTracking ? "stop-btn" : "person-bounding-box"
              }`}
            ></i>
            &nbsp;{isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>

          <Button variant="danger" onClick={handleEndMonitoringSession}>
            <i className="bi bi-door-open"></i> &nbsp;End Monitoring Session
          </Button>
        </Col>
        <Col
          xs={2}
          className="d-flex align-items-center justify-content-end pe-3"
        >
          <span className="text-white rounded px-2 py-1 d-flex align-items-center fw-bold">
            <i className="bi bi-clock me-2"></i>
            Tracking: {formatElapsedTime(trackingElapsedTime)}
          </span>
        </Col>
      </Row>
    </Container>
  );
}

export default RealTimeMonitoring;
