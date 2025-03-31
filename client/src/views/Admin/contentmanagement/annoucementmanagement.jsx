import React, { useState, useEffect } from "react";
import { Table, Container, Button, Form, Pagination } from "react-bootstrap";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import LoadingSpinner from "../../../components/LoadingSpinner";
import LargeModelComponent from "../../../components/modal/LargeModelComponent";
import { useLoadingState } from "../../../utils/loadingUtils";
import AnnouncementForm from "../../../components/form/AnnouncementFormComponent";
import { toast } from "react-toastify";
import axios from "../../../utils/axios_configure";
import AnnouncementStatusBadge from "../../../components/AnnouncementStatusBadge";

function AnnouncementManagement() {
  const {
    data: announcementList,
    loading,
    refetch,
  } = useLoadingState("/contentmanagement/get_announcement_data", []);

  // To handle sort function
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
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
  const itemsPerPage = 25;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const createdAnnouncement = sortedAnnouncement.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const [formData, setFormData] = useState({
    announcementId: "",
    announcementTitle: "",
    announcementDesc: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleOpenModalEdit = (slideshow) => {
    setFormData({
      slideshowID: slideshow.slideshowID,
      slideshowImage: slideshow.slideshowImage,
      slideshowTitle: slideshow.slideshowTitle,
      slideshowDesc: slideshow.slideshowDescription,
    });
    setShowEditModal(true);
  };

  // To ensure clear all the data after closing the modal
  const handleCloseNewModal = () => {
    setShowNewModal(false);
    setPreviewImage("");
    setFormData({
      slideshowID: "",
      slideshowImage: "",
      slideshowTitle: "",
      slideshowDesc: "",
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setPreviewImage("");
    setFormData({
      slideshowID: "",
      slideshowImage: "",
      slideshowTitle: "",
      slideshowDesc: "",
    });
  };

  // Handle activated and deactivated announcement status
  const handleToggleStatus = async (announcementId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      // Sending the updated status to the backend
      const response = await axios.post(
        "/contentmanagement/update_announcement_status",
        {
          announcementId,
          announcementStatus: newStatus,
        }
      );

      if (response.data.success) {
        toast.success("Announcement status updated successfully!");
        // Optionally, refresh the data here
        await refetch(); // Call your function to refetch the updated announcement data
      } else {
        toast.error(
          response.data.message || "Failed to update announcement status."
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating announcement status.");
    }
  };

  // Handle New and Edit Submit Function
  const handleNewAnnouncement = async (e) => {
    e.preventDefault();
    const { announcementDesc } = formData;

    // Validate input
    if (!announcementDesc.trim()) {
      toast.error("Announcement description is required.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("announcementDesc", announcementDesc);

    try {
      const response = await axios.post(
        "/contentmanagement/add_announcement",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        // Reset the form
        setFormData({
          announcementDesc: "",
        });

        toast.success(
          response.data.message || "Announcement added successfully!"
        );
        handleCloseModalAddAnnouncement();

        // Refresh the announcements list
        await refetch();
      } else {
        toast.error(
          response.data.message ||
            "Failed to add announcement. Please try again."
        );
      }
    } catch (error) {
      console.error("Add announcement error:", error);
      toast.error(
        error.response?.data?.message || "Failed to add announcement"
      );
    }
  };

  const handleEditAnnouncement = async (e) => {
    e.preventDefault();
  };

  return (
    <>
      <PageTitleBreadcrumb
        title="Announcement Management"
        path={location.pathname}
        isAddNew={true}
        onclickToggle={() => setShowNewModal(true)}
        btnTitle="Add New Announcement"
      ></PageTitleBreadcrumb>
      <div className="m-4 card px-3">
        <section className="px-1 py-4">
          {loading ? (
            <LoadingSpinner text="Loading announcement list..." />
          ) : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr className="text-center">
                    <th style={{ width: "50px" }}>#</th>
                    <th
                      onClick={() => handleSort("announcementID")}
                      style={{ width: "180px", cursor: "pointer" }}
                    >
                      AnnouncementID{" "}
                      {sortConfig.key === "announcementID"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : ""}
                    </th>
                    <th style={{ cursor: "pointer" }}>Description </th>
                    <th
                      style={{ width: "200px", cursor: "pointer" }}
                      onClick={() => handleSort("announcementStatus")}
                    >
                      Status{" "}
                      {sortConfig.key === "announcementStatus"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : ""}
                    </th>
                    <th style={{ width: "320px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {createdAnnouncement.map((announcement, index) => (
                    <tr key={announcement.announcementID}>
                      <td>{index + 1}</td>
                      <td>{announcement.announcementID}</td>
                      <td>{announcement.announcementDescription}</td>
                      <td className="text-center">
                        <AnnouncementStatusBadge
                          announcementStatus={announcement.announcementStatus}
                        />
                      </td>
                      <td>
                        <Button
                          variant={
                            announcement.announcementStatus === 1
                              ? "danger"
                              : "success"
                          } // Red for active, green for inactive
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(
                              announcement.announcementID,
                              announcement.announcementStatus
                            )
                          }
                        >
                          <i
                            className={`bi ${
                              announcement.announcementStatus === 1
                                ? "bi-ban"
                                : "bi-check-circle"
                            }`}
                          ></i>
                          &nbsp;
                          {announcement.announcementStatus === 1
                            ? "Deactivate"
                            : "Activate"}
                        </Button>{" "}
                        &nbsp;
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleOpenModalEdit(announcement)}
                        >
                          <i className="bi bi-pencil"></i>&nbsp; Edit
                        </Button>{" "}
                        &nbsp;
                        <Button variant="danger" size="sm" onClick={() => null}>
                          <i className="bi bi-trash"></i>&nbsp; Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <br />
              <Pagination className="d-flex justify-content-end">
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                />

                {currentPage > 3 && <Pagination.Ellipsis disabled />}

                {Array.from({
                  length: Math.ceil(announcementList.length / itemsPerPage),
                })
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(
                      currentPage + 2,
                      Math.ceil(announcementList.length / itemsPerPage)
                    )
                  )
                  .map((_, pageIndex) => (
                    <Pagination.Item
                      key={pageIndex + 1}
                      active={pageIndex + 1 === currentPage}
                      onClick={() => setCurrentPage(pageIndex + 1)}
                    >
                      {pageIndex + 1}
                    </Pagination.Item>
                  ))}

                {currentPage <
                  Math.ceil(announcementList.length / itemsPerPage) - 2 && (
                  <Pagination.Ellipsis disabled />
                )}

                <Pagination.Next
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(announcementList.length / itemsPerPage)
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(announcementList.length / itemsPerPage)
                  }
                />
                <Pagination.Last
                  onClick={() =>
                    setCurrentPage(
                      Math.ceil(announcementList.length / itemsPerPage)
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(announcementList.length / itemsPerPage)
                  }
                />
              </Pagination>
            </>
          )}
          ;
        </section>
      </div>

      <LargeModelComponent
        show={showNewModal || showEditModal}
        onHide={() => {
          handleCloseNewModal();
          handleCloseEditModal();
        }}
        title={showNewModal ? "Add New Announcement" : "Edit Announcement"}
      >
        <AnnouncementForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={
            showNewModal ? handleNewAnnouncement : handleEditAnnouncement
          }
          isEdit={!showNewModal}
        />
      </LargeModelComponent>
    </>
  );
}

export default AnnouncementManagement;
