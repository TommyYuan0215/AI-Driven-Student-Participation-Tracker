import React from "react";
import { Container, Form, Button } from "react-bootstrap";

function UserFormModal({
  formData,
  setFormData,
  handleSubmit,
  handleClearForm,
  isEdit = "False",
}) {
  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Form.Group
          className="mb-3"
          style={{ display: isEdit ? "block" : "none" }}
        >
          <Form.Label>User ID</Form.Label>
          <Form.Control
            type="text"
            name="userId"
            value={formData.userId}
            disabled
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="userName"
            value={formData.userName}
            onChange={(e) =>
              setFormData({
                ...formData,
                userName: e.target.value.trim(),
              })
            }
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="userEmail"
            value={formData.userEmail}
            onChange={(e) =>
              setFormData({
                ...formData,
                userEmail: e.target.value.trim(),
              })
            }
            required
          />
        </Form.Group>
        <br />
        <Form.Group className="mb-3 d-flex justify-content-around">
          <Button
            variant="success"
            type="submit"
            disabled={!formData.userName || !formData.userEmail}
          >
            <i className="bi bi-save"></i> &nbsp; {isEdit ? "Update" : "Save"}
          </Button>
          <Button variant="secondary" onClick={handleClearForm} type="button">
            <i className="bi bi-arrow-counterclockwise"></i> &nbsp; Reset
          </Button>
        </Form.Group>
      </Form>
    </Container>
  );
}

export default UserFormModal;
