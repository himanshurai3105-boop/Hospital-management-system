import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const ScheduleCheckup = () => {
  const [patients, setPatients] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [formData, setFormData] = useState({ patientId: "", equipmentId: "", scheduledDate: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, equipmentRes] = await Promise.all([
          api.get("/doctors/my-patients"),
          api.get("/equipment"),
        ]);
        setPatients(patientsRes.data);
        setEquipmentList(equipmentRes.data.filter((e) => e.status === "available"));
      } catch (error) {
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/equipment/checkup", formData);
      toast.success("Checkup scheduled successfully!");
      setFormData({ patientId: "", equipmentId: "", scheduledDate: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule checkup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Schedule a Checkup</h3>
        <div className="card shadow-sm p-4" style={{ maxWidth: "500px" }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Patient</label>
              <select name="patientId" className="form-select" value={formData.patientId} onChange={handleChange} required>
                <option value="">-- Select Patient --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Equipment / Test</label>
              <select name="equipmentId" className="form-select" value={formData.equipmentId} onChange={handleChange} required>
                <option value="">-- Select Equipment --</option>
                {equipmentList.map((eq) => (
                  <option key={eq._id} value={eq._id}>{eq.name} ({eq.type}) — ₹{eq.costPerUse}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Scheduled Date</label>
              <input type="date" name="scheduledDate" className="form-control" value={formData.scheduledDate} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-success w-100" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Checkup"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ScheduleCheckup;