import React from 'react';
import { Container, Card, Carousel, Row, Col, Spinner } from 'react-bootstrap';
import Slideshow from '../components/CarouselComponent';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLoadingState } from '../utils/loadingUtils';

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
  const { data: slideshowData, loading } = useLoadingState('/contentmanagement/get_slideshow_data', []);

  return(
    <div>
      <section>
            {loading ? (
                <LoadingSpinner text='Loading slideshow data...' />
            ) : slideshowData.length > 0 && (
                <Carousel>
                    {slideshowData.map((slide) => (
                        <Carousel.Item key={slide.slideshowID}>
                            <Slideshow 
                                imageUrl={`data:image/jpeg;base64,${slide.slideshowImage}`} 
                            />
                            <Carousel.Caption>
                                <h3>{slide.slideshowTitle}</h3>
                                <p>{slide.slideshowDescription}</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                    ))}
                </Carousel>
            )}
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