import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import ModelComponent from "../../components/XLargeModelComponent";
import axios from '../../utils/axios_configure';
import { toast } from 'react-toastify';

function ContentManagement() {
    const [formData, setFormData] = useState({
        slideshowImage: "",
        slideshowTitle: "",
        slideshowDesc: "",
    });
    const [previewImage, setPreviewImage] = useState("");
    const [images, setImages] = useState([]);
    const [slideshowData, setSlideshowData] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Fetch slideshow data from database
    useEffect(() => {
        const fetchSlideshows = async () => {
            try {
                const response = await axios.get('/contentmanagement/get_slideshows');
                if (response.status === 200) {
                    setSlideshowData(response.data.data); // Note: .data.data because of nested response
                }
            } catch (error) {
                toast.error("Failed to fetch slideshows");
                console.error("Error fetching slideshows:", error);
            }
        };
    
        fetchSlideshows();
    }, []);

    const handleDelete = (fileName) => {
        setImages(images.filter(img => img.fileName !== fileName));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validate image size (optional)
          if (file.size > 5 * 1024 * 1024) { // 5MB limit, for example
            toast.error("Image size exceeds the limit of 5MB");
            return;
          }
          // Validate image type (optional)
          const allowedTypes = ['image/jpeg', 'image/png'];
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { slideshowImage, slideshowTitle, slideshowDesc } = formData;

        // Enhanced validation
        const validationErrors = [];
        if (!slideshowTitle) validationErrors.push("Slideshow title is required");
        if (!slideshowDesc) validationErrors.push("Slideshow description is required");
        if (!slideshowImage) validationErrors.push("Slideshow image is required");

        // Check if there are validation errors
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error));
            return; // Stop execution if there are validation errors
        }

        const formDataToSend  = new FormData();
        formDataToSend.append("slideshowTitle", slideshowTitle);
        formDataToSend.append("slideshowDesc", slideshowDesc);
        formDataToSend.append("slideshowImage", slideshowImage);

        try {
            const response = await axios.post('/contentmanagement/add_slideshow', formDataToSend, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            });

            if (response.status === 200) {
                toast.success(response.data.message);

                // Reset form after successful submission
                setFormData({
                    slideshowTitle: '',
                    slideshowDesc: '',
                    slideshowImage: null
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred. Please try again later.";
            toast.error(errorMessage);
        }
    };

    return (
        <>  
            <div className="d-flex justify-content-between align-items-center mb-3 me-3">
                <h2 className="p-3">Content Management Center (Slideshow)</h2>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <i className="bi bi-plus"></i> &nbsp; Add New Slideshow
                </Button>
            </div>
            <Container>
                <section className="py-3">
                    <Row>
                        {Array.isArray(slideshowData) && slideshowData.map((slideshow) => (
                            <Col key={slideshow._id} md={4} className="mb-4">
                                <Card>
                                    <Card.Img 
                                        variant="top" 
                                        src={slideshow.image} // Now directly using the base64 image data
                                        style={{ height: '200px', objectFit: 'cover' }} 
                                    />
                                    <Card.Body>
                                        <Card.Title className="text-center">{slideshow.title}</Card.Title>
                                        <Card.Text className="card">{slideshow.description}</Card.Text>
                                        <div className="d-flex justify-content-between">
                                            <Button 
                                                variant="info"
                                            >
                                                <i className="bi bi-pencil"></i>
                                                &nbsp;
                                                Edit
                                            </Button>

                                            <Button 
                                                variant="danger"
                                                onClick={() => handleDelete(slideshow._id)}
                                            >
                                                <i className="bi bi-trash"></i>
                                                &nbsp;
                                                Delete
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </section>

                {/* Add Image Modal */}
                <ModelComponent
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    title={"Add New Slideshow"}
                >
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <img 
                                src={previewImage}
                                style={{ 
                                    height: "350px", 
                                    width: "100%", 
                                    objectFit: "cover",
                                    borderRadius: '8px',
                                    display: 'block',
                                    backgroundColor: '#f8f9fa'
                                }}
                                alt="Preview Image"
                            />
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
                        <Form.Group className="mb-3 d-flex justify-content-center">
                            <Button className="form-control" variant="success" type="submit">
                                Submit
                            </Button>
                        </Form.Group>
                    </Form>
                </ModelComponent>
            </Container>
        </>
    );
}

export default ContentManagement;