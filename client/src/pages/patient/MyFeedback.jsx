import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const MyFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get("/feedback/my");
        setFeedback(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">My Reviews</h3>
        {loading ? (
          <p>Loading...</p>
        ) : feedback.length === 0 ? (
          <p className="text-muted">You haven't submitted any reviews yet.</p>
        ) : (
          <div className="row g-3">
            {feedback.map((f) => (
              <div className="col-md-6" key={f._id}>
                <div className="card shadow-sm p-3">
                  <h6>Dr. {f.doctor?.name} ({f.doctor?.specialization})</h6>
                  <div style={{ color: "#ffc107", fontSize: "1.2rem" }}>
                    {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}
                  </div>
                  {f.comment && <p className="mt-2 mb-1">{f.comment}</p>}
                  <small className="text-muted">{new Date(f.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyFeedback;