import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const ManageReceptionists = () => {
  const [receptionists, setReceptionists] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });

  const fetchReceptionists = async () => {
    try {
      const res = await api.get("/admin/receptionists");
      setReceptionists(res.data);
    } catch (error) {
      toast.error("Failed to load receptionists");
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/receptionists", formData);
      toast.success("Receptionist added");
      setFormData({ name: "", email: "", password: "", phone: "" });
      setShowForm(false);
      fetchReceptionists();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/admin/receptionists/${id}/toggle-status`);
      toast.success("Status updated");
      fetchReceptionists();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this receptionist?")) return;
    try {
      await api.delete(`/admin/receptionists/${id}`);
      toast.success("Receptionist removed");
      fetchReceptionists();
    } catch (error) {
      toast.error("Failed to remove receptionist");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Manage Receptionists</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Receptionist"}
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-4 shadow-sm">
            <h5>Add New Receptionist</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required minLength={8} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone</label>
                  <input type="text" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" className="btn btn-success">Add Receptionist</button>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Hospital ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receptionists.map((r) => (
                <tr key={r._id} className={!r.isActive ? "table-secondary" : ""}>
                  <td>{r.hospitalId}</td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.phone || "-"}</td>
                  <td>
                    <span className={`badge bg-${r.isActive ? "success" : "danger"}`}>
                      {r.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    <button className={`btn btn-sm btn-outline-${r.isActive ? "warning" : "success"} me-2`} onClick={() => handleToggleStatus(r._id)}>
                      {r.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {receptionists.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted">No receptionists added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ManageReceptionists;