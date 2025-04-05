import React from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import { toast } from "react-toastify";
import axios from "../../../utils/axiosUtils";

function DataTrendingAdmin() {
  return (
    <>
      <PageTitleBreadcrumb
        title="Data Trending Analysis"
        path={location.pathname}
      />
      <div className="m-4 card px-3"></div>
    </>
  );
}

export default DataTrendingAdmin;
