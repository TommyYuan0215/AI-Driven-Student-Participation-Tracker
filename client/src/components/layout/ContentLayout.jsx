import React from "react";
import { Outlet } from "react-router-dom";

function ContentLayout() {
  return (
    <div className="content-container-full">
      <div className="content-wrapper-full">
        <Outlet />
      </div>
    </div>
  );
}

export default ContentLayout;
