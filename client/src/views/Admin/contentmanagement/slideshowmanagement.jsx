import React, { useState } from "react";
import { Table, Button, Pagination, Container } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import ModelComponent from "../../../components/modal/XLargeModelComponent";
import LoadingSpinner from "../../../components/common/LoadingSpinnerComponent";
import SlideshowForm from "../../../components/form/SlideshowForm";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import axios from "../../../utils/axiosUtils";
import { toast } from "react-toastify";
import { useLoadingState } from "../../../hooks/useLoadingState";
import ContentManagementStatusBadge from "../../../components/customized/ContentManagementStatusBadge";
import useSession from "../../../hooks/useSession";

function SlideshowManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoggedIn } = useSession(navigate);

  const {
    data: slideshowData,
    loading,
    refetch,
  } = useLoadingState("/contentmanagement/get_slideshow_data", []);

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
  const sortedSlideshow = [...slideshowData].sort((a, b) => {
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
  const createdSlideshow = sortedSlideshow.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const [formData, setFormData] = useState({
    slideshowId: "",
    slideshowImage: "",
    slideshowTitle: "",
    slideshowDesc: "",
  });

  const [previewImage, setPreviewImage] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenModalEdit = (slideshow) => {
    setFormData({
      slideshowId: slideshow.slideshowID,
      slideshowImage: slideshow.slideshowImage,
      slideshowTitle: slideshow.slideshowTitle,
      slideshowDesc: slideshow.slideshowDescription,
    });
    setPreviewImage(`data:image/*;base64,${slideshow.slideshowImage}`);
    setShowEditModal(true);
  };

  // To ensure clear all the data after closing the modal
  const handleCloseNewModal = () => {
    setShowNewModal(false);
    setPreviewImage("");
    setFormData({
      slideshowId: "",
      slideshowImage: "",
      slideshowTitle: "",
      slideshowDesc: "",
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setPreviewImage("");
    setFormData({
      slideshowId: "",
      slideshowImage: "",
      slideshowTitle: "",
      slideshowDesc: "",
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size exceeds the limit of 5MB");
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid image type. Only JPEG, and PNG are allowed.");
        return;
      }

      setFormData({ ...formData, slideshowImage: file });
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleClearForm = (e) => {
    e.preventDefault();
    setFormData({ slideshowImage: "", slideshowTitle: "", slideshowDesc: "" });
    toast.info("Form has been reset");
  };

  const handleToggleStatus = async (slideshowId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const response = await axios.post("/contentmanagement/update_slideshow_status", { slideshowId, slideshowStatus: newStatus });
      if (response.data.success) {
        toast.success(response.data.message);
        await refetch();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating slideshow status.");
    }
  };

  const handleNewSlideshow = async (e) => {
    e.preventDefault();
    const { slideshowImage, slideshowTitle, slideshowDesc } = formData;

    if (!slideshowTitle || !slideshowDesc || !slideshowImage) {
      toast.error("All fields are required.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("userID", userData.userID);
    formDataToSend.append("slideshowTitle", slideshowTitle);
    formDataToSend.append("slideshowDesc", slideshowDesc);
    formDataToSend.append("slideshowImage", slideshowImage);

    try {
      const response = await axios.post("/contentmanagement/add_slideshow", formDataToSend, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.status === 200) {
        setFormData({ slideshowTitle: "", slideshowDesc: "", slideshowImage: null });
        setPreviewImage("");
        await refetch();
        setShowNewModal(false);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to add slideshow");
      }
    } catch (error) {
      console.error("Add slideshow error:", error);
      toast.error(error.response?.data?.message || "Error occurred");
    }
  };

  const handleEditSlideshow = async (e) => {
    e.preventDefault();
    const { slideshowId, slideshowImage, slideshowTitle, slideshowDesc } = formData;

    if (!slideshowTitle || !slideshowDesc || !slideshowImage) {
      toast.error("All fields are required.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("slideshowId", slideshowId);
    formDataToSend.append("slideshowTitle", slideshowTitle);
    formDataToSend.append("slideshowDesc", slideshowDesc);
    formDataToSend.append("slideshowImage", slideshowImage);

    try {
      const response = await axios.post("/contentmanagement/edit_slideshow", formDataToSend, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.status === 200) {
        setFormData({ slideshowId: "", slideshowTitle: "", slideshowDesc: "", slideshowImage: null });
        setPreviewImage("");
        await refetch();
        setShowEditModal(false);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to update slideshow");
      }
    } catch (error) {
      console.error("Edit slideshow error:", error);
      toast.error(error.response?.data?.message || "Error occurred");
    }
  };

  const handleDeleteSlideshow = async (id) => {
    if (!window.confirm(`Delete slideshow ID: ${id}?`)) return;
    try {
      const response = await axios.post("/contentmanagement/delete_slideshow", { slideshowId: id });
      if (response.status === 200) {
        await refetch();
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Delete slideshow error:", error);
      toast.error("Error occurred");
    }
  };

  return (
    <div className="py-2 fade-in">
      <PageTitleBreadcrumb
        title="Slideshow Management"
        path={location.pathname}
        isAddNew={true}
        onclickToggle={() => setShowNewModal(true)}
        btnTitle="Upload Media"
        btnIcon="bi-image-fill"
      />

      <div className="card border-0 rounded-4 overflow-hidden shadow-lg mt-4" style={{
        background: 'var(--bs-body-bg)',
        border: '1px solid var(--bs-border-color-translucent)'
      }}>
        <div className="card-header bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
          <div>
            <h6 className="mb-0 fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>Visual Assets</h6>
            <p className="text-muted small mb-0">Manage landing page visual rotations</p>
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
            <div className="py-5"><LoadingSpinner text="Processing visual library..." /></div>
          ) : slideshowData.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0 custom-premium-table">
                <thead style={{ background: 'var(--bs-tertiary-bg)' }}>
                  <tr>
                    <th className="ps-4 py-3 text-muted fw-bold small text-uppercase">#</th>
                    <th className="py-3 text-muted fw-bold small text-uppercase cursor-pointer" onClick={() => handleSort("slideshowID")}>
                      ID {sortConfig.key === "slideshowID" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                    <th className="py-3 text-muted fw-bold small text-uppercase">Preview</th>
                    <th className="py-3 text-muted fw-bold small text-uppercase cursor-pointer" onClick={() => handleSort("slideshowTitle")}>
                      Title {sortConfig.key === "slideshowTitle" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                    <th className="py-3 text-muted fw-bold small text-uppercase text-center">Status</th>
                    <th className="py-3 text-muted fw-bold small text-uppercase text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {createdSlideshow.map((slideshow, index) => (
                    <tr key={slideshow.slideshowID} className="border-bottom" style={{ borderColor: 'var(--bs-border-color-translucent)' }}>
                      <td className="ps-4 text-muted small">{indexOfFirstItem + index + 1}</td>
                      <td className="fw-medium text-primary">#{slideshow.slideshowID}</td>
                      <td>
                        <div className="rounded-3 overflow-hidden shadow-sm border" style={{ width: '80px', height: '45px' }}>
                          <img
                            src={`data:image/*;base64,${slideshow.slideshowImage}`}
                            alt="slideshow"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold" style={{ color: 'var(--bs-emphasis-color)' }}>{slideshow.slideshowTitle}</div>
                        <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{slideshow.slideshowDescription}</div>
                      </td>
                      <td className="text-center">
                        <ContentManagementStatusBadge contentStatus={slideshow.slideshowStatus} />
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className={`btn btn-sm ${slideshow.slideshowStatus === 1 ? 'btn-outline-secondary' : 'btn-outline-success'} rounded-pill px-3 d-flex align-items-center gap-2`}
                            onClick={() => handleToggleStatus(slideshow.slideshowID, slideshow.slideshowStatus)}
                          >
                            <i className={`bi ${slideshow.slideshowStatus === 1 ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            <span className="small fw-bold">{slideshow.slideshowStatus === 1 ? "Archive" : "Activate"}</span>
                          </button>
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            onClick={() => handleOpenModalEdit(slideshow)}
                          >
                            <i className="bi bi-pencil text-primary"></i>
                            <span className="small fw-bold">Edit</span>
                          </button>
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            onClick={() => handleDeleteSlideshow(slideshow.slideshowID)}
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
              <i className="bi bi-image text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
              <h5 className="text-muted mt-3">No Visual Assets</h5>
              <p className="text-muted small">Upload high-quality images for your landing page</p>
            </div>
          )}
        </div>

        <div className="card-footer bg-transparent border-0 py-4 px-4 d-flex align-items-center justify-content-between">
          <div className="text-muted small fw-medium">
            Gallery {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, slideshowData.length)} of {slideshowData.length}
          </div>

          <Pagination className="mb-0 custom-premium-pagination">
            <Pagination.Prev
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            />
            <Pagination.Next
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(slideshowData.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(slideshowData.length / itemsPerPage)}
            />
          </Pagination>
        </div>
      </div>

      <ModelComponent
        show={showNewModal || showEditModal}
        onHide={() => { handleCloseNewModal(); handleCloseEditModal(); }}
        title={showNewModal ? "Upload Gallery Asset" : "Modify Asset Details"}
      >
        <div className="p-2">
          <SlideshowForm
            formData={formData}
            previewImage={previewImage}
            handleInputChange={handleInputChange}
            handleImageChange={handleImageChange}
            handleSubmit={showNewModal ? handleNewSlideshow : handleEditSlideshow}
            handleClearForm={handleClearForm}
            isEdit={!showNewModal}
          />
        </div>
      </ModelComponent>

      <style>{`
        .custom-premium-table tbody tr:hover {
            background-color: var(--bs-tertiary-bg) !important;
        }
        .cursor-pointer { cursor: pointer; }
        .custom-premium-pagination .page-link {
            border: none;
            border-radius: 10px;
            margin: 0 3px;
            background: var(--bs-tertiary-bg);
            color: var(--bs-secondary-color);
        }
        .custom-premium-pagination .active .page-link {
            background: #6366f1;
            color: #fff;
        }
      `}</style>
    </div>
  );
}

export default SlideshowManagement;
