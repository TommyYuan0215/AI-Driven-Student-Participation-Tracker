import { Modal } from "react-bootstrap";
import "./ModalStyles.css";

function ModelComponent(props) {
  const { children, onHide, ...restProps } = props;

  return (
    <Modal
      {...restProps}
      size="md"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      onHide={onHide}
    >
      <Modal.Body className="notranslate">
        <div className="back-button" onClick={onHide}>
          <i className="bi bi-arrow-left"></i>
          <span>Back</span>
        </div>
        {children} {/* Render the passed content dynamically */}
      </Modal.Body>
    </Modal>
  );
}

export default ModelComponent;
