import React from "react";
import StatusBadge from "../common/StatusBadgeComponent";

const userStatusConfig = {
  1: { color: "bg-success", text: "Authorized" },
  0: { color: "bg-danger", text: "Unauthorized" },
};

function UserStatusBadge({ userStatus }) {
  return <StatusBadge status={userStatus} statusConfig={userStatusConfig} />;
}

export default UserStatusBadge;
