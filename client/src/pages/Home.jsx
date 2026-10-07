import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import Gallery from "../components/Gallery";
import Testimonials from "../components/Testimonials";
import Tilt from "../components/Tilt";
import { useAuth } from "../context/AuthContext";
import { getHomeLink } from "../utils/homeRoute";

const Hero3D = lazy(() => import("../components/Hero3D"));

const FEATURES = [
  { icon: "👨‍⚕️", title: "Expert Doctors", text: "Qualified and experienced doctors across many specializations, ready to take care of you." },
  { icon: "📅", title: "Easy Booking", text: "Book a daily visit or a specialist slot online in a few taps, anytime, anywhere." },
  { icon: "⏱️", title: "Live Queue", text: "See your position in the queue in real time and know when your turn is near." },
  { icon: "🧪", title: "Lab Reports Online", text: "Get your test results with a clear table and a downloadable PDF as soon as they are ready." },
  { icon: "💊", title: "Prescriptions", text: "Your doctor's prescription and the medicines you collected, all in one place." },
  { icon: "📋", title: "Track History", text: "Every past and upcoming appointment in one simple dashboard." },
];

const STEPS = [
  { n: 1, title: "Create your account", text: "Sign up with your email and phone number." },
  { n: 2, title: "Choose a doctor", text: "Pick a daily visit or a specialist appointment." },
  { n: 3, title: "Visit and follow up", text: "Track your queue, then find reports and medicines online." },
];

const Home = () => {
  const { user, loading } = useAuth();
  const loggedIn = !loading && !!user;

  return (
    <>
      <PublicNavbar />

      {/* Hero */}
      <section className="hero-gradient text-white home-hero">
        <div className="container position-relative">
          <div className="row align-items-center g-4">
            <div className="col-lg-6 text-center text-lg-start">
              <span className="badge bg-white text-primary px-3 py-2 rounded-pill mb-3 fw-semibold">
                ✨ Trusted by 10,000+ Patients
              </span>
              <h1 className="display-4 fw-bold mb-3">
                Your Health, <br />
                <span style={{ color: "#ffd60a" }}>Our Priority</span>
              </h1>
              <p className="lead mb-4" style={{ maxWidth: "560px", opacity: 0.9 }}>
                Book appointments with trusted doctors, follow your queue live and keep all your
                reports in one seamless platform.
              </p>
              <div className="d-flex justify-content-center justify-content-lg-start gap-3 flex-wrap">
                {loggedIn ? (
                  <Link to={getHomeLink(user)} className="btn btn-light btn-lg btn-glow px-4 fw-semibold">
                    Go to my dashboard →
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn btn-light btn-lg btn-glow px-4 fw-semibold">
                      Book an Appointment →
                    </Link>
                    <Link to="/login" className="btn btn-outline-light btn-lg px-4">Login</Link>
                  </>
                )}
              </div>
            </div>

            <div className="col-lg-6">
              <Suspense
                fallback={
                  <div className="hero3d">
                    <div className="hero3d__fallback floating-3d-icon">🏥</div>
                  </div>
                }
              >
                <Hero3D />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-5 border-bottom">
        <div className="container">
          <div className="row text-center g-4">
            {[
              ["15+", "Expert Doctors"],
              ["10K+", "Happy Patients"],
              ["8+", "Specializations"],
              ["24/7", "Online Booking"],
            ].map(([num, label]) => (
              <div className="col-6 col-md-3" key={label}>
                <div className="stat-number">{num}</div>
                <p className="text-muted mb-0">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-5">
        <div className="text-center mb-5">
          <span className="text-primary fw-semibold text-uppercase" style={{ letterSpacing: "1px" }}>Our Services</span>
          <h2 className="fw-bold mt-2">Why Choose CityCare</h2>
          <p className="text-muted">Everything you need for hassle-free healthcare management</p>
        </div>
        <div className="row g-4">
          {FEATURES.map((f) => (
            <div className="col-sm-6 col-lg-4" key={f.title}>
              <Tilt max={8}>
                <div className="card feature-card h-100 shadow-sm text-center p-4">
                  <div className="feature-icon">{f.icon}</div>
                  <h5 className="mt-3 fw-semibold">{f.title}</h5>
                  <p className="text-muted mb-0">{f.text}</p>
                </div>
              </Tilt>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="text-center mb-5">
            <span className="text-primary fw-semibold text-uppercase" style={{ letterSpacing: "1px" }}>How it works</span>
            <h2 className="fw-bold mt-2">Care in three simple steps</h2>
          </div>
          <div className="row g-4 text-center">
            {STEPS.map((s) => (
              <div className="col-md-4" key={s.n}>
                <div className="step-badge mx-auto mb-3">{s.n}</div>
                <h5 className="fw-semibold">{s.title}</h5>
                <p className="text-muted mb-0">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-5" style={{ background: "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)" }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-md-6">
              <span className="text-primary fw-semibold text-uppercase" style={{ letterSpacing: "1px" }}>About Us</span>
              <h2 className="fw-bold mt-2 mb-3">Committed to Better Healthcare</h2>
              <p className="text-muted mb-3">
                CityCare Hospital is committed to providing accessible, high-quality healthcare. Our online
                platform connects patients with the right doctors quickly, making healthcare management simple
                and stress-free.
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">✅ Verified & experienced medical professionals</li>
                <li className="mb-2">✅ Transparent appointment scheduling</li>
                <li className="mb-2">✅ Secure and private patient records</li>
              </ul>
            </div>
            <div className="col-md-6 text-center">
              <Tilt max={8}>
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
                  <span className="floating-3d-icon">🏥</span>
                </div>
              </Tilt>
            </div>
          </div>
        </div>
      </section>

      <Gallery />

      <Testimonials />

      {/* CTA */}
      <section className="hero-gradient text-white py-5">
        <div className="container text-center py-3 position-relative">
          <h2 className="fw-bold mb-3">Ready to take control of your health?</h2>
          <p className="mb-4" style={{ opacity: 0.9 }}>
            Join thousands of patients managing their healthcare with CityCare.
          </p>
          <Link to={loggedIn ? getHomeLink(user) : "/signup"} className="btn btn-light btn-lg btn-glow px-5 fw-semibold">
            {loggedIn ? "Go to my dashboard" : "Get Started Now"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-4">
        <p className="mb-1 fw-semibold">🏥 CityCare Hospital</p>
        <p className="mb-0 text-white-50 small">© 2026 CityCare Hospital Management System. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Home;