import React from "react";
import PageTitleBreadcrumb from "../../components/PageTitleBreadcrumb";
import { toast } from "react-toastify";
import axios from "../../utils/axios_configure";

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
