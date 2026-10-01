import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const statusColors = { pending: "secondary", waiting: "warning", confirmed: "info", completed: "success", cancelled: "danger", scheduled: "warning" };

const PatientFullRecord = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/admin/patients/${id}/full-record`);
        setData(res.data);
      } catch (error) {
        toast.error("Failed to load patient record");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-4"><p>Loading...</p></div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="container mt-4"><p className="text-muted">Record not available.</p></div>
      </>
    );
  }

  const { patient, appointments, reports, roomBookings, checkups, nextAppointment, nextCheckup, totalFeesPaid } = data;

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <Link to="/admin/patients" className="btn btn-link p-0 mb-3">← Back to Patients</Link>

        <div className="card shadow-sm p-4 mb-4">
          <div className="d-flex justify-content-between flex-wrap">
            <div>
              <h4>{patient.name}</h4>
              <p className="mb-1 text-muted">{patient.hospitalId} • {patient.email}</p>
              <p className="mb-0">
                {patient.age ? `${patient.age} yrs` : "-"} • {patient.gender || "-"} • {patient.phone || "-"}
              </p>
            </div>
            <div className="text-end">
              <p className="mb-0 text-muted small">Total Fees Paid</p>
              <h4 className="text-success">₹{totalFeesPaid}</h4>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm p-3 bg-light">
              <h6 className="mb-1">📅 Next Appointment</h6>
              {nextAppointment ? (
                <p className="mb-0">
                  {new Date(nextAppointment.date).toLocaleDateString()} at {nextAppointment.timeSlot} — Dr. {nextAppointment.doctor?.name}
                </p>
              ) : (
                <p className="mb-0 text-muted">None scheduled</p>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm p-3 bg-light">
              <h6 className="mb-1">🧪 Next Checkup / Lab Test</h6>
              {nextCheckup ? (
                <p className="mb-0">
                  {new Date(nextCheckup.scheduledDate).toLocaleDateString()} — {nextCheckup.equipment?.name}
                </p>
              ) : (
                <p className="mb-0 text-muted">None scheduled</p>
              )}
            </div>
          </div>
        </div>

        <h5 className="mb-3">Appointment History</h5>
        {appointments.length === 0 ? (
          <p className="text-muted">No appointments found.</p>
        ) : (
          <div className="table-responsive mb-4">
            <table className="table table-bordered table-sm align-middle">
              <thead className="table-light">
                <tr><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id}>
                    <td>{a.doctor?.name} ({a.doctor?.specialization})</td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.timeSlot}</td>
                    <td><span className={`badge bg-${statusColors[a.status]} text-capitalize`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h5 className="mb-3">Medical Reports</h5>
        {reports.length === 0 ? (
          <p className="text-muted">No reports found.</p>
        ) : (
          <div className="row g-3 mb-4">
            {reports.map((r) => (
              <div className="col-md-6" key={r._id}>
                <div className="card shadow-sm p-3">
                  <h6 className="mb-1">Dr. {r.doctor?.name} ({r.doctor?.specialization})</h6>
                  <p className="mb-1"><strong>Diagnosis:</strong> {r.diagnosis}</p>
                  {r.prescription && <p className="mb-1"><strong>Prescription:</strong> {r.prescription}</p>}
                  <small className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        <h5 className="mb-3">Lab Reports / Checkups</h5>
        {checkups.length === 0 ? (
          <p className="text-muted">No checkups found.</p>
        ) : (
          <div className="row g-3 mb-4">
            {checkups.map((c) => (
              <div className="col-md-6" key={c._id}>
                <div className="card shadow-sm p-3">
                  <div className="d-flex justify-content-between">
                    <h6 className="mb-1">{c.equipment?.name} ({c.equipment?.type})</h6>
                    <span className={`badge bg-${statusColors[c.status]} text-capitalize`}>{c.status}</span>
                  </div>
                  <p className="mb-1">Dr. {c.doctor?.name} — {new Date(c.scheduledDate).toLocaleDateString()}</p>
                  {c.status === "completed" && <p className="mb-0 text-muted"><strong>Result:</strong> {c.resultNotes || "-"}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        <h5 className="mb-3">Room / Bed Bookings</h5>
        {roomBookings.length === 0 ? (
          <p className="text-muted">No room bookings found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm align-middle">
              <thead className="table-light">
                <tr><th>Room</th><th>Bed</th><th>From</th><th>To</th><th>Status</th></tr>
              </thead>
              <tbody>
                {roomBookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.room?.roomNumber} ({b.room?.roomType})</td>
                    <td>{b.bed?.bedNumber}</td>
                    <td>{new Date(b.fromDate).toLocaleDateString()}</td>
                    <td>{new Date(b.toDate).toLocaleDateString()}</td>
                    <td><span className={`badge bg-${statusColors[b.status]}`}>{b.status}</span></td>
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

export default PatientFullRecord;