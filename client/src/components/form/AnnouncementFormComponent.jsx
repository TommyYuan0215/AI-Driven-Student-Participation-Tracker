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
      {isEdit && (
        <Form.Control
          type="hidden"
          name="announcementId"
          value={formData.announcementId}
        />
      )}

      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          name="announcementDesc"
          value={formData.announcementDesc}
          onChange={handleInputChange}
        />
      </Form.Group>
      <Form.Group className="mb-3 d-flex justify-content-around">
        <Button className="ms-5 me-3" variant="success" type="submit">
          <i className="bi bi-save"></i> &nbsp;
          {isEdit ? "Update Announcement" : "Add Announcement"}
        </Button>
        <Button className="ms-3 me-5" variant="secondary" type="button">
          <i className="bi bi-arrow-counterclockwise"></i> &nbsp; Reset Form
        </Button>
      </Form.Group>
    </Form>
  );
}

export default AnnouncementForm;
