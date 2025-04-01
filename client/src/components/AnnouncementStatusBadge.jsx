import React from "react";
import { Button, Badge } from "react-bootstrap";

function AnnouncementStatusBadge({ announcementStatus }) {
  const status =
    announcementStatus === 1
      ? {
          color: "badge bg-success text-white",
          text: "Activated",
        }
      : {
          color: "badge bg-secondary text-white",
          text: "Archived",
        };

  return (
    <div>
      {/* Display the badge with the corresponding color and text */}
      <Badge className={status.color}>{status.text}</Badge>
    </div>
  );
}

export default AnnouncementStatusBadge;
