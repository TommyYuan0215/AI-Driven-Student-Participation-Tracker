import React from "react";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import { toast } from "react-toastify";
import axios from "../../../utils/axios_configure";

function UserTrendingAdmin() {
  return (
    <>
      <PageTitleBreadcrumb
        title="User Trending Analysis"
        path={location.pathname}
      />
      <div className="m-4 card px-3"></div>
    </>
  );
}

export default UserTrendingAdmin;
