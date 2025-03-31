import React, { useState, useEffect } from "react";
import { Alert } from "react-bootstrap"; // Assuming you're using react-bootstrap
import axios from "../../utils/axios_configure";

const NotificationCard = ({
  initialNotifications = [],
  title = "News and Announcement Center",
}) => {
  // Initialize state with either provided notifications or empty array
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(
          "/contentmanagement/get_announcement_data"
        );

        // Log API response to check structure
        console.log("API Response:", response.data);

        // Ensure response contains 'data' array
        const announcements = response.data?.data;
        if (!Array.isArray(announcements)) {
          throw new Error("Invalid response format");
        }

        // Filter out announcements with status 0
        const filteredAnnouncements = announcements.filter(
          (a) => a.status !== 0 // Only include announcements where status is not 0
        );

        // Map filtered announcements to notification format
        const announcementData = filteredAnnouncements.map(
          ({ announcementID, announcementDescription }, index) => ({
            id: index + 1,
            type: "info", // Change type based on your use case
            message: `${announcementID}: ${announcementDescription}`,
          })
        );

        setNotifications(announcementData);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        setNotifications([
          { id: 1, type: "danger", message: "Error fetching data." },
        ]);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="card">
      <div
        className="card-header"
        style={{ backgroundColor: "#3B3486", color: "#ffffff" }}
      >
        <span className="ms-3">
          <b>{title}</b>
        </span>
      </div>
      <div
        className="card-body d-flex flex-column"
        style={{
          height: "250px",
          maxHeight: "250px",
          overflowY: "auto",
        }}
      >
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <Alert key={notif.id} variant={notif.type}>
              {notif.message}
            </Alert>
          ))
        ) : (
          <div className="text-center">
            <p className="text-muted">No new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
