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
  userId,
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

  // Emotion counts
  const [interestedCount, setInterestedCount] = useState(0);
  const [boredCount, setBoredCount] = useState(0);
  const [lackingFocusCount, setLackingFocusCount] = useState(0);

  // Refs
  const trackingIntervalRef = useRef(null);
  const dataIntervalRef = useRef(null);
  const hasStoppedTracking = useRef(false);
  const currentElapsedTimeRef = useRef(0);

  // Toast spam prevention
  const lastToastTimeRef = useRef(0);
  const TOAST_ERROR_INTERVAL = 5000; // 5 seconds

  // Session timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionElapsedTime((prevTime) => prevTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch interval settings from backend
  useEffect(() => {
    const fetchInterval = async () => {
      try {
        const response = await axios.get("/settings/get_emotion_save_interval");
        if (response.data.success) {
          setIntervalFromDb(response.data.emotionSaveInterval);
          console.log("Interval from DB:", response.data.emotionSaveInterval);
        } else {
          console.error("Failed to fetch interval from DB");
        }
      } catch (error) {
        console.error("Error fetching interval:", error);
      }
    };

    fetchInterval();
  }, []);

  // Handle tracking state - ensure intervalFromDb is a dependency
  useEffect(() => {
    if (isTracking && intervalFromDb > 0) {
      hasStoppedTracking.current = false;

      // Only start tracking timer if it's not already running
      if (!trackingIntervalRef.current) {
        // Reset tracking time and start counter
        setTrackingElapsedTime(0);
        currentElapsedTimeRef.current = 0;

        trackingIntervalRef.current = setInterval(() => {
          currentElapsedTimeRef.current += 1;
          setTrackingElapsedTime(currentElapsedTimeRef.current);
        }, 1000);
      }

      // Set up data sending interval based on intervalFromDb
      if (!dataIntervalRef.current) {
        dataIntervalRef.current = setInterval(() => {
          debouncedSendTrackingData();
        }, intervalFromDb * 1000);
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
      // Stop the tracking timer
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
        dataIntervalRef.current = null;
      }

      // Show toast message if tracking was active
      if (!hasStoppedTracking.current && trackingElapsedTime > 0) {
        toast.info("Tracking stopped");
        hasStoppedTracking.current = true;
      }
    }
  }, [isTracking, intervalFromDb]);

  // Separate effect to handle emotion data sending
  useEffect(() => {
    // Only run this if tracking is active
    if (!isTracking) return;
    
    // This effect handles changes to emotion counts without affecting the timer
    console.log("Emotion counts updated:", {
      interested: interestedCount,
      bored: boredCount,
      lackingFocus: lackingFocusCount
    });
    
  }, [interestedCount, boredCount, lackingFocusCount, isTracking]);

  // Socket event for tracking updates
  useEffect(() => {
    if (!socketRef.current) return;

    const handleTrackingUpdate = (data) => {
      const faces = data?.faces || [];
      console.log("Received tracking update:", faces);

      // Update tracking data without resetting
      setTrackingData(prevData => {
        // If no faces detected, keep previous data
        if (faces.length === 0) {
          return prevData;
        }
        return faces;
      });

      // Update student stats if faces are detected
      if (faces.length > 0) {
        const newStats = faces.reduce((stats, face) => {
          if (face.label) {
            stats[face.label] = (stats[face.label] || 0) + 1;
          }
          return stats;
        }, {});

        setStudentStats(prev => ({
          ...prev,
          ...newStats,
        }));
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
      // Keep track of previous counts
      const prevInterested = interestedCount;
      const prevBored = boredCount;
      const prevLackingFocus = lackingFocusCount;

      let interested = 0;
      let bored = 0;
      let lackingFocus = 0;

      trackingData.forEach((face) => {
        if (face.label) {
          const emotion = face.label.toLowerCase();
          console.log("Processing emotion:", emotion);
          if (emotion === "interested") {
            interested++;
          } else if (emotion === "bored") {
            bored++;
          } else if (emotion === "lacking_focus") {
            lackingFocus++;
          }
        }
      });

      console.log("Updated counts:", { interested, bored, lackingFocus });
      
      // Only update if we have new counts and they're different from previous
      if ((interested > 0 || bored > 0 || lackingFocus > 0) && 
          (interested !== prevInterested || bored !== prevBored || lackingFocus !== prevLackingFocus)) {
        setInterestedCount(interested);
        setBoredCount(bored);
        setLackingFocusCount(lackingFocus);
      }
    }
  }, [trackingData]);

  // Debounced sendTrackingData to avoid duplicate sends
  const debouncedSendTrackingData = debounce(() => {
    console.log("Current counts before sending:", {
      interested: interestedCount,
      bored: boredCount,
      lackingFocus: lackingFocusCount
    });
    sendTrackingData();
  }, 300);

  // Improved error handling and toast spam prevention
  const sendTrackingData = async () => {
    try {
      // Add milliseconds to timestamp to ensure uniqueness
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
      const uniqueId = `${sessionId}_${now.getTime()}`;

      // Get the current counts directly from state
      const currentInterested = interestedCount;
      const currentBored = boredCount;
      const currentLackingFocus = lackingFocusCount;

      console.log("Sending counts:", {
        interested: currentInterested,
        bored: currentBored,
        lackingFocus: currentLackingFocus
      });

      // Only send if we have any counts
      if (currentInterested === 0 && currentBored === 0 && currentLackingFocus === 0) {
        console.log("Skipping send - no counts to send");
        return;
      }

      const payload = {
        sessionID: sessionId,
        userID: userId,
        timestamp: timestamp,
        interestedCount: currentInterested,
        boredCount: currentBored,
        lackingFocusCount: currentLackingFocus,
        uniqueId: uniqueId
      };

      console.log("Sending tracking data:", payload);

      const response = await axios.post(
        "/tracking_session/tracking_emotion",
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      if (response.data && response.data.message) {
        console.log("Server response:", response.data);
        // Show success toast only if we have counts
        if (currentInterested > 0 || currentBored > 0 || currentLackingFocus > 0) {
          toast.success("Tracking data recorded!");
        }
      } else {
        throw new Error(response.data?.error || "Failed to record tracking data");
      }
    } catch (error) {
      // Enhanced error logging
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
      
      // More specific error messages based on error type
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

      // Rate limit toast errors
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

          // Reset counts after session ends
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

    let formattedTime = "";
    if (hrs > 0) formattedTime += `${hrs} hr `;
    if (mins > 0) formattedTime += `${mins} min `;
    if (secs > 0 || formattedTime === "") formattedTime += `${secs} seconds`;

    return formattedTime.trim();
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