import { Modal } from 'react-bootstrap';

function ModelComponent(props) {
    const { title, children, ...restProps } = props;

    return (
        <Modal
            {...restProps}
            size="xl"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton></Modal.Header>
            <Modal.Body>
                {children} {/* Render the passed content dynamically */}
            </Modal.Body>
        </Modal>
    );
}

export default ModelComponent;
