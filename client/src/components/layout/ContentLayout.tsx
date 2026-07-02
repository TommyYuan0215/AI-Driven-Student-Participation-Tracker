import React from "react";
import { Outlet } from "react-router-dom";

interface ContentLayoutProps {
  children?: React.ReactNode;
}

function ContentLayout({ children }: ContentLayoutProps) {
  return (
    <div className="content-container-full">
      <div className="content-wrapper-full">
        {children}
      </div>
    </div>
  );
}

export default ContentLayout;
