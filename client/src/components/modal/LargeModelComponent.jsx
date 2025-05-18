import { Modal } from "react-bootstrap";
import "./ModalStyles.css";

function LargeModelComponent(props) {
  const { title, children, ...restProps } = props;

  return (
    <Modal
      {...restProps}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      className="modal-lg"
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

export default LargeModelComponent;
