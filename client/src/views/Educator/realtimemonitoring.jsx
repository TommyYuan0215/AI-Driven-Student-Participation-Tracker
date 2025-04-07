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

// Socket.io configuration options for better stability
const socketOptions = {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  pingTimeout: 30000,
  pingInterval: 10000,
};

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

  // Add connection status state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxReconnectAttempts = 5;

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
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const currentUserID = userData?.userID;

  // Initialize WebSocket Connection while start tracking
  useEffect(() => {
    if (isTracking) {
      // Clear any previous connection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Reset connection attempts counter when tracking starts
      setConnectionAttempts(0);

      // Function to create socket connection
      const createSocketConnection = () => {
        // Clean up any existing connection first
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        // Create new socket connection with improved options
        socketRef.current = io(SOCKET_URL, socketOptions);

        // Setup connection event handlers
        socketRef.current.on("connect", () => {
          console.log("Connected to tracking server");
          toast.success("Connected to tracking server");
          setIsConnected(true);
          setConnectionAttempts(0);

          // Setup heartbeat ping
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }

          pingIntervalRef.current = setInterval(() => {
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit("ping");
            }
          }, 10000);
        });

        socketRef.current.on("pong", () => {
          console.log("Received pong from server");
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

        socketRef.current.on("connect_error", (error) => {
          console.error("Connection error:", error);
          toast.error("Failed to connect to tracking server");
          setIsConnected(false);

          // Increment connection attempts
          setConnectionAttempts((prev) => {
            const newAttempts = prev + 1;
            if (newAttempts >= maxReconnectAttempts && isTracking) {
              toast.error(
                `Failed to connect after ${maxReconnectAttempts} attempts. Please check server status.`
              );
              // Optionally stop tracking after max attempts
              // setIsTracking(false);
            }
            return newAttempts;
          });
        });

        socketRef.current.on("disconnect", (reason) => {
          console.warn("Disconnected from tracking server:", reason);
          toast.warn("Disconnected from tracking server");
          setIsConnected(false);

          // Clear ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          // Try to reconnect if still tracking
          if (isTracking && connectionAttempts < maxReconnectAttempts) {
            toast.info("Attempting to reconnect...");
            reconnectTimeoutRef.current = setTimeout(() => {
              createSocketConnection();
            }, 2000);
          }
        });

        socketRef.current.on("error", (error) => {
          console.error("Socket error:", error);
          toast.error("Socket error occurred");
        });
      };

      // Create the initial socket connection
      createSocketConnection();

      // Cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
    } else {
      // If tracking is disabled, disconnect WebSocket and clean up
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      setIsConnected(false);
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
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
    // Only run this effect when isTracking changes to true
    if (isTracking) {
      // Reset tracking time when tracking starts (only when isTracking changes from false to true)
      setTrackingElapsedTime(0);

      // Create interval to update tracking time
      trackingIntervalRef.current = setInterval(() => {
        setTrackingElapsedTime((prevTime) => {
          // Use the updated value right away
          const newTime = prevTime + 1;

          // Check if we need to send data (every 60 seconds)
          if (newTime % 60 === 0) {
            // Use the current state values directly when sending
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

  // Create a separate effect for sending data when emotion counts change
  useEffect(() => {
    // This effect will only run when emotion counts change AND tracking is active
    // It will not reset the timer, but will ensure we're using the latest emotion counts
    if (
      isTracking &&
      trackingElapsedTime > 0 &&
      trackingElapsedTime % 60 === 0
    ) {
      sendTrackingData();
    }
  }, [
    interestedCount,
    boredCount,
    lackingFocusCount,
    isTracking,
    trackingElapsedTime,
  ]);

  // Insert data into the database - Updated with emotion counts
  const sendTrackingData = async () => {
    try {
      // Log the current counts for debugging
      console.log("Sending counts:", {
        interested: interestedCount,
        bored: boredCount,
        lackingFocus: lackingFocusCount,
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
      const payload = {
        sessionID: sessionId,
        userID: currentUserID,
        timestamp: timestamp,
        interestedCount: interestedCount,
        boredCount: boredCount,
        lackingFocusCount: lackingFocusCount,
      };

      const response = await axios.post(
        "/tracking_session/tracking_emotion",
        payload
      );
      console.log("Server response:", response.data);
      toast.success("Tracking data recorded!");
    } catch (error) {
      toast.error("Failed to send tracking data.");
      console.error("Tracking error:", error);
    }
  };

  // Send Video Frames to Backend with improved error handling and optimizations
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

    // Set canvas dimensions to a smaller size to reduce data transfer
    // This maintains aspect ratio but reduces resolution
    const scaleFactor = 0.5; // Reduce to 50% of original size
    canvas.width = videoElement.videoWidth * scaleFactor;
    canvas.height = videoElement.videoHeight * scaleFactor;

    // Clear any existing interval
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    // Less frequent frame transmission - changed from 200ms to 300ms (3.33 FPS instead of 5 FPS)
    const captureInterval = 300;

    // Keep track of consecutive failures to implement backoff strategy
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;

    trackingIntervalRef.current = setInterval(() => {
      // Check if we should send frames
      if (!isTracking) {
        console.warn("Tracking is OFF. Stopping video frame capture.");
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
        return;
      }

      // Check socket connection before attempting to send
      if (!socketRef.current || !socketRef.current.connected) {
        console.warn(
          "Socket not available or not connected! Skipping frame send."
        );
        consecutiveFailures++;

        // If we've had too many failures, slow down the capture rate
        if (consecutiveFailures >= maxConsecutiveFailures) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = setInterval(
            arguments.callee, // reference to this same function
            captureInterval * 2 // double the interval
          );
          consecutiveFailures = 0;
          console.warn("Reduced frame rate due to connection issues");
        }
        return;
      }

      try {
        // Reset failure counter on successful connection
        consecutiveFailures = 0;

        // Check if video dimensions have changed
        if (
          canvas.width !== videoElement.videoWidth * scaleFactor ||
          canvas.height !== videoElement.videoHeight * scaleFactor
        ) {
          canvas.width = videoElement.videoWidth * scaleFactor;
          canvas.height = videoElement.videoHeight * scaleFactor;
        }

        // Draw the video frame at the reduced size
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Use lower JPEG quality (0.6 instead of 0.7)
        const imageData = canvas.toDataURL("image/jpeg", 0.6);

        // Send the frame with socket.io
        socketRef.current.emit("video_frame", {
          frame: imageData,
          dimensions: {
            width: canvas.width,
            height: canvas.height,
          },
          detectMultiple: true,
          timestamp: Date.now(), // Add timestamp for tracking latency
        });
      } catch (error) {
        console.error("Error capturing video frame:", error);
        consecutiveFailures++;

        // If there are too many consecutive failures, slow down
        if (consecutiveFailures >= maxConsecutiveFailures) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = setInterval(
            arguments.callee, // reference to this same function
            captureInterval * 2 // double the interval
          );
          consecutiveFailures = 0;
          console.warn("Reduced frame rate due to capture errors");
        }
      }
    }, captureInterval);
  };

  // This function updates the position of the bounding box based on tracking data
  const calculateBoxPosition = (box, videoElement) => {
    if (!box || !videoElement) return { left: 0, top: 0, width: 0, height: 0 };

    // Add this line to account for the scaling during transmission
    const transmissionScaleFactor = 0.5;

    // Adjust for the transmission scale factor
    const [rawX, rawY, rawWidth, rawHeight] = box;
    const x = rawX / transmissionScaleFactor;
    const y = rawY / transmissionScaleFactor;
    const width = rawWidth / transmissionScaleFactor;
    const height = rawHeight / transmissionScaleFactor;

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
          // Add this line
          const transmissionScaleFactor = 0.5;

          // Get the bounding box and adjust for transmission scaling
          const [rawX, rawY, rawWidth, rawHeight] = face.box;
          const x = rawX / transmissionScaleFactor;
          const y = rawY / transmissionScaleFactor;
          const width = rawWidth / transmissionScaleFactor;
          const height = rawHeight / transmissionScaleFactor;

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
      // Add this line
      const transmissionScaleFactor = 0.5;

      // Original single box update code with scaling adjustment
      const [rawX, rawY, rawWidth, rawHeight] = trackingData.box;
      const x = rawX / transmissionScaleFactor;
      const y = rawY / transmissionScaleFactor;
      const width = rawWidth / transmissionScaleFactor;
      const height = rawHeight / transmissionScaleFactor;

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
      try {
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
        }
      } catch (error) {
        console.error("Error ending session:", error);
        toast.error("Failed to end session. Please try again.");
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
