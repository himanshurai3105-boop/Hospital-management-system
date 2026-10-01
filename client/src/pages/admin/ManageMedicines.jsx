import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const ManageMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    manufacturer: "",
    price: "",
    stock: "",
    description: "",
  });

  const fetchMedicines = async () => {
    try {
      const res = await api.get("/medicines");
      setMedicines(res.data);
    } catch (error) {
      toast.error("Failed to load medicines");
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ name: "", category: "", manufacturer: "", price: "", stock: "", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/medicines/${editingId}`, formData);
        toast.success("Medicine updated");
      } else {
        await api.post("/medicines", formData);
        toast.success("Medicine added");
      }
      resetForm();
      fetchMedicines();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (med) => {
    setFormData({
      name: med.name,
      category: med.category || "",
      manufacturer: med.manufacturer || "",
      price: med.price,
      stock: med.stock,
      description: med.description || "",
    });
    setEditingId(med._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success("Medicine removed");
      fetchMedicines();
    } catch (error) {
      toast.error("Failed to remove medicine");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Manage Medicines</h3>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            {showForm ? "Cancel" : "+ Add Medicine"}
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-4 shadow-sm">
            <h5>{editingId ? "Edit Medicine" : "Add New Medicine"}</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Category</label>
                  <input type="text" name="category" className="form-control" value={formData.category} onChange={handleChange} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Manufacturer</label>
                  <input type="text" name="manufacturer" className="form-control" value={formData.manufacturer} onChange={handleChange} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Stock</label>
                  <input type="number" name="stock" className="form-control" value={formData.stock} onChange={handleChange} required />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Description</label>
                  <input type="text" name="description" className="form-control" value={formData.description} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" className="btn btn-success">
                {editingId ? "Update Medicine" : "Add Medicine"}
              </button>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Manufacturer</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med._id}>
                  <td>{med.name}</td>
                  <td>{med.category || "-"}</td>
                  <td>{med.manufacturer || "-"}</td>
                  <td>₹{med.price}</td>
                  <td>
                    <span className={`badge bg-${med.stock > 0 ? "success" : "danger"}`}>{med.stock}</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(med)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(med._id)}>
                      Delete
                    </button>
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

export default ManageMedicines;