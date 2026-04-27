import React from "react";
import { Container, Form, Button } from "react-bootstrap";

function UserFormModal({
  formData,
  setFormData,
  handleSubmit,
  handleClearForm,
  isEdit = false,
}) {
  return (
    <Container className="px-0">
      <Form onSubmit={handleSubmit} className="px-1">
        {formData.userId && (
          <div className="p-3 rounded-4 mb-4" style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)' }}>
            <div className="small text-muted fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>Database Identifier</div>
            <div className="fw-black text-primary fs-5">#{formData.userId}</div>
          </div>
        )}

        <Form.Group className="mb-4">
          <Form.Label className="small fw-bold text-muted ps-2 mb-2">Display Name</Form.Label>
          <div className="position-relative">
            <i className="bi bi-person position-absolute top-50 start-0 translate-middle-y ms-3 text-primary opacity-50"></i>
            <Form.Control
              type="text"
              placeholder="e.g. John Doe"
              className="rounded-pill border-0 shadow-sm ps-5 py-3"
              style={{ background: 'var(--bs-tertiary-bg)' }}
              value={formData.userName}
              onChange={(e) => setFormData({...formData, userName: e.target.value})}
              required
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="small fw-bold text-muted ps-2 mb-2">Official Email Address</Form.Label>
          <div className="position-relative">
            <i className="bi bi-envelope position-absolute top-50 start-0 translate-middle-y ms-3 text-primary opacity-50"></i>
            <Form.Control
              type="email"
              placeholder="name@focustrack.edu"
              className="rounded-pill border-0 shadow-sm ps-5 py-3"
              style={{ background: 'var(--bs-tertiary-bg)' }}
              value={formData.userEmail}
              onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
              required
            />
          </div>
        </Form.Group>

        <div className="d-flex gap-3 mt-5">
          <Button
            variant="primary"
            type="submit"
            className="rounded-pill flex-fill py-3 fw-bold shadow-sm"
            disabled={!formData.userName || !formData.userEmail}
          >
            <i className={`bi ${formData.userId ? 'bi-check2-circle' : 'bi-plus-lg'} me-2`}></i>
            {formData.userId ? "Update Profile" : "Register Account"}
          </Button>
          <Button 
            variant="light" 
            onClick={handleClearForm} 
            className="rounded-pill px-4 py-3 fw-bold border"
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>
            Reset
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default UserFormModal;
