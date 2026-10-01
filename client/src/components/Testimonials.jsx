import { useState, useEffect } from "react";
import api from "../services/api";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get("/feedback/recent");
        setTestimonials(res.data);
      } catch (error) {
        console.error("Failed to load testimonials", error);
      }
    };
    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-5" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f0f4ff 100%)" }}>
      <div className="container">
        <div className="text-center mb-5">
          <span className="text-primary fw-semibold text-uppercase" style={{ letterSpacing: "1px" }}>
            Testimonials
          </span>
          <h2 className="fw-bold mt-2">What Our Patients Say</h2>
        </div>

        <div className="row g-4">
          {testimonials.map((t) => (
            <div className="col-md-4" key={t._id}>
              <div
                className="card h-100 p-4 shadow-sm border-0"
                style={{
                  borderRadius: "16px",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.4s ease, box-shadow 0.4s ease",
                }}
                onMouseMove={(e) => {
                  const card = e.currentTarget;
                  const rect = card.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const rotateX = ((y - rect.height / 2) / rect.height) * -10;
                  const rotateY = ((x - rect.width / 2) / rect.width) * 10;
                  card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
                  card.style.boxShadow = "0 20px 40px rgba(13,110,253,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ color: "#ffc107", fontSize: "1.3rem" }}>
                  {"★".repeat(t.rating)}
                  {"☆".repeat(5 - t.rating)}
                </div>
                <p className="mt-3 mb-4 text-muted" style={{ minHeight: "60px" }}>
                  "{t.comment || "Great experience with the doctor and staff."}"
                </p>
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3"
                    style={{ width: "45px", height: "45px", background: "linear-gradient(135deg, #0d6efd, #6f42c1)" }}
                  >
                    {t.patient?.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <p className="mb-0 fw-semibold">{t.patient?.name || "Patient"}</p>
                    <small className="text-muted">
                      Reviewed Dr. {t.doctor?.name} ({t.doctor?.specialization})
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;