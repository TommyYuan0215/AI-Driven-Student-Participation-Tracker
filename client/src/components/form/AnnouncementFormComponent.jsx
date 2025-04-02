import React from "react";
import { Form, Button } from "react-bootstrap";

function AnnouncementForm({
  formData,
  handleInputChange,
  handleSubmit,
  isEdit,
}) {
  return (
    <Form onSubmit={handleSubmit}>
      {/* Add hidden input for ID when editing */}
      <Form.Group
        className="mb-3"
        style={{ display: isEdit ? "block" : "none" }}
      >
        <Form.Label>Announcement ID</Form.Label>
        <Form.Control
          type="text"
          name="announcementId"
          value={formData.announcementId}
          disabled
        />
      </Form.Group>

      <Form.Group controlId="title" className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          name="announcementTitle"
          value={formData.announcementTitle}
          onChange={handleInputChange}
        />
      </Form.Group>

      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          name="announcementDesc"
          value={formData.announcementDesc}
          onChange={handleInputChange}
          rows={15}
        />
      </Form.Group>
      <br />
      <Form.Group className="mb-3 d-flex justify-content-around">
        <Button className="ms-5 me-3" variant="success" type="submit">
          <i className="bi bi-save"></i> &nbsp;
          {isEdit ? "Update Announcement" : "Add Announcement"}
        </Button>
      </Form.Group>
    </Form>
  );
}

export default AnnouncementForm;
