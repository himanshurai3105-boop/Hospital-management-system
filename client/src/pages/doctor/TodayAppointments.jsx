import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import DashboardHero from "../../components/DashboardHero";
import TileGrid from "../../components/TileGrid";
import { DOCTOR_TILES } from "../../utils/dashboardTiles";


const statusColors = {
  pending: "secondary",
  waiting: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
};

const TodayAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments/doctor/today");
      setAppointments(res.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 10000); // live refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success("Status updated");
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const waiting = appointments.filter((a) => a.status === "waiting").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <DashboardHero icon="👨‍⚕️" title="Doctor Desk" subtitle="Your patients, reports and schedule." />
      <TileGrid tiles={DOCTOR_TILES} />
      <div className="mb-4" />
              <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Today's Appointments</h3>
          <small className="text-muted">🔄 Live updates every 10s</small>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted mb-1">Total Today</h6>
              <h3>{total}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted mb-1">Confirmed</h6>
              <h3 className="text-info">{confirmed}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted mb-1">Waiting</h6>
              <h3 className="text-warning">{waiting}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted mb-1">Completed</h6>
              <h3 className="text-success">{completed}</h3>
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="text-muted">No appointments for today.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td>{appt.patient?.name || "N/A"}</td>
                    <td>{appt.patient?.phone || "N/A"}</td>
                    <td>{appt.timeSlot}</td>
                    <td>{appt.reason || "-"}</td>
                    <td>
                      <span className={`badge bg-${statusColors[appt.status]} text-capitalize`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                        disabled={appt.status === "pending" || appt.status === "waiting"}
                      >
                        <option value="pending" disabled>Pending</option>
                        <option value="waiting" disabled>Waiting</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default TodayAppointments;