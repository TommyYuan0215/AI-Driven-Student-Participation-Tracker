import React from "react";
import { Form, Button } from "react-bootstrap";

function SlideshowForm({
  formData,
  previewImage,
  handleInputChange,
  handleImageChange,
  handleSubmit,
  isEdit,
}) {
  return (
    <Form onSubmit={handleSubmit}>
      {/* Add hidden input for ID when editing */}
      {isEdit && (
        <Form.Control
          type="hidden"
          name="slideshowId"
          value={formData.slideshowId}
        />
      )}

      <Form.Group className="mb-3 card">
        {previewImage ? (
          <img
            src={previewImage}
            style={{
              height: "350px",
              width: "100%",
              objectFit: "cover",
              borderRadius: "8px",
              display: "block",
              backgroundColor: "#f8f9fa",
            }}
            alt="Preview Image"
          />
        ) : (
          <div
            style={{
              height: "350px",
              width: "100%",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <i className="bi bi-cloud-upload fs-1 text-muted"></i>
            <p className="text-muted mt-2">Upload an image to see preview</p>
          </div>
        )}
      </Form.Group>
      <Form.Group controlId="image" className="mb-3">
        <Form.Label>Image</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          name="slideshowImage"
          onChange={handleImageChange}
        />
      </Form.Group>
      <Form.Group controlId="title" className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          name="slideshowTitle"
          value={formData.slideshowTitle}
          onChange={handleInputChange}
        />
      </Form.Group>
      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          name="slideshowDesc"
          value={formData.slideshowDesc}
          onChange={handleInputChange}
        />
      </Form.Group>
      <Form.Group className="mb-3 d-flex justify-content-around">
        <Button className="ms-5 me-3" variant="success" type="submit">
          <i className="bi bi-save"></i> &nbsp;
          {isEdit ? "Update Slideshow" : "Upload Slideshow"}
        </Button>
        <Button className="ms-3 me-5" variant="secondary" type="button">
          <i className="bi bi-arrow-counterclockwise"></i> &nbsp; Reset Form
        </Button>
      </Form.Group>
    </Form>
  );
}

export default SlideshowForm;
