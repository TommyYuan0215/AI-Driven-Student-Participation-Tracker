import React, { useState } from "react";
import { Table, Button, Pagination } from "react-bootstrap";
import ModelComponent from "../../../components/modal/XLargeModelComponent";
import LoadingSpinner from "../../../components/common/LoadingSpinnerComponent";
import SlideshowForm from "../../../components/form/SlideshowForm";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import axios from "../../../utils/axiosUtils";
import { toast } from "react-toastify";
import { useLoadingState } from "../../../hooks/useLoadingState";

function SlideshowManagement() {
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
  const itemsPerPage = 25;
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
      // Validate image size (optional)
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit, for example
        toast.error("Image size exceeds the limit of 5MB");
        return;
      }
      // Validate image type (optional)
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

  // Add clear form handler
  const handleClearForm = (e) => {
    e.preventDefault();
    setFormData({
      slideshowImage: "",
      slideshowTitle: "",
      slideshowDesc: "",
    });
    toast.info("Form has been reset to original values");
  };

  const handleNewSlideshow = async (e) => {
    e.preventDefault();

    const { slideshowImage, slideshowTitle, slideshowDesc } = formData;

    // Enhanced frontend validation
    const validationErrors = [];
    if (!slideshowTitle) validationErrors.push("Slideshow title is required");
    if (!slideshowDesc)
      validationErrors.push("Slideshow description is required");
    if (!slideshowImage) validationErrors.push("Slideshow image is required");

    // Check if there are validation errors
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return; // Stop execution if there are validation errors
    }

    const formDataToSend = new FormData();
    formDataToSend.append("slideshowTitle", slideshowTitle);
    formDataToSend.append("slideshowDesc", slideshowDesc);
    formDataToSend.append("slideshowImage", slideshowImage);

    try {
      const response = await axios.post(
        "/contentmanagement/add_slideshow",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        // Reset form data
        setFormData({
          slideshowTitle: "",
          slideshowDesc: "",
          slideshowImage: null,
        });

        setPreviewImage("");

        // Refetch the data and close the modal
        await refetch();
        setShowNewModal(false);

        // Finally show success message
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to add slideshow");
      }
    } catch (error) {
      console.error("Add slideshow error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred. Please try again later.";
      toast.error(errorMessage);
      // Reopen modal if there's an error
      setShowNewModal(true);
    }
  };

  const handleEditSlideshow = async (e) => {
    e.preventDefault();

    const { slideshowId, slideshowImage, slideshowTitle, slideshowDesc } =
      formData;

    // Enhanced validation
    const validationErrors = [];
    if (!slideshowTitle) validationErrors.push("Slideshow title is required");
    if (!slideshowDesc)
      validationErrors.push("Slideshow description is required");
    if (!slideshowImage) validationErrors.push("Slideshow image is required");

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("slideshowId", slideshowId);
    formDataToSend.append("slideshowTitle", slideshowTitle);
    formDataToSend.append("slideshowDesc", slideshowDesc);
    formDataToSend.append("slideshowImage", slideshowImage);

    try {
      const response = await axios.post(
        "/contentmanagement/edit_slideshow",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        setFormData({
          slideshowId: "",
          slideshowTitle: "",
          slideshowDesc: "",
          slideshowImage: null,
        });
        setPreviewImage("");

        await refetch();
        setShowEditModal(false);

        toast.success(response.data.message);
      } else {
        toast.error(
          response.data.message ||
            "Failed to update slideshow. Please try again later."
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred. Please try again later.";
      toast.error(errorMessage);
      // Reopen modal if there's an error
      setShowEditModal(true);
    }
  };

  const handleDeleteSlideshow = async (id) => {
    if (!window.confirm(`Are you sure you want to delete ${id} slideshow?`)) {
      return;
    }

    try {
      const response = await axios.post("/contentmanagement/delete_slideshow", {
        slideshowId: id,
      });

      if (response.status === 200) {
        await refetch();
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to delete slideshow");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred. Please try again later.";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <PageTitleBreadcrumb
        title="Slideshow Management"
        path={location.pathname}
        isAddNew={true}
        onclickToggle={() => setShowNewModal(true)}
        btnTitle="Add New Slideshow"
      />
      <div className="m-4 card px-3">
        <section className="px-1 py-4">
          {loading ? (
            <LoadingSpinner text="Loading slideshows..." />
          ) : slideshowData.length > 0 ? (
            <>
              <Table
                striped
                bordered
                hover
                responsive
                className="align-middle"
              >
                <thead className="table-light">
                  <tr className="text-center">
                    <th style={{ width: "50px" }}>#</th>
                    <th
                      onClick={() => handleSort("slideshowID")}
                      style={{ width: "100px", cursor: "pointer" }}
                    >
                      ID{" "}
                      {sortConfig.key === "slideshowID"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </th>
                    <th style={{ width: "200px" }}>Image</th>
                    <th
                      onClick={() => handleSort("slideshowTitle")}
                      style={{ width: "180px", cursor: "pointer" }}
                    >
                      Title{" "}
                      {sortConfig.key === "slideshowTitle"
                        ? sortConfig.direction === "asc"
                          ? "🔼"
                          : "🔽"
                        : "↕️"}
                    </th>
                    <th>Description</th>
                    <th className="text-center" style={{ width: "180px" }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {createdSlideshow.map((slideshow, index) => (
                    <tr key={slideshow.slideshowID}>
                      <td>{index + 1}</td>
                      <td>{slideshow.slideshowID}</td>
                      <td>
                        <img
                          src={`data:image/*;base64,${slideshow.slideshowImage}`}
                          alt="slideshow"
                          style={{
                            width: "100%",
                            maxHeight: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      </td>
                      <td>{slideshow.slideshowTitle}</td>
                      <td>{slideshow.slideshowDescription}</td>
                      <td className="text-center">
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenModalEdit(slideshow)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleDeleteSlideshow(slideshow.slideshowID)
                          }
                        >
                          <i className="bi bi-trash"></i> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "calc(100vh - 250px)" }}
            >
              <div className="text-center">
                <i className="bi bi-calendar-x text-muted fs-1"></i>
                <h3 className="text-muted mt-3">No slideshows available</h3>
                <p className="text-muted">
                  Click the add button to create a new slideshow.
                </p>
              </div>
            </div>
          )}
        </section>

        <br />

        <Pagination className="d-flex justify-content-end">
          <Pagination.First
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          />

          {currentPage > 3 && <Pagination.Ellipsis disabled />}

          {Array.from({
            length: Math.ceil(slideshowData.length / itemsPerPage),
          })
            .slice(
              Math.max(0, currentPage - 3),
              Math.min(
                currentPage + 2,
                Math.ceil(slideshowData.length / itemsPerPage)
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

          {currentPage < Math.ceil(slideshowData.length / itemsPerPage) - 2 && (
            <Pagination.Ellipsis disabled />
          )}

          <Pagination.Next
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(
                  prev + 1,
                  Math.ceil(slideshowData.length / itemsPerPage)
                )
              )
            }
            disabled={
              currentPage === Math.ceil(slideshowData.length / itemsPerPage)
            }
          />
          <Pagination.Last
            onClick={() =>
              setCurrentPage(Math.ceil(slideshowData.length / itemsPerPage))
            }
            disabled={
              currentPage === Math.ceil(slideshowData.length / itemsPerPage)
            }
          />
        </Pagination>

        {/* Add and Edit Image Modals */}
        <ModelComponent
          show={showNewModal || showEditModal}
          onHide={() => {
            handleCloseNewModal();
            handleCloseEditModal();
          }}
          title={showNewModal ? "Add New Slideshow" : "Edit Slideshow"}
        >
          <SlideshowForm
            formData={formData}
            previewImage={previewImage}
            handleInputChange={handleInputChange}
            handleImageChange={handleImageChange}
            handleSubmit={
              showNewModal ? handleNewSlideshow : handleEditSlideshow
            }
            handleClearForm={handleClearForm}
            isEdit={!showNewModal}
          />
        </ModelComponent>
      </div>
    </>
  );
}

export default SlideshowManagement;
