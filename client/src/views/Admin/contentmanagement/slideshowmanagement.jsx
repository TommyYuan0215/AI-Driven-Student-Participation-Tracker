import React, { useState } from "react";
import { Row, Col, Card, Button, Pagination } from "react-bootstrap";
import ModelComponent from "../../../components/modal/XLargeModelComponent";
import LoadingSpinner from "../../../components/LoadingSpinner";
import SlideshowForm from "../../../components/form/SlideshowFormComponent";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumb";
import axios from "../../../utils/axios_configure";
import { toast } from "react-toastify";
import { useLoadingState } from "../../../utils/loadingUtils";

function SlideshowManagement() {
  const {
    data: slideshowData,
    loading,
    refetch,
  } = useLoadingState("/contentmanagement/get_slideshow_data", []);

  const [formData, setFormData] = useState({
    slideshowId: "",
    slideshowImage: "",
    slideshowTitle: "",
    slideshowDesc: "",
  });

  const [previewImage, setPreviewImage] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
    if (!window.confirm("Are you sure you want to delete this slideshow?"))
      return;

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

  // Pagination logic
  const totalPages = Math.ceil(slideshowData.length / itemsPerPage);

  // Pagination controls
  const getPaginationItems = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
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
          ) : (
            <Row>
              {slideshowData.length > 0 ? (
                slideshowData
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((slideshow) => (
                    <Col key={slideshow.slideshowId} md={3} className="mb-3">
                      <Card>
                        <Card.Img
                          variant="top"
                          src={`data:image/*;base64,${slideshow.slideshowImage}`}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                        <Card.Body>
                          <Card.Title className="text-center">
                            {slideshow.slideshowTitle}
                          </Card.Title>
                          <Card.Text className="card">
                            {slideshow.slideshowDescription}
                          </Card.Text>
                          <div className="d-flex justify-content-between">
                            <Button
                              variant="info"
                              onClick={() => handleOpenModalEdit(slideshow)}
                            >
                              <i className="bi bi-pencil"></i>
                              &nbsp; Edit
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() =>
                                handleDeleteSlideshow(slideshow.slideshowId)
                              }
                            >
                              <i className="bi bi-trash"></i>
                              &nbsp; Delete
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
              ) : (
                <Col className="md-12">
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "calc(100vh - 250px)" }}
                  >
                    <div className="text-center">
                      <i className="bi bi-calendar-x text-muted fs-1"></i>
                      <h3 className="text-muted mt-3">
                        No slideshows available
                      </h3>
                      <p className="text-muted">
                        Click the add button to create a new slideshow.
                      </p>
                    </div>
                  </div>
                </Col>
              )}
            </Row>
          )}
        </section>

        <Pagination className="d-flex justify-content-end">
          <Pagination.First
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          />

          {/* Conditionally display ellipsis */}
          {currentPage > 3 && <Pagination.Ellipsis disabled />}

          {/* Loop through page numbers to display pagination items */}
          {getPaginationItems().map((pageIndex) => (
            <Pagination.Item
              key={pageIndex}
              active={pageIndex === currentPage}
              onClick={() => setCurrentPage(pageIndex)}
            >
              {pageIndex}
            </Pagination.Item>
          ))}

          {currentPage < totalPages - 2 && <Pagination.Ellipsis disabled />}

          <Pagination.Next
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
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
