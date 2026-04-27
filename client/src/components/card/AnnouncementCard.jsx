import React, { useState, useEffect } from "react";
import { Carousel } from "react-bootstrap";
import axios from "../../utils/axiosUtils";
import LargeModelComponent from "../modal/LargeModelComponent";

const AnnouncementCard = ({
  initialNotifications = [],
  title = "News and Announcement Center",
}) => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [modalShow, setModalShow] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get("/contentmanagement/get_announcement_data");
        const announcements = response.data?.data;
        if (!Array.isArray(announcements)) throw new Error("Invalid response format");

        const sortedData = announcements
          .filter((a) => Number(a.announcementStatus) !== 0)
          .map((a, index) => ({
            id: index + 1,
            title: a.announcementTitle,
            message: a.announcementDescription,
            timestamp: a.createAt || "N/A",
            ...a
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setNotifications(sortedData);
      } catch (error) {
        console.error("Error fetching announcements:", error);
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
    <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-body border-translucent fade-in">
      <div className="card-header border-bottom py-3 d-flex align-items-center justify-content-between bg-tertiary border-translucent">
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
            <i className="bi bi-megaphone text-primary"></i>
          </div>
          <span className="fw-bold text-emphasis text-ls-neg-05">{title}</span>
        </div>
        {activeIndex === 0 && notifications.length > 0 && (
          <div className="badge rounded-pill px-3 bg-primary bg-opacity-10 text-primary small fw-bold" style={{ fontSize: '0.65rem' }}>
            LATEST
          </div>
        )}
      </div>

      <div className="py-4">
        {notifications.length > 0 ? (
          <Carousel
            indicators={false}
            className="h-100 announcement-carousel"
            onSelect={(idx) => setActiveIndex(idx)}
          >
            {notifications.map((notif) => (
              <Carousel.Item
                key={notif.id}
                className="h-100 pointer"
                onClick={() => handleShowModal(notif)}
              >
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <div className="announcement-inner-border-box text-center">
                    <h3 className="fw-bold mb-2 text-emphasis" style={{ fontSize: '1.4rem' }}>
                      {notif.title}
                    </h3>
                    <p className="text-secondary small mb-3 text-truncate-2">
                      {notif.message}
                    </p>
                    <div className="text-muted small fw-bold opacity-75">
                      <i className="bi bi-calendar-event me-2"></i>
                      {new Date(notif.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <div className="h-100 d-flex flex-column align-items-center justify-content-center opacity-50">
            <i className="bi bi-inbox-fill display-6 mb-2"></i>
            <p className="small fw-bold">No active announcements</p>
          </div>
        )}
      </div>

      <LargeModelComponent show={modalShow} onHide={handleHideModal} title="Broadcast Details">
        {selectedAnnouncement ? (
          <div className="p-2 fade-in">
            <div className="card border-0 rounded-4 mb-4 announcement-modal-header-box">
              <div className="card-body p-4 text-center">
                <h2 className="fw-black text-emphasis mb-0">{selectedAnnouncement.announcementTitle}</h2>
              </div>
            </div>

            <div className="card border-0 rounded-4 shadow-sm bg-body border-translucent mb-4">
              <div className="card-body p-4 p-md-5 announcement-modal-content">
                {selectedAnnouncement.announcementDescription}
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 pt-3 border-top">
              <div className="d-flex align-items-center gap-2 text-muted small fw-bold">
                <i className="bi bi-calendar3 text-primary"></i>
                {new Date(selectedAnnouncement.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="d-flex align-items-center gap-2 text-muted small fw-bold">
                <i className="bi bi-clock text-primary"></i>
                {new Date(selectedAnnouncement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted py-5">No details available</p>
        )}
      </LargeModelComponent>
    </div>
  );
};

export default AnnouncementCard;
