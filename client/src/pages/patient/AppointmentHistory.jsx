import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import QueueModal from "../../components/QueueModal";

const statusColors = {
  pending: "secondary",
  waiting: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
};

const AppointmentHistory = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueAppointmentId, setQueueAppointmentId] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/appointments/my");
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000); // live refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">My Appointments</h3>
          <small className="text-muted">🔄 Live updates every 15s</small>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="text-muted">No appointments booked yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Fees</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td>{appt.doctor?.name || "N/A"}</td>
                    <td>{appt.doctor?.specialization || "N/A"}</td>
                    <td>{new Date(appt.date).toLocaleDateString()}</td>
                    <td>{appt.timeSlot}</td>
                    <td>₹{appt.doctor?.fees || 0}</td>
                    <td>
                      <span className={`badge bg-${statusColors[appt.status]} text-capitalize`}>
                        {appt.status}
                      </span>
                      {["waiting", "confirmed"].includes(appt.status) && (
                        <button
                          className="btn btn-sm btn-link p-0 ms-2"
                          onClick={() => setQueueAppointmentId(appt._id)}
                        >
                          Check Queue
                        </button>
                      )}
                    </td>
                    <td>
                      {appt.status === "cancelled" ? (
                        appt.paymentStatus === "refunded" ? (
                          <span className="badge bg-info">Refunded</span>
                        ) : appt.paymentStatus === "refund_pending" ? (
                          <span className="badge bg-warning text-dark">Refund Processing</span>
                        ) : (
                          <span className="badge bg-secondary">Cancelled</span>
                        )
                      ) : appt.paymentStatus === "paid" ? (
                        <span className="badge bg-success">Paid</span>
                      ) : (
                        <span className="badge bg-secondary">Payment Pending</span>
                      )}
                    </td>
                    <td>
                      {appt.paymentStatus === "paid" && (
                        <Link to={`/patient/receipt/${appt._id}?type=appointment`} className="btn btn-sm btn-outline-secondary">
                          Receipt
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {queueAppointmentId && (
        <QueueModal appointmentId={queueAppointmentId} onClose={() => setQueueAppointmentId(null)} />
      )}
    </>
  );
};

export default AppointmentHistory;