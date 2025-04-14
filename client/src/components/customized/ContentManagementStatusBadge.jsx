import React from "react";
import StatusBadge from "../common/StatusBadgeComponent";

const contentStatusConfig = {
  1: { color: "bg-success", text: "Activated" },
  0: { color: "bg-secondary", text: "Archived" },
};

function ContentManagementStatusBadge({ contentStatus }) {
  return (
    <StatusBadge status={contentStatus} statusConfig={contentStatusConfig} />
  );
}

export default ContentManagementStatusBadge;
