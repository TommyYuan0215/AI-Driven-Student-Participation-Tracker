import React from 'react';
import { Container, Card, Carousel, Row, Col } from 'react-bootstrap';
import Slideshow from '../components/CarouselComponent';
import carouselImages from '../utils/imageUtils';


// Card data array
const cardData = [
  {
    title: "Real-time Tracking",
    description: "Monitor student participation in real-time with our advanced AI system",
    icon: "📊"
  },
  {
    title: "Data Analytics",
    description: "Comprehensive analytics and insights for better decision making",
    icon: "📈"
  },
  {
    title: "Smart Reports",
    description: "Automated reporting system with detailed student engagement metrics",
    icon: "📝"
  },
  {
    title: "AI Integration",
    description: "Seamless integration with existing educational platforms",
    icon: "🤖"
  }
];

function Home() {
    return(
      <div>
        <section>
        <Carousel>
            {carouselImages.map((image, index) => (
              <Carousel.Item key={index}>
                <Slideshow 
                  text={image.title} 
                  imageUrl={image.url} 
                />
                <Carousel.Caption>
                  <h3>{image.title}</h3>
                  <p>{image.description}</p>
                </Carousel.Caption>
              </Carousel.Item>
            ))}
          </Carousel>
        </section>

        <section className="bg-light py-5">
          <h3 className='p-3 text-center'>Key Features</h3>
          <Container>
          <Row>
            {cardData.map((card, index) => (
              <Col key={index} md={3} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center d-flex flex-column justify-content-center">
                  <div className="card-icon mb-4">
                    {card.icon}
                  </div>
                  <Card.Title className="mb-3">{card.title}</Card.Title>
                  <Card.Text>
                    {card.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            ))}
          </Row>
          </Container>
        </section>
      </div>    
    );
}

export default Home;