import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const AddReport = () => {
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    appointmentId: "",
    diagnosis: "",
    prescription: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/reports/doctor/appointments");
        setAppointments(res.data);
      } catch (error) {
        toast.error("Failed to load appointments");
      }
    };
    fetchAppointments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.appointmentId) {
      toast.error("Please select an appointment/patient");
      return;
    }
    setLoading(true);
    try {
      await api.post("/reports", formData);
      toast.success("Report added successfully!");
      setFormData({ appointmentId: "", diagnosis: "", prescription: "", notes: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Add Patient Report</h3>
        <div className="card shadow-sm p-4" style={{ maxWidth: "600px" }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Select Patient / Appointment</label>
              <select
                name="appointmentId"
                className="form-select"
                value={formData.appointmentId}
                onChange={handleChange}
                required
              >
                <option value="">-- Select --</option>
                {appointments.map((appt) => (
                  <option key={appt._id} value={appt._id}>
                    {appt.patient?.name} — {new Date(appt.date).toLocaleDateString()} ({appt.timeSlot})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Diagnosis</label>
              <input
                type="text"
                name="diagnosis"
                className="form-control"
                value={formData.diagnosis}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Prescription</label>
              <textarea
                name="prescription"
                className="form-control"
                rows={3}
                value={formData.prescription}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Notes (optional)</label>
              <textarea
                name="notes"
                className="form-control"
                rows={2}
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-success w-100" disabled={loading}>
              {loading ? "Saving..." : "Save Report"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddReport;