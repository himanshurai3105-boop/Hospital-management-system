import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const diseaseMap = {
  heart: "Cardiology", chest: "Cardiology", cardiac: "Cardiology",
  brain: "Neurology", headache: "Neurology", stroke: "Neurology",
  bone: "Orthopedics", fracture: "Orthopedics", joint: "Orthopedics",
  child: "Pediatrics", baby: "Pediatrics",
  skin: "Dermatology", rash: "Dermatology",
  ear: "ENT", nose: "ENT", throat: "ENT",
  pregnancy: "Gynecology", women: "Gynecology",
  eye: "Ophthalmology", vision: "Ophthalmology",
  mental: "Psychiatry", stress: "Psychiatry", anxiety: "Psychiatry",
  kidney: "Urology", urine: "Urology",
  stomach: "Gastroenterology", digestion: "Gastroenterology",
  lung: "Pulmonology", breathing: "Pulmonology", asthma: "Pulmonology",
  cancer: "Oncology", tumor: "Oncology",
  fever: "General Medicine", cold: "General Medicine",
};

const shiftColors = { day: "primary", night: "dark", emergency: "danger" };

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    experience: "",
    fees: "",
    baseSalary: "",
    shiftType: "day",
  });

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/admin/doctors");
      setDoctors(res.data);
    } catch (error) {
      toast.error("Failed to load doctors");
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: "", email: "", password: "", phone: "",
      specialization: "", experience: "", fees: "", baseSalary: "", shiftType: "day",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/doctors/${editingId}`, formData);
        if (formData.baseSalary !== "") {
          await api.put(`/salary/doctors/${editingId}/base-salary`, { baseSalary: formData.baseSalary });
        }
        toast.success("Doctor updated");
      } else {
        await api.post("/admin/doctors", formData);
        toast.success("Doctor added");
      }
      resetForm();
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (doc) => {
    setFormData({
      name: doc.name,
      email: doc.email,
      password: "",
      phone: doc.phone || "",
      specialization: doc.specialization || "",
      experience: doc.experience || "",
      fees: doc.fees || "",
      baseSalary: doc.baseSalary || "",
      shiftType: doc.shiftType || "day",
    });
    setEditingId(doc._id);
    setShowForm(true);
  };

  const handleQuickShiftChange = async (id, newShift) => {
    try {
      await api.put(`/admin/doctors/${id}`, { shiftType: newShift });
      toast.success("Shift updated");
      fetchDoctors();
    } catch (error) {
      toast.error("Failed to update shift");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} this doctor?`)) return;
    try {
      await api.put(`/admin/doctors/${id}/toggle-status`);
      toast.success(`Doctor ${action}d successfully`);
      fetchDoctors();
    } catch (error) {
      toast.error("Failed to update doctor status");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("This will PERMANENTLY delete this doctor and cannot be undone. Are you sure?")) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      toast.success("Doctor permanently removed");
      fetchDoctors();
    } catch (error) {
      toast.error("Failed to remove doctor");
    }
  };

  // Unique specializations for the filter dropdown
  const specializations = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))].sort();

  // Smart search: matches name, specialization, or disease keyword mapped to specialization
  const filteredDoctors = doctors.filter((doc) => {
    const term = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (term) {
      const mappedSpecialization = diseaseMap[term];
      matchesSearch =
        doc.name?.toLowerCase().includes(term) ||
        doc.specialization?.toLowerCase().includes(term) ||
        (mappedSpecialization && doc.specialization === mappedSpecialization);
    }
    const matchesSpecFilter = specializationFilter === "all" || doc.specialization === specializationFilter;
    const matchesShiftFilter = shiftFilter === "all" || doc.shiftType === shiftFilter;
    return matchesSearch && matchesSpecFilter && matchesShiftFilter;
  });

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Manage Doctors</h3>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            {showForm ? "Cancel" : "+ Add Doctor"}
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-4 shadow-sm">
            <h5>{editingId ? "Edit Doctor" : "Add New Doctor"}</h5>
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
                <div className="col-md-4 mb-3">
                  <label className="form-label">Specialization</label>
                  <input type="text" name="specialization" className="form-control" value={formData.specialization} onChange={handleChange} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Experience (yrs)</label>
                  <input type="number" name="experience" className="form-control" value={formData.experience} onChange={handleChange} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Consultation Fees (₹)</label>
                  <input type="number" name="fees" className="form-control" value={formData.fees} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Base Monthly Salary (₹)</label>
                  <input type="number" name="baseSalary" className="form-control" value={formData.baseSalary} onChange={handleChange} placeholder="e.g. 80000" />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Shift Type</label>
                  <select name="shiftType" className="form-select" value={formData.shiftType} onChange={handleChange}>
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-success">
                {editingId ? "Update Doctor" : "Add Doctor"}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="card p-3 mb-4 shadow-sm">
          <div className="row g-2">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search by name, specialization, or symptom (e.g. 'heart', 'eye')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select className="form-select" value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)}>
                <option value="all">All Specializations ({doctors.length})</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec} ({doctors.filter((d) => d.specialization === spec).length})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
                <option value="all">All Shifts</option>
                <option value="day">Day</option>
                <option value="night">Night</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          <p className="text-muted small mt-2 mb-0">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </p>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Hospital ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Base Salary</th>
                <th>Shift</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doc) => (
                <tr key={doc._id} className={!doc.isActive ? "table-secondary" : ""}>
                  <td>{doc.hospitalId || "-"}</td>
                  <td>{doc.name}</td>
                  <td>{doc.email}</td>
                  <td>{doc.specialization || "-"}</td>
                  <td>₹{doc.baseSalary || 0}</td>
                  <td>
                    <select
                      className={`form-select form-select-sm border-${shiftColors[doc.shiftType] || "primary"}`}
                      value={doc.shiftType || "day"}
                      onChange={(e) => handleQuickShiftChange(doc._id, e.target.value)}
                      style={{ width: "110px" }}
                    >
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge bg-${doc.isActive ? "success" : "danger"}`}>
                      {doc.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(doc)}>
                      Edit
                    </button>
                    <button
                      className={`btn btn-sm btn-outline-${doc.isActive ? "warning" : "success"} me-2`}
                      onClick={() => handleToggleStatus(doc._id, doc.isActive)}
                    >
                      {doc.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handlePermanentDelete(doc._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted">No doctors match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ManageDoctors;