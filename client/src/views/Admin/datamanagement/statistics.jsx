import React from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import { toast } from "react-toastify";
import axios from "../../../utils/axios_configure";

function StatisticsAdmin() {
  return (
    <>
      <PageTitleBreadcrumb
        title="Overall Statistics Data"
        path={location.pathname}
      />
      <div className="m-4 card px-3"></div>
    </>
  );
}

export default StatisticsAdmin;
