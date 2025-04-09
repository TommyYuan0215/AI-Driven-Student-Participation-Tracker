import React from "react";
import StatusBadge from "../common/StatusBadgeComponent";

const announcementStatusConfig = {
  1: { color: "bg-success", text: "Activated" },
  0: { color: "bg-secondary", text: "Archived" },
};

function AnnouncementStatusBadge({ announcementStatus }) {
  return (
    <StatusBadge
      status={announcementStatus}
      statusConfig={announcementStatusConfig}
    />
  );
}

export default AnnouncementStatusBadge;
