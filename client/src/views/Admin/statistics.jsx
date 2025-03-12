import React from "react";
import PageTitleBreadcrumb from "../../components/PageTitleBreadcrumb";
import { toast } from 'react-toastify';
import axios from '../../utils/axios_configure';


function StatisticsAdmin() {

    return (
        <>
        <PageTitleBreadcrumb title="Overall Statistics Data" path={location.pathname} />
    </>
    )
};

export default StatisticsAdmin;