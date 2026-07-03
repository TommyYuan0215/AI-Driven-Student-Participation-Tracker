import React from "react";
import "../../App.css"; // Import the relevant CSS file

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-modern py-5 mt-auto">
      <div className="container">
        <div className="row g-5">
          {/* Brand Section */}
          <div className="col-lg-4 col-md-12 text-center text-lg-start">
            <div className="d-flex align-items-center justify-content-center justify-content-lg-start gap-2 mb-3">
              <img src="/Header_Icon.png" alt="logo" className="footer-logo-img" />
              <h4 className="fw-black text-white mb-0 text-ls-neg-1">
                Focus<span className="text-primary">Track</span>
              </h4>
            </div>
            <p className="text-white opacity-50 small pe-lg-4 lh-lg">
              Empowering academic excellence through intelligent engagement analytics and real-time behavioral insights. 
              Built for the future of digital education.
            </p>
          </div>

          {/* Social Presence */}
          <div className="col-lg-4 col-md-6 text-center">
            <h6 className="text-white fw-bold text-uppercase-ls-2 mb-4">Digital Presence</h6>
            <div className="d-flex justify-content-center gap-2">
              {[
                { icon: 'facebook', url: 'https://www.facebook.com/tanjunlin0215' },
                { icon: 'instagram', url: 'https://www.instagram.com/tanjunlin0215/' },
                { icon: 'linkedin', url: 'https://www.linkedin.com/in/tanjunlin0215/' },
                { icon: 'whatsapp', url: 'https://wa.me/60138020376' },
                { icon: 'github', url: 'https://github.com/TommyYuan0215' }
              ].map((social) => (
                <a 
                  key={social.icon}
                  href={social.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="social-icon-box shadow-sm"
                >
                  <i className={`bi bi-${social.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Portal */}
          <div className="col-lg-4 col-md-6 text-center text-lg-end">
            <h6 className="text-white fw-bold text-uppercase-ls-2 mb-4">Contact Portal</h6>
            <div className="d-flex flex-column gap-2 align-items-center align-items-lg-end">
              <a href="mailto:tanjunlin0215@outlook.com" className="contact-link small">
                <i className="bi bi-envelope-fill me-2 text-primary"></i>
                tanjunlin0215@outlook.com
              </a>
              <a href="mailto:tanjunlin0215@student.usm.my" className="contact-link small">
                <i className="bi bi-mortarboard-fill me-2 text-primary"></i>
                tanjunlin0215@student.usm.my
              </a>
            </div>
          </div>
        </div>

        <div className="border-top border-white border-opacity-10 mt-5 pt-4 text-center">
          <p className="small mb-0 text-white opacity-25 fw-medium">
            Copyright &copy; {currentYear} Jun Lin's FYP. All Rights Reserved.
          </p>
        </div>
      </div>

    </footer>
  );
}

export default Footer;
