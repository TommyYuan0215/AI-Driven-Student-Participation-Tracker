// File: hooks/useTrackingSession.js
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "../../../../utils/axiosUtils";

export function useTrackingSession(
  sessionId,
  userId,
  socketRef,
  mediaStreamRef
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
  const hasStoppedTracking = useRef(false);

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
        } else {
          console.error("Failed to fetch interval from DB");
        }
      } catch (error) {
        console.error("Error fetching interval:", error);
      }
    };

    fetchInterval();
  }, []);

  // Socket event for tracking updates
  useEffect(() => {
    if (!socketRef.current) return;

    const handleTrackingUpdate = (data) => {
      const faces = data?.faces || [];
      setTrackingData(faces);

      const newStats = faces.reduce((stats, face) => {
        if (face.label) {
          stats[face.label] = (stats[face.label] || 0) + 1;
        }
        return stats;
      }, {});

      setStudentStats((prev) => ({
        ...prev,
        ...newStats,
      }));
    };

    socketRef.current.on("tracking_update", handleTrackingUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("tracking_update", handleTrackingUpdate);
      }
    };
  }, [socketRef]);

  // Update emotion counts when tracking data changes
  useEffect(() => {
    if (Array.isArray(trackingData) && trackingData.length > 0) {
      let interested = 0;
      let bored = 0;
      let lackingFocus = 0;

      trackingData.forEach((face) => {
        if (face.label) {
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

      setInterestedCount(interested);
      setBoredCount(bored);
      setLackingFocusCount(lackingFocus);
    } else {
      setInterestedCount(0);
      setBoredCount(0);
      setLackingFocusCount(0);
    }
  }, [trackingData]);

  // Handle tracking state
  useEffect(() => {
    if (isTracking) {
      hasStoppedTracking.current = false;
      toast.success("Tracking started");

      // Reset tracking time and start counter
      setTrackingElapsedTime(0);
      trackingIntervalRef.current = setInterval(() => {
        setTrackingElapsedTime((prevTime) => {
          const newTime = prevTime + 1;

          if (newTime % intervalFromDb === 0) {
            sendTrackingData();
          }

          return newTime;
        });
      }, 1000);
    } else {
      // Stop the tracking timer
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }

      // Show toast message if tracking was active
      if (!hasStoppedTracking.current && trackingElapsedTime > 0) {
        toast.info("Tracking stopped");
        hasStoppedTracking.current = true;
      }
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isTracking]);

  // Send data when emotion counts change if it's time to record
  useEffect(() => {
    if (
      isTracking &&
      trackingElapsedTime > 0 &&
      trackingElapsedTime % intervalFromDb === 0
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

  const sendTrackingData = async () => {
    try {
      console.log("Sending counts:", {
        interested: interestedCount,
        bored: boredCount,
        lackingFocus: lackingFocusCount,
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
      const payload = {
        sessionID: sessionId,
        userID: userId,
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

          if (typeof navigateCallback === "function") {
            navigateCallback("/views/educator/dashboard");
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
  };
}
