import React from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import LoadingSpinner from "../components/common/LoadingSpinnerComponent";
import { useLoadingState } from "../hooks/useLoadingState";
import landingContent from "../data/landingContent.json";

function Home({ setModalType }) {
  const { data: slideshowData, loading } = useLoadingState(
    "/contentmanagement/get_slideshow_data",
    []
  );

  const { hero, metrics, features } = landingContent;

  return (
    <div className="overflow-hidden">
      {/* Futuristic Hero Section */}
      <section className="position-relative vh-100 d-flex align-items-center justify-content-center overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100 hero-neural-bg"></div>
        <div className="position-absolute top-0 start-0 w-100 h-100 hero-gradient-overlay"></div>

        <Container className="position-relative text-center z-10">
          <Badge bg="primary" className="mb-4 px-3 py-2 rounded-pill shadow-lg animate-fade-in hero-badge-pill">
            <i className="bi bi-stars me-2"></i>{hero.badge}
          </Badge>
          <h1 className="display-1 fw-black text-white mb-4 animate-slide-up hero-title">
            {hero.titlePrefix}<span className="text-gradient-hero">{hero.titleSuffix}</span>
          </h1>
          <p className="lead text-white opacity-75 mb-5 mx-auto animate-slide-up-delayed hero-subtitle">
            {hero.subtitle}
          </p>
          <div className="d-flex align-items-center justify-content-center gap-3 animate-slide-up-delayed-more">
            <button
              className="btn-modern-primary"
              onClick={() => setModalType("login")}
            >
              {hero.primaryBtn}
            </button>
            <button className="btn-modern-outline">{hero.secondaryBtn}</button>
          </div>
        </Container>
      </section>

      {/* Trust & Metrics Section */}
      <section className="py-5 bg-tertiary">
        <Container>
          <div className="row g-4 text-center">
            {metrics.map((metric, index) => (
              <div key={index} className="col-md-4">
                <h2 className="fw-black mb-0 display-4 text-primary">{metric.value}</h2>
                <p className="text-muted small fw-bold">{metric.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Key Features with 3D Elevation */}
      <section className="py-5 bg-body">
        <Container className="py-5">
          <div className="text-center mb-5">
            <h6 className="text-primary fw-bold text-uppercase mb-3 letter-spacing-3">{features.sectionBadge}</h6>
            <h2 className="display-5 fw-black text-emphasis">{features.sectionTitle}</h2>
          </div>
          <Row className="g-4">
            {features.cards.map((card, index) => (
              <Col key={index} md={3}>
                <div className="feature-3d-card h-100 p-4 rounded-4 shadow-lg transition-all d-flex flex-column">
                  <div className="feature-icon-box mb-4 d-flex align-items-center justify-content-center shadow-sm" style={{ background: card.gradient }}>
                    <i className={`${card.icon} fs-4`}></i>
                  </div>
                  <h4 className="fw-bold mb-3 text-emphasis">{card.title}</h4>
                  <p className="text-muted small mb-0 lh-lg">{card.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Dynamic Slideshow Section */}
      {slideshowData && Array.isArray(slideshowData) && slideshowData.length > 0 && (
        <section className="py-5 bg-tertiary">
          <Container className="py-5">
            <div className="text-center mb-5">
              <h6 className="text-primary fw-bold text-uppercase mb-3 letter-spacing-3">System Updates</h6>
              <h2 className="display-5 fw-black text-emphasis">Platform Evolution</h2>
            </div>
            
            <div className="slideshow-wrapper-modern p-2 rounded-4 shadow-lg">
              <div className="carousel slide carousel-fade rounded-4 overflow-hidden" id="homeSlideshow" data-bs-ride="carousel">
                <div className="carousel-inner">
                  {slideshowData
                    .filter(slide => Number(slide.slideshowStatus) !== 0)
                    .map((slide, index) => (
                    <div key={slide.slideshowID} className={`carousel-item h-500 ${index === 0 ? 'active' : ''}`}>
                      <img 
                        src={`data:image/jpeg;base64,${slide.slideshowImage}`} 
                        className="d-block w-100 h-100 slideshow-item-img" 
                        alt={slide.slideshowTitle} 
                      />
                      <div className="carousel-caption d-none d-md-block text-start p-4 rounded-4 slideshow-caption-glass">
                        <h4 className="fw-bold text-white mb-2">{slide.slideshowTitle}</h4>
                        <p className="small text-white opacity-75 mb-0">{slide.slideshowDescription}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#homeSlideshow" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#homeSlideshow" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </Container>
        </section>
      )}

    </div>
  );
}

export default Home;
