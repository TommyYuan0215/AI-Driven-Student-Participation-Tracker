// File: hooks/useTrackingSession.js
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "../../../../utils/axiosUtils";

// Debounce utility to prevent duplicate sends
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function useTrackingSession(
  sessionId,
  socketRef,
  mediaStreamRef,
  stopScreenShare
) {
  const [isTracking, setIsTracking] = useState(false);
  const [sessionElapsedTime, setSessionElapsedTime] = useState(0);
  const [trackingElapsedTime, setTrackingElapsedTime] = useState(0);
  const [intervalFromDb, setIntervalFromDb] = useState(60);
  const [trackingData, setTrackingData] = useState([]);
  const [studentStats, setStudentStats] = useState({});

  // Threshold notification states
  const [thresholdSettings, setThresholdSettings] = useState({
    bored: 3,
    lackingFocus: 3
  });
  const [notificationInterval, setNotificationInterval] = useState(60);
  const lastNotificationTimeRef = useRef(0);
  const notificationHistoryRef = useRef([]);
  const MAX_NOTIFICATION_HISTORY = 5;

  // Emotion counts
  const [interestedCount, setInterestedCount] = useState(0);
  const [boredCount, setBoredCount] = useState(0);
  const [lackingFocusCount, setLackingFocusCount] = useState(0);

  // Refs
  const trackingIntervalRef = useRef(null);
  const dataIntervalRef = useRef(null);
  const hasStoppedTracking = useRef(false);
  const currentElapsedTimeRef = useRef(0);
  const lastSaveTimeRef = useRef(0);

  // Toast spam prevention
  const lastToastTimeRef = useRef(0);
  const TOAST_ERROR_INTERVAL = 5000;

  // Refs for current counts
  const interestedCountRef = useRef(interestedCount);
  const boredCountRef = useRef(boredCount);
  const lackingFocusCountRef = useRef(lackingFocusCount);

  // Session timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionElapsedTime((prevTime) => prevTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [intervalResponse, thresholdResponse] = await Promise.all([
          axios.get("/settings/get_emotion_save_interval"),
          axios.get("/settings/get_emotion_thresholds")
        ]);

        if (intervalResponse.data.success) {
          setIntervalFromDb(intervalResponse.data.emotionSaveInterval);
          console.log("Interval from DB:", intervalResponse.data.emotionSaveInterval);
        }

        if (thresholdResponse.data.success) {
          setThresholdSettings(thresholdResponse.data.thresholds);
          console.log("Threshold settings:", thresholdResponse.data.thresholds);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Sync refs with state
  useEffect(() => {
    interestedCountRef.current = interestedCount;
  }, [interestedCount]);

  useEffect(() => {
    boredCountRef.current = boredCount;
  }, [boredCount]);

  useEffect(() => {
    lackingFocusCountRef.current = lackingFocusCount;
  }, [lackingFocusCount]);

  // Handle tracking state
  useEffect(() => {
    if (isTracking && intervalFromDb > 0) {
      hasStoppedTracking.current = false;

      if (!trackingIntervalRef.current) {
        setTrackingElapsedTime(0);
        currentElapsedTimeRef.current = 0;

        trackingIntervalRef.current = setInterval(() => {
          currentElapsedTimeRef.current += 1;
          setTrackingElapsedTime(currentElapsedTimeRef.current);

          // Check if it's time to save data
          const now = Date.now();
          if (now - lastSaveTimeRef.current >= intervalFromDb * 1000) {
            sendTrackingData();
            lastSaveTimeRef.current = now;
          }
        }, 1000);
      }

      return () => {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = null;
        }
        if (dataIntervalRef.current) {
          clearInterval(dataIntervalRef.current);
          dataIntervalRef.current = null;
        }
      };
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
        dataIntervalRef.current = null;
      }
      if (!hasStoppedTracking.current && trackingElapsedTime > 0) {
        toast.info("Tracking stopped");
        hasStoppedTracking.current = true;
      }
    }
  }, [isTracking, intervalFromDb]);

  // Socket event for tracking updates
  useEffect(() => {
    if (!socketRef.current) return;

    const handleTrackingUpdate = (data) => {
      const faces = data?.faces || [];
      console.log("Received tracking update:", faces);

      setTrackingData(faces);

      if (faces.length > 0) {
        // Count each emotion state
        const newStats = {};
        faces.forEach(face => {
          if (face.label) {
            // Increment count for each emotion
            newStats[face.label] = (newStats[face.label] || 0) + 1;
          }
        });

        setStudentStats(newStats);
      }
    };

    socketRef.current.on("tracking_update", handleTrackingUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("tracking_update", handleTrackingUpdate);
      }
    };
  }, []);

  // Update emotion counts when tracking data changes
  useEffect(() => {
    if (Array.isArray(trackingData) && trackingData.length > 0) {
      const counts = trackingData.reduce((acc, face) => {
        if (face.label) {
          acc[face.label] = (acc[face.label] || 0) + 1;
        }
        return acc;
      }, {});

      setInterestedCount(counts["Interested"] || 0);
      setBoredCount(counts["Bored"] || 0);
      setLackingFocusCount(counts["Lacking_Focus"] || 0);
    }
  }, [trackingData]);

  // Check thresholds and notify
  const checkThresholdsAndNotify = () => {
    const currentTime = Date.now();
    if (currentTime - lastNotificationTimeRef.current < notificationInterval * 1000) {
      return;
    }

    const notifications = [];

    if (
      thresholdSettings.bored > 0 &&
      boredCountRef.current >= thresholdSettings.bored
    ) {
      notifications.push({
        type: "bored",
        count: boredCountRef.current,
        message: `${boredCountRef.current} students appear bored`
      });
    }

    if (
      thresholdSettings.lackingFocus > 0 &&
      lackingFocusCountRef.current >= thresholdSettings.lackingFocus
    ) {
      notifications.push({
        type: "lackingFocus",
        count: lackingFocusCountRef.current,
        message: `${lackingFocusCountRef.current} students appear to be lacking focus`
      });
    }

    if (notifications.length > 0) {
      const shouldNotify = notifications.some(notification => {
        const recentNotification = notificationHistoryRef.current.find(
          n => n.type === notification.type && n.count === notification.count
        );
        return !recentNotification;
      });

      if (shouldNotify) {
        notificationHistoryRef.current = [
          ...notifications,
          ...notificationHistoryRef.current
        ].slice(0, MAX_NOTIFICATION_HISTORY);

        notifications.forEach(notification => {
          toast.info(notification.message, {
            autoClose: 5000,
            position: "top-center",
            className: `notification-${notification.type}`
          });
        });

        lastNotificationTimeRef.current = currentTime;
      }
    }
  };

  // Effect to handle threshold notifications
  useEffect(() => {
    if (!isTracking) return;

    const notificationInterval = setInterval(() => {
      checkThresholdsAndNotify();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(notificationInterval);
  }, [isTracking, thresholdSettings, notificationInterval]);

  // Send tracking data to server
  const sendTrackingData = async () => {
    if (!isTracking) return; // Prevent sending if not tracking
    try {
      const currentInterestedFromRef = interestedCountRef.current;
      const currentBoredFromRef = boredCountRef.current;
      const currentLackingFocusFromRef = lackingFocusCountRef.current;

      const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
      const payload = {
        sessionID: sessionId,
        timestamp: timestamp,
        interestedCount: currentInterestedFromRef,
        boredCount: currentBoredFromRef,
        lackingFocusCount: currentLackingFocusFromRef,
      };

      // Add retry logic with exponential backoff
      let retries = 3;
      let lastError = null;
      let delay = 1000; // Start with 1 second delay

      while (retries > 0) {
        try {
          // Ensure socket is connected before sending
          if (!socketRef.current?.connected) {
            console.log("Socket not connected, waiting for connection...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }

          // Prevent sending if not tracking (double guard)
          if (!isTracking) return;

          const response = await axios.post(
            "/tracking_session/tracking_emotion",
            payload,
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 15000,
              retry: 3,
              retryDelay: 1000
            }
          );
          
          if (response.data && response.data.message) {
            console.log("Server response:", response.data);
            if (currentInterestedFromRef > 0 || currentBoredFromRef > 0 || currentLackingFocusFromRef > 0) {
              toast.success("Tracking data recorded!");
            }
            return; // Success, exit the retry loop
          }
        } catch (error) {
          lastError = error;
          retries--;
          
          if (retries > 0) {
            console.log(`Retrying... ${retries} attempts left. Waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          }
        }
      }

      // If we get here, all retries failed
      throw lastError;

    } catch (error) {
      console.error("Tracking error details:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      
      let errorMessage = "Failed to send tracking data";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please check your connection.";
      } else if (!error.response) {
        errorMessage = "No response from server. Please check your connection.";
      } else if (error.response.status === 404) {
        errorMessage = "API endpoint not found. Please check the server configuration.";
      } else if (error.response.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }

      const now = Date.now();
      if (now - lastToastTimeRef.current > TOAST_ERROR_INTERVAL) {
        toast.error(`Error: ${errorMessage}`);
        lastToastTimeRef.current = now;
      }
    }
  };

  const handleTracking = () => {
    if (!mediaStreamRef.current && !isTracking) {
      toast.error("No active video stream to track!");
      return;
    }

    setIsTracking((prev) => !prev);
  };

  const handleEndMonitoringSession = async (navigateCallback) => {
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

          setInterestedCount(0);
          setBoredCount(0);
          setLackingFocusCount(0);

          if (typeof navigateCallback === "function") {
            navigateCallback("/educator/dashboard");
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

  const formatElapsedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopScreenShare = () => {
    if (isTracking) {
      stopScreenShare(handleTracking);
    } else {
      stopScreenShare();
    }
  };

  return {
    isTracking,
    sessionElapsedTime,
    trackingElapsedTime,
    trackingData,
    studentStats,
    interestedCount,
    boredCount,
    lackingFocusCount,
    handleTracking,
    handleEndMonitoringSession,
    formatElapsedTime,
    handleStopScreenShare,
  };
}