import React from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import { toast } from "react-toastify";
import axios from "../../../utils/axios_configure";

function EducatorStatistics() {
  return (
    <>
      <PageTitleBreadcrumb
        title="Statistics Dashboard"
        path={location.pathname}
      />
    </>
  );
}

export default EducatorStatistics;
