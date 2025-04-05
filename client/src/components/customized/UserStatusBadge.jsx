import React from "react";
import { Button, Badge } from "react-bootstrap";

function UserStatusBadge({ userStatus }) {
  const status =
    userStatus === 1
      ? {
          color: "badge bg-success text-white",
          text: "Authorized",
        }
      : {
          color: "badge bg-danger text-white",
          text: "Unauthorized",
        };

  return (
    <div>
      {/* Display the badge with the corresponding color and text */}
      <Badge className={status.color}>{status.text}</Badge>
    </div>
  );
}

export default UserStatusBadge;
