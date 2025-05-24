import { useState, useEffect } from "react";
import axios from "../utils/axiosUtils";

export function useEmotionTrends() {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      try {
        // Fetch all sessions
        const sessionsRes = await axios.get("/tracking_session/get_tracking_session_admin");
        const sessions = sessionsRes.data || [];

        // Map: date string => {date, interested, bored, lackingFocus}
        const dailyMap = {};

        for (const session of sessions) {
          const emotionsRes = await axios.get("/tracking_session/get_tracking_emotion", {
            params: { sessionID: session.sessionID }
          });
          for (const entry of emotionsRes.data || []) {
            const date = entry.timestamp.split(' ')[0]; // e.g., '2024-05-01'
            if (!dailyMap[date]) {
              dailyMap[date] = { date, interested: 0, bored: 0, lackingFocus: 0 };
            }
            dailyMap[date].interested += parseInt(entry.interestedCount) || 0;
            dailyMap[date].bored += parseInt(entry.boredCount) || 0;
            dailyMap[date].lackingFocus += parseInt(entry.lackingFocusCount) || 0;
          }
        }

        // Convert to sorted array
        const trendArr = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
        setTrendData(trendArr);
      } catch (err) {
        setTrendData([]);
      }
      setLoading(false);
    }
    fetchTrends();
  }, []);

  return { trendData, loading };
} 