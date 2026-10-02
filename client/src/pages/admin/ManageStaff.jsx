import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const staffTypeLabels = {
  nurse: "Nurse",
  ward_boy: "Ward Boy",
  pharmacist: "Pharmacist",
  lab_technician: "Lab Technician",
  cleaner: "Cleaner",
  security: "Security",
  other: "Other",
};

const ManageStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [staffTypeFilter, setStaffTypeFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", staffType: "nurse", baseSalary: "",
  });

  const fetchStaff = async () => {
    try {
      const res = await api.get("/admin/staff");
      setStaffList(res.data);
    } catch (error) {
      toast.error("Failed to load staff");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", phone: "", staffType: "nurse", baseSalary: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/staff/${editingId}`, formData);
        toast.success("Staff updated");
      } else {
        await api.post("/admin/staff", formData);
        toast.success("Staff added");
      }
      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (s) => {
    setFormData({
      name: s.name, email: s.email, password: "", phone: s.phone || "",
      staffType: s.staffType || "nurse", baseSalary: s.baseSalary || "",
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/admin/staff/${id}/toggle-status`);
      toast.success("Status updated");
      fetchStaff();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this staff member?")) return;
    try {
      await api.delete(`/admin/staff/${id}`);
      toast.success("Staff member removed");
      fetchStaff();
    } catch (error) {
      toast.error("Failed to remove staff");
    }
  };

  const filteredStaff = staffTypeFilter === "all" ? staffList : staffList.filter((s) => s.staffType === staffTypeFilter);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Manage Staff</h3>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? "Cancel" : "+ Add Staff"}
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-4 shadow-sm">
            <h5>{editingId ? "Edit Staff" : "Add New Staff"}</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required disabled={!!editingId} />
                </div>
                {!editingId && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Password</label>
                    <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required minLength={8} />
                  </div>
                )}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone</label>
                  <input type="text" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Staff Type</label>
                  <select name="staffType" className="form-select" value={formData.staffType} onChange={handleChange}>
                    {Object.entries(staffTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Base Monthly Salary (₹)</label>
                  <input type="number" name="baseSalary" className="form-control" value={formData.baseSalary} onChange={handleChange} placeholder="e.g. 25000" />
                </div>
              </div>
              <button type="submit" className="btn btn-success">{editingId ? "Update Staff" : "Add Staff"}</button>
            </form>
          </div>
        )}

        <div className="card p-3 mb-4 shadow-sm">
          <select className="form-select" value={staffTypeFilter} onChange={(e) => setStaffTypeFilter(e.target.value)}>
            <option value="all">All Staff Types ({staffList.length})</option>
            {Object.entries(staffTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label} ({staffList.filter((s) => s.staffType === value).length})
              </option>
            ))}
          </select>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Hospital ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Base Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s._id} className={!s.isActive ? "table-secondary" : ""}>
                  <td>{s.hospitalId}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{staffTypeLabels[s.staffType] || "-"}</td>
                  <td>₹{s.baseSalary || 0}</td>
                  <td>
                    <span className={`badge bg-${s.isActive ? "success" : "danger"}`}>
                      {s.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(s)}>Edit</button>
                    <button className={`btn btn-sm btn-outline-${s.isActive ? "warning" : "success"} me-2`} onClick={() => handleToggleStatus(s._id)}>
                      {s.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted">No staff found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ManageStaff;