import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const statusColors = { pending: "warning", allotted: "success", rejected: "danger", completed: "secondary" };
const urgencyColors = { normal: "secondary", urgent: "warning", emergency: "danger" };

const MyRoomRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/room-requests/my");
      setRequests(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">My Room Requests</h3>
          <small className="text-muted">🔄 Live updates every 10s</small>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-muted">No room requests made yet.</p>
        ) : (
          <div className="row g-3">
            {requests.map((r) => (
              <div className="col-md-6" key={r._id}>
                <div className="card shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <h6 className="mb-1">{r.patient?.name} ({r.patient?.hospitalId})</h6>
                    <span className={`badge bg-${statusColors[r.status]} text-capitalize`}>{r.status}</span>
                  </div>
                  <p className="mb-1 text-capitalize">
                    Room Type: <strong>{r.roomTypeNeeded}</strong> •{" "}
                    <span className={`badge bg-${urgencyColors[r.urgency]}`}>{r.urgency}</span>
                  </p>
                  {r.notes && <p className="mb-1 text-muted small">{r.notes}</p>}
                  {r.status === "allotted" && r.booking && (
                    <p className="mb-0 text-success">
                      ✅ Allotted: Room {r.booking.room?.roomNumber}, Bed {r.booking.bed?.bedNumber}
                    </p>
                  )}
                  {r.status === "rejected" && (
                    <p className="mb-0 text-danger">Reason: {r.rejectReason || "Not specified"}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyRoomRequests;