import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const statusColors = { available: "success", "in-use": "warning", maintenance: "secondary" };

const ManageEquipment = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", type: "X-Ray", location: "", costPerUse: "" });

  const fetchEquipment = async () => {
    try {
      const res = await api.get("/equipment");
      setEquipmentList(res.data);
    } catch (error) {
      toast.error("Failed to load equipment");
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/equipment", formData);
      toast.success("Equipment added");
      setFormData({ name: "", type: "X-Ray", location: "", costPerUse: "" });
      setShowForm(false);
      fetchEquipment();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this equipment?")) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success("Equipment removed");
      fetchEquipment();
    } catch (error) {
      toast.error("Failed to remove equipment");
    }
  };

  const handleMaintenance = async (id, current) => {
    try {
      const newStatus = current === "maintenance" ? "available" : "maintenance";
      await api.put(`/equipment/${id}`, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      fetchEquipment();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Manage Equipment</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Equipment"}
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-4 shadow-sm">
            <h5>Add New Equipment</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Type</label>
                  <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
                    <option value="X-Ray">X-Ray</option>
                    <option value="MRI">MRI</option>
                    <option value="CT Scan">CT Scan</option>
                    <option value="ECG">ECG</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="Blood Test">Blood Test</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Cost per Use (₹)</label>
                  <input type="number" name="costPerUse" className="form-control" value={formData.costPerUse} onChange={handleChange} required />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Location</label>
                  <input type="text" name="location" className="form-control" value={formData.location} onChange={handleChange} placeholder="e.g. Radiology Dept, Floor 2" />
                </div>
              </div>
              <button type="submit" className="btn btn-success">Add Equipment</button>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Cost/Use</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipmentList.map((eq) => (
                <tr key={eq._id}>
                  <td>{eq.name}</td>
                  <td>{eq.type}</td>
                  <td>{eq.location || "-"}</td>
                  <td>₹{eq.costPerUse}</td>
                  <td><span className={`badge bg-${statusColors[eq.status]}`}>{eq.status}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleMaintenance(eq._id, eq.status)}>
                      {eq.status === "maintenance" ? "Mark Available" : "Mark Maintenance"}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(eq._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ManageEquipment;