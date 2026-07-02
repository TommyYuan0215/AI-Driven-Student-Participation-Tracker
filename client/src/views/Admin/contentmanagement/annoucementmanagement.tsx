import React, { useState, useEffect } from "react";
import { Table, Button, Pagination, Container } from "react-bootstrap";
import { Announcement, AnnouncementFormData } from "../../../types";
import { useNavigate, useLocation } from "react-router-dom";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import LoadingSpinner from "../../../components/common/LoadingSpinnerComponent";
import LargeModelComponent from "../../../components/modal/LargeModelComponent";
import { useLoadingState } from "../../../hooks/useLoadingState";
import AnnouncementForm from "../../../components/form/AnnouncementForm";
import { toast } from "react-toastify";
import axios from "../../../utils/axiosUtils";
import ContentManagementStatusBadge from "../../../components/customized/ContentManagementStatusBadge";
import useSession from "../../../hooks/useSession";

function AnnouncementManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoggedIn } = useSession(navigate);

  const {
    data: announcementList,
    loading,
    refetch,
  } = useLoadingState("/contentmanagement/get_announcement_data", []);

  // To handle sort function
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        // Reset sorting
        setSortConfig({ key: null, direction: null });
        return;
      }
    }

    setSortConfig({ key, direction });
  };

  // Applied sorting dynamically
  const sortedAnnouncement = [...announcementList].sort((a, b) => {
    if (!sortConfig.key) return 0; // No sorting initially
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination function
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const createdAnnouncement = sortedAnnouncement.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const [formData, setFormData] = useState<AnnouncementFormData>({
    announcementId: "",
    announcementTitle: "",
    announcementDesc: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleOpenModalEdit = (announcement: Announcement) => {
    setFormData({
      announcementId: announcement.announcementID,
      announcementTitle: announcement.announcementTitle,
      announcementDesc: announcement.announcementDescription,
    });
    setShowEditModal(true);
  };

  // To ensure clear all the data after closing the modal
  const handleCloseNewModal = () => {
    setShowNewModal(false);
    setFormData({
      announcementId: "",
      announcementTitle: "",
      announcementDesc: "",
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setFormData({
      announcementId: "",
      announcementTitle: "",
      announcementDesc: "",
    });
  };

  // Handle activated and deactivated announcement status
  const handleToggleStatus = async (announcementId: string | number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      const response = await axios.post(
        "/contentmanagement/update_announcement_status",
        {
          announcementId,
          announcementStatus: newStatus,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await refetch();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating announcement status.");
    }
  };

  // Handle New and Edit Submit Function
  const handleNewAnnouncement = async (e) => {
    e.preventDefault();
    const { announcementTitle, announcementDesc } = formData;

    if (!announcementTitle.trim() || !announcementDesc.trim()) {
      toast.error("All fields are required.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("userID", userData.userID);
    formDataToSend.append("announcementTitle", announcementTitle);
    formDataToSend.append("announcementDesc", announcementDesc);

    try {
      const response = await axios.post(
        "/contentmanagement/add_announcement",
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        setFormData({ announcementTitle: "", announcementDesc: "" });
        toast.success(response.data.message || "Announcement added successfully!");
        handleCloseNewModal();
        await refetch();
      } else {
        toast.error(response.data.message || "Failed to add announcement.");
      }
    } catch (error) {
      console.error("Add announcement error:", error);
      toast.error(error.response?.data?.message || "Failed to add announcement");
    }
  };

  const handleEditAnnouncement = async (e) => {
    e.preventDefault();
    const { announcementId, announcementTitle, announcementDesc } = formData;

    if (!announcementTitle.trim() || !announcementDesc.trim()) {
      toast.error("All fields are required.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("announcementId", String(announcementId));
    formDataToSend.append("announcementTitle", announcementTitle);
    formDataToSend.append("announcementDesc", announcementDesc);

    try {
      const response = await axios.post(
        "/contentmanagement/edit_announcement",
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        setFormData({ announcementId: "", announcementTitle: "", announcementDesc: "" });
        toast.success(response.data.message || "Announcement updated successfully!");
        handleCloseEditModal();
        await refetch();
      } else {
        toast.error(response.data.message || "Failed to update announcement.");
      }
    } catch (error) {
      console.error("Edit announcement error:", error);
      toast.error(error.response?.data?.message || "Failed to update announcement");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm(`Are you sure you want to delete announcement ID: ${id}?`)) {
      return;
    }

    try {
      const response = await axios.post("/contentmanagement/delete_announcement", { announcementId: id });
      if (response.data.success) {
        toast.success(response.data.message || "Announcement deleted successfully!");
        await refetch();
      } else {
        toast.error(response.data.message || "Failed to delete announcement");
      }
    } catch (error) {
      console.error("Delete announcement error:", error);
      toast.error(error.response?.data?.message || "Failed to delete announcement");
    }
  };

  return (
    <div className="py-2 fade-in">
      <PageTitleBreadcrumb
        title="Announcement Management"
        path={location.pathname}
        isAddNew={true}
        onclickToggle={() => setShowNewModal(true)}
        btnTitle="Create Announcement"
        btnIcon="bi-megaphone"
      />

      <div className="card border-0 rounded-4 overflow-hidden shadow-lg mt-4" style={{
        background: 'var(--bs-body-bg)',
        border: '1px solid var(--bs-border-color-translucent)'
      }}>
        <div className="card-header bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
          <div>
            <h6 className="mb-0 fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>System Broadcasts</h6>
            <p className="text-muted small mb-0">Publish and manage institution-wide updates</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small fw-medium">Items:</span>
            <select
              className="form-select form-select-sm rounded-pill px-3"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: "80px", background: 'var(--bs-tertiary-bg)' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="py-5"><LoadingSpinner text="Fetching broadcast history..." /></div>
          ) : announcementList.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0 custom-premium-table">
                <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
                  <tr>
                    <th className="ps-4 py-3 text-muted fw-bold small text-uppercase">#</th>
                    <th className="py-3 text-muted fw-bold small text-uppercase cursor-pointer" onClick={() => handleSort("announcementID")}>
                      ID {sortConfig.key === "announcementID" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                    <th className="py-3 text-muted fw-bold small text-uppercase cursor-pointer" onClick={() => handleSort("announcementTitle")}>
                      Title {sortConfig.key === "announcementTitle" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                    <th className="py-3 text-muted fw-bold small text-uppercase">Description</th>
                    <th className="py-3 text-muted fw-bold small text-uppercase text-center">Status</th>
                    <th className="py-3 text-muted fw-bold small text-uppercase text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {createdAnnouncement.map((announcement, index) => (
                    <tr key={announcement.announcementID} className="border-bottom" style={{ borderColor: 'var(--bs-border-color-translucent)' }}>
                      <td className="ps-4 text-muted small">{indexOfFirstItem + index + 1}</td>
                      <td className="fw-medium text-primary notranslate">#{announcement.announcementID}</td>
                      <td className="fw-bold notranslate" style={{ color: 'var(--bs-emphasis-color)' }}>{announcement.announcementTitle}</td>
                      <td className="text-muted small text-truncate notranslate" style={{ maxWidth: '300px' }}>{announcement.announcementDescription}</td>
                      <td className="text-center">
                        <ContentManagementStatusBadge contentStatus={announcement.announcementStatus} />
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className={`btn btn-sm ${announcement.announcementStatus === 1 ? 'btn-outline-secondary' : 'btn-outline-success'} rounded-pill px-3 d-flex align-items-center gap-2`}
                            onClick={() => handleToggleStatus(announcement.announcementID, announcement.announcementStatus)}
                          >
                            <i className={`bi ${announcement.announcementStatus === 1 ? 'bi-archive' : 'bi-broadcast'}`}></i>
                            <span className="small fw-bold">{announcement.announcementStatus === 1 ? "Archive" : "Activate"}</span>
                          </button>
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            onClick={() => handleOpenModalEdit(announcement)}
                          >
                            <i className="bi bi-pencil text-primary"></i>
                            <span className="small fw-bold">Edit</span>
                          </button>
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            onClick={() => handleDeleteAnnouncement(announcement.announcementID)}
                          >
                            <i className="bi bi-trash text-danger"></i>
                            <span className="small fw-bold">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-megaphone text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
              <h5 className="text-muted mt-3">No Announcements</h5>
              <p className="text-muted small">Create your first system announcement</p>
            </div>
          )}
        </div>

        <div className="card-footer bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
          <div className="text-muted small fw-medium">
            Page {currentPage} of {Math.ceil(announcementList.length / itemsPerPage)}
          </div>

          <Pagination className="mb-0 custom-premium-pagination">
            <Pagination.Prev
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            />
            <Pagination.Next
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(announcementList.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(announcementList.length / itemsPerPage)}
            />
          </Pagination>
        </div>
      </div>

      <LargeModelComponent
        show={showNewModal || showEditModal}
        onHide={() => { handleCloseNewModal(); handleCloseEditModal(); }}
        title={showNewModal ? "Compose Announcement" : "Modify Broadcast Content"}
      >
        <div className="p-2">
          <AnnouncementForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={showNewModal ? handleNewAnnouncement : handleEditAnnouncement}
            isEdit={!showNewModal}
          />
        </div>
      </LargeModelComponent>

    </div>
  );
}

export default AnnouncementManagement;
