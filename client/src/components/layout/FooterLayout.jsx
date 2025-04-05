import React from "react";
import "../../App.css"; // Import the relevant CSS file

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Social Media Links */}
        <div className="card_parent row d-flex justify-content-center g-4">
          <div className="col-md-4">
            <ul>
              <p>Follow Me</p>
              <a
                href="https://www.facebook.com/tanjunlin0215"
                className="social-media"
              >
                <i className="bi-facebook"></i>
              </a>
              <a
                href="https://www.instagram.com/tanjunlin0215/"
                className="social-media"
              >
                <i className="bi-instagram"></i>
              </a>
              <a
                href="https://www.linkedin.com/in/tanjunlin0215/"
                className="social-media"
              >
                <i className="bi-linkedin"></i>
              </a>
              <a href="https://wa.me/60138020376" className="social-media">
                <i className="bi-whatsapp"></i>
              </a>
              <a
                href="https://github.com/TommyYuan0215"
                className="social-media"
              >
                <i className="bi-github"></i>
              </a>
            </ul>
          </div>

          {/* Contact Us Section */}
          <div className="col-md-4">
            <ul>
              <p>Any inquiries? Feel free to Contact Me</p>
              <li>
                <a href="mailto:tanjunlin0215@outlook.com">
                  tanjunlin0215@outlook.com
                </a>
                <br />
                <a href="mailto:tanjunlin0215@student.usm.my">
                  tanjunlin0215@student.usm.my
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr />

        {/* Copyright Section */}
        <div className="row">
          <h6 className="copyright">Copyright © Jun Lin's FYP 2024/2025</h6>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
