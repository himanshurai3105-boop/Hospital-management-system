import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const RequestRoom = () => {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({ patientId: "", roomTypeNeeded: "general", urgency: "normal", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/doctors/my-patients");
        setPatients(res.data);
      } catch (error) {
        toast.error("Failed to load patients");
      }
    };
    fetchPatients();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/room-requests", formData);
      toast.success("Room request sent to Bed Coordinator!");
      setFormData({ patientId: "", roomTypeNeeded: "general", urgency: "normal", notes: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Request a Room for Patient</h3>
        <div className="card shadow-sm p-4" style={{ maxWidth: "500px" }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Patient</label>
              <select name="patientId" className="form-select" value={formData.patientId} onChange={handleChange} required>
                <option value="">-- Select Patient --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.hospitalId})</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Room Type Needed</label>
              <select name="roomTypeNeeded" className="form-select" value={formData.roomTypeNeeded} onChange={handleChange}>
                <option value="general">General</option>
                <option value="private">Private</option>
                <option value="icu">ICU</option>
                <option value="deluxe">Deluxe</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Urgency</label>
              <select name="urgency" className="form-select" value={formData.urgency} onChange={handleChange}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Notes (optional)</label>
              <textarea name="notes" className="form-control" value={formData.notes} onChange={handleChange} rows={3} placeholder="Any specific medical reason or requirement" />
            </div>
            <button type="submit" className="btn btn-success w-100" disabled={loading}>
              {loading ? "Sending..." : "Send Room Request"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default RequestRoom;