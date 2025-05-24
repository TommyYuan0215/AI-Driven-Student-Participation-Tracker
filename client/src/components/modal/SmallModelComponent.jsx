import { Modal } from "react-bootstrap";
import "./ModalStyles.css";

function SmallModelComponent(props) {
  const { title, children, ...restProps } = props;

  return (
    <Modal
      {...restProps}
      size="sm"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      className="modal-sm"
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {children} {/* Render the passed content dynamically */}
      </Modal.Body>
    </Modal>
  );
}

export default SmallModelComponent;
