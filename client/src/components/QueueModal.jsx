import { useState, useEffect } from "react";
import api from "../services/api";

const QueueModal = ({ appointmentId, onClose }) => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await api.get(`/appointments/${appointmentId}/queue`);
        setQueueData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue(); // initial load
    const interval = setInterval(fetchQueue, 10000); // refresh every 10 seconds

    return () => clearInterval(interval); // cleanup when modal closes
  }, [appointmentId]);

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="card shadow-lg p-4"
        style={{ maxWidth: "400px", width: "90%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Queue Status</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : !queueData ? (
          <p className="text-center text-muted">Unable to fetch queue status.</p>
        ) : queueData.status && !queueData.tokenNumber ? (
          <p className="text-center text-muted">{queueData.message}</p>
        ) : (
          <div className="text-center">
            <p className="text-muted mb-1">Dr. {queueData.doctorName} — {queueData.timeSlot}</p>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto my-3"
              style={{
                width: "100px",
                height: "100px",
                background: "linear-gradient(135deg, #0d6efd, #0a58ca)",
                color: "white",
              }}
            >
              <div>
                <div className="small">Token</div>
                <div className="fs-3 fw-bold">#{queueData.tokenNumber}</div>
              </div>
            </div>
            <p className="mb-1">
              <strong>{queueData.patientsAhead}</strong> patient(s) ahead of you
            </p>
            <p className="mb-2">
              Estimated wait: <strong>{queueData.estimatedWaitMinutes} minutes</strong>
            </p>
            <small className="text-muted">🔄 Auto-updates every 10 seconds</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueModal;