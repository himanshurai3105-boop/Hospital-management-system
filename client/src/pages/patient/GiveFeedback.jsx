import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const StarRating = ({ rating, setRating }) => {
  return (
    <div style={{ fontSize: "1.8rem", cursor: "pointer" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => setRating(star)}
          style={{ color: star <= rating ? "#ffc107" : "#e0e0e0" }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const GiveFeedback = () => {
  const [pending, setPending] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const fetchPending = async () => {
    try {
      const res = await api.get("/feedback/pending");
      setPending(res.data);
    } catch (error) {
      toast.error("Failed to load pending reviews");
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSubmit = async (appointmentId) => {
    const rating = ratings[appointmentId];
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmittingId(appointmentId);
    try {
      await api.post("/feedback", {
        appointmentId,
        rating,
        comment: comments[appointmentId] || "",
      });
      toast.success("Thank you for your feedback!");
      fetchPending();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Give Feedback</h3>
        {pending.length === 0 ? (
          <p className="text-muted">No completed appointments pending review.</p>
        ) : (
          <div className="row g-3">
            {pending.map((appt) => (
              <div className="col-md-6" key={appt._id}>
                <div className="card shadow-sm p-3">
                  <h6>
                    Dr. {appt.doctor?.name} <span className="text-muted">({appt.doctor?.specialization})</span>
                  </h6>
                  <p className="text-muted small mb-2">
                    {new Date(appt.date).toLocaleDateString()} • {appt.timeSlot}
                  </p>
                  <StarRating
                    rating={ratings[appt._id] || 0}
                    setRating={(val) => setRatings({ ...ratings, [appt._id]: val })}
                  />
                  <textarea
                    className="form-control mt-2 mb-2"
                    rows={2}
                    placeholder="Share your experience (optional)"
                    onChange={(e) => setComments({ ...comments, [appt._id]: e.target.value })}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleSubmit(appt._id)}
                    disabled={submittingId === appt._id}
                  >
                    {submittingId === appt._id ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GiveFeedback;