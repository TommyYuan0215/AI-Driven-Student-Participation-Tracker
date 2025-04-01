import React from "react";
import { Outlet } from "react-router-dom";

function ContentLayout() {
  return (
    <div className="content-container">
      {/* Main Content */}
      <div className="content-wrapper">
        <Outlet />
      </div>
    </div>
  );
}

export default ContentLayout;
