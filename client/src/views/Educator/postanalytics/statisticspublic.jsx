import React, { useState, useEffect } from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import { toast } from "react-toastify";
import axios from "../../../utils/axios_configure";

function EducatorPublicStatistics() {
  return (
    <>
      <PageTitleBreadcrumb
        title="Statistics Dashboard (Public)"
        path={location.pathname}
      />
    </>
  );
}

export default EducatorPublicStatistics;
