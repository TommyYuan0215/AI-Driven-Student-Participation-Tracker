import React from "react";
import { Badge } from "react-bootstrap";

function StatusBadge({ status, statusConfig }) {
  const { color, text } = statusConfig[status] || {
    color: "bg-secondary",
    text: "Unknown",
  };

  return <Badge className={`badge ${color} text-white`}>{text}</Badge>;
}

export default StatusBadge;
