import React, { useState, useEffect } from "react";
import { Carousel, Badge } from "react-bootstrap";
import axios from "../../utils/axios_configure";
import LargeModelComponent from "../modal/LargeModelComponent";

const AnnouncementCard = ({
  initialNotifications = [],
  title = "News and Announcement Center",
}) => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [modalShow, setModalShow] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(
          "/contentmanagement/get_announcement_data"
        );

        console.log("API Response:", response.data);

        const announcements = response.data?.data;
        if (!Array.isArray(announcements)) {
          throw new Error("Invalid response format");
        }

        const filteredAnnouncements = announcements.filter((a) => {
          return Number(a.announcementStatus) !== 0;
        });

        const announcementData = filteredAnnouncements.map(
          (
            {
              announcementID,
              announcementTitle,
              announcementDescription,
              createAt,
            },
            index
          ) => ({
            id: index + 1,
            type: "info", // Change type based on your use case
            title: `${announcementTitle}`,
            message: `${announcementDescription}`,
            timestamp: createAt || "N/A", // Default if timestamp not provided
            announcementID,
            announcementTitle,
            announcementDescription,
            createAt,
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

  const handleShowModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setModalShow(true);
  };

  const handleHideModal = () => {
    setModalShow(false);
    setSelectedAnnouncement(null);
  };

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
        className="card-body d-flex flex-column justify-content-center"
        style={{
          height: "230px",
          maxHeight: "230px",
          overflow: "hidden", // Prevent overflow from the parent div
        }}
      >
        {notifications.length > 0 ? (
          <Carousel
            style={{
              height: "100%",
              backgroundColor: "#cfe5ff",
            }}
          >
            {notifications.map((notif) => (
              <Carousel.Item
                key={notif.id}
                style={{ cursor: "pointer" }}
                className="text-light rounded-3 shadow-sm"
                onClick={() => handleShowModal(notif)}
              >
                <div className="text-center p-4">
                  {/* Title */}
                  <h3
                    className="display-6 font-weight-bold text-primary mb-3"
                    style={{
                      whiteSpace: "normal", // Allow the title to wrap to the next line
                      overflow: "hidden", // Hide the overflowing text
                      textOverflow: "ellipsis", // Add "..." when the text is too long
                      maxWidth: "100%", // Ensure title is constrained within the available width
                    }}
                  >
                    {notif.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-muted mb-4"
                    style={{
                      display: "-webkit-box", // Enable multi-line truncation
                      WebkitBoxOrient: "vertical", // Set the box's orientation to vertical
                      overflow: "hidden", // Hide the overflowing text
                      WebkitLineClamp: 2, // Limit the text to 4 lines
                      textOverflow: "ellipsis", // Add "..." after the 4th line
                      maxWidth: "100%", // Ensure description fits within the available space
                    }}
                  >
                    {notif.message}
                  </p>

                  {/* Timestamp */}
                  <div className="text-muted">
                    <small>{new Date(notif.timestamp).toLocaleString()}</small>
                  </div>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <div className="text-center">
            <p className="text-muted">No new notifications</p>
          </div>
        )}
      </div>

      {/* Modal to show more details using LargeModelComponent */}
      <LargeModelComponent show={modalShow} onHide={handleHideModal}>
        {/* Check if selectedAnnouncement exists before passing to modal */}
        {selectedAnnouncement ? (
          <div className="p-4">
            {/* Title */}
            <h4 className="text-center display-6 font-weight-bold text-primary mb-3">
              {selectedAnnouncement.announcementTitle}
            </h4>

            {/* Card for description */}
            <div className="card shadow-lg border-0 mb-4">
              <div
                className="card-body"
                style={{
                  maxHeight: "300px", // Set a fixed max height for the container
                  overflowY: "auto", // Enable vertical scrolling if content exceeds the height
                  whiteSpace: "pre-line", // Maintains line breaks
                  wordWrap: "break-word",
                }}
              >
                <p className="text-muted">
                  {selectedAnnouncement.announcementDescription}
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-muted">
              <small>
                {" "}
                Posted Date: &nbsp;
                {new Date(selectedAnnouncement.timestamp).toLocaleString()}
              </small>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted">No details available</p>
        )}
      </LargeModelComponent>
    </div>
  );
};

export default AnnouncementCard;
