import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const statusColors = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
};

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get("/appointments");
        setAppointments(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">All Appointments</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td>{appt.patient?.name || "N/A"}</td>
                    <td>{appt.doctor?.name || "N/A"}</td>
                    <td>{new Date(appt.date).toLocaleDateString()}</td>
                    <td>{appt.timeSlot}</td>
                    <td>
                      <span className={`badge bg-${statusColors[appt.status]}`}>{appt.status}</span>
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

export default ManageAppointments;