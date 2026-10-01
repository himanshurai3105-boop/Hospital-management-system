import { Link } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import Gallery from "../components/Gallery";
import Testimonials from "../components/Testimonials";

const Home = () => {
  return (
    <>
      <PublicNavbar />

      {/* Hero Section */}
      <section className="hero-gradient text-white py-5">
        <div className="container text-center py-5 position-relative">
          <div className="floating-3d-icon mb-3" style={{ fontSize: "5rem" }}>
            🏥
          </div>
          <span className="badge bg-white text-primary px-3 py-2 rounded-pill mb-3 fw-semibold">
            ✨ Trusted by 10,000+ Patients
          </span>
          <h1 className="display-3 fw-bold mb-3">
            Your Health, <br />
            <span style={{ color: "#ffd60a" }}>Our Priority</span>
          </h1>
          <p className="lead mb-4 mx-auto" style={{ maxWidth: "600px", opacity: 0.9 }}>
            Book appointments with trusted doctors, manage your medical visits,
            and get quality care — all in one seamless platform.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/signup" className="btn btn-light btn-lg btn-glow px-4 fw-semibold">
              Book an Appointment →
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg px-4">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-5 border-bottom">
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-6 col-md-3">
              <div className="stat-number">15+</div>
              <p className="text-muted mb-0">Expert Doctors</p>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-number">10K+</div>
              <p className="text-muted mb-0">Happy Patients</p>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-number">8+</div>
              <p className="text-muted mb-0">Specializations</p>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-number">24/7</div>
              <p className="text-muted mb-0">Online Booking</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-5">
        <div className="text-center mb-5">
          <span className="text-primary fw-semibold text-uppercase" style={{ letterSpacing: "1px" }}>
            Our Services
          </span>
          <h2 className="fw-bold mt-2">Why Choose CityCare</h2>
          <p className="text-muted">Everything you need for hassle-free healthcare management</p>
        </div>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card feature-card tilt-card h-100 shadow-sm text-center p-4">
              <div className="feature-icon">👨‍⚕️</div>
              <h5 className="mt-3 fw-semibold">Expert Doctors</h5>
              <p className="text-muted mb-0">
                Qualified and experienced doctors across multiple specializations,
                ready to take care of you.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card feature-card tilt-card h-100 shadow-sm text-center p-4">
              <div className="feature-icon">📅</div>
              <h5 className="mt-3 fw-semibold">Easy Booking</h5>
              <p className="text-muted mb-0">
                Book appointments online in just a few clicks — anytime, anywhere,
                no waiting in queues.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card feature-card tilt-card h-100 shadow-sm text-center p-4">
              <div className="feature-icon">📋</div>
              <h5 className="mt-3 fw-semibold">Track History</h5>
              <p className="text-muted mb-0">
                Keep track of all your past and upcoming appointments in one
                simple dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-5" style={{ background: "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)" }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-md-6">
              <span className="text-primary fw-semibold text-uppercase" style={{ letterSpacing: "1px" }}>
                About Us
              </span>
              <h2 className="fw-bold mt-2 mb-3">Committed to Better Healthcare</h2>
              <p className="text-muted mb-3">
                CityCare Hospital is committed to providing accessible, high-quality
                healthcare. Our online platform connects patients with the right
                doctors quickly, making healthcare management simple and stress-free.
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">✅ Verified & experienced medical professionals</li>
                <li className="mb-2">✅ Transparent appointment scheduling</li>
                <li className="mb-2">✅ Secure and private patient records</li>
              </ul>
            </div>
            <div className="col-md-6 text-center">
              <div
                className="rounded-4 shadow-lg d-flex align-items-center justify-content-center mx-auto"
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  height: "300px",
                  background: "linear-gradient(135deg, #0d6efd, #084298)",
                  fontSize: "5rem",
                }}
              >
                🏥
              </div>
            </div>
          </div>
        </div>
      </section>

      <Gallery />

      <Testimonials />

      {/* CTA Section */}
      <section className="hero-gradient text-white py-5">
        <div className="container text-center py-3">
          <h2 className="fw-bold mb-3">Ready to take control of your health?</h2>
          <p className="mb-4" style={{ opacity: 0.9 }}>
            Join thousands of patients managing their healthcare with CityCare.
          </p>
          <Link to="/signup" className="btn btn-light btn-lg btn-glow px-5 fw-semibold">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-4">
        <p className="mb-1 fw-semibold">🏥 CityCare Hospital</p>
        <p className="mb-0 text-white-50 small">
          © 2026 CityCare Hospital Management System. All rights reserved.
        </p>
      </footer>
    </>
  );
};

export default Home;