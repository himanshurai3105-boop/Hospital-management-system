import { useState } from "react";

const images = [
  {
    url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
    caption: "Modern Reception Area",
  },
  {
    url: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80",
    caption: "State-of-the-art ICU",
  },
  {
    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80",
    caption: "Advanced Operation Theatre",
  },
  {
    url: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&q=80",
    caption: "Comfortable Patient Rooms",
  },
  {
    url: "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=600&q=80",
    caption: "Diagnostic & Radiology Center",
  },
  {
    url: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&q=80",
    caption: "24/7 Pharmacy",
  },
];

const Gallery = () => {
  const [lightboxImg, setLightboxImg] = useState(null);

  const handleTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / rect.height) * -12;
    const rotateY = ((x - rect.width / 2) / rect.width) * 12;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    card.style.boxShadow = "0 25px 45px rgba(0,0,0,0.35)";
  };

  const resetTilt = (e) => {
    e.currentTarget.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  };

  return (
    <section className="container py-5">
      <div className="text-center mb-5">
        <span className="text-primary fw-semibold text-uppercase" style={{ letterSpacing: "1px" }}>
          Take a Look Inside
        </span>
        <h2 className="fw-bold mt-2">Our Facility</h2>
        <p className="text-muted">A glimpse of our world-class infrastructure</p>
      </div>

      <div className="row g-4">
        {images.map((img, idx) => (
          <div className="col-md-4 col-6" key={idx}>
            <div
              className="position-relative overflow-hidden rounded-3"
              style={{
                cursor: "pointer",
                height: "220px",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                transformStyle: "preserve-3d",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onClick={() => setLightboxImg(img)}
              onMouseMove={handleTilt}
              onMouseLeave={resetTilt}
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-100 h-100"
                style={{ objectFit: "cover", pointerEvents: "none" }}
              />
              <div
                className="position-absolute bottom-0 start-0 w-100 text-white p-2"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))", fontSize: "0.85rem" }}
              >
                {img.caption}
              </div>
            </div>
          </div>
        ))}
      </div>

      {lightboxImg && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.85)", zIndex: 1050 }}
          onClick={() => setLightboxImg(null)}
        >
          <div className="text-center">
            <img
              src={lightboxImg.url}
              alt={lightboxImg.caption}
              style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: "10px" }}
            />
            <p className="text-white mt-3">{lightboxImg.caption}</p>
            <button className="btn btn-light btn-sm">Close</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;