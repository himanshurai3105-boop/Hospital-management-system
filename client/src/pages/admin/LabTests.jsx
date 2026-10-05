import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import { labCategoryLabels } from "../../utils/labCategories";

const emptyParam = { name: "", unit: "", refMin: "", refMax: "", refText: "" };
const emptyForm = { name: "", category: "pathology", price: "", parameters: [] };

const LabTests = () => {
  const [tests, setTests] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchTests = async () => {
    try {
      const res = await api.get("/lab/tests", { params: { all: 1 } });
      setTests(res.data);
    } catch (error) {
      toast.error("Failed to load lab tests");
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const setParam = (i, patch) =>
    setForm((f) => ({ ...f, parameters: f.parameters.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  const addParam = () => setForm((f) => ({ ...f, parameters: [...f.parameters, { ...emptyParam }] }));
  const removeParam = (i) => setForm((f) => ({ ...f, parameters: f.parameters.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/lab/tests/${editingId}`, form);
        toast.success("Test updated");
      } else {
        await api.post("/lab/tests", form);
        toast.success("Test added");
      }
      resetForm();
      fetchTests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save test");
    }
  };

  const handleEdit = (t) => {
    setForm({
      name: t.name,
      category: t.category,
      price: t.price ?? "",
      parameters: (t.parameters || []).map((p) => ({
        name: p.name || "",
        unit: p.unit || "",
        refMin: p.refMin ?? "",
        refMax: p.refMax ?? "",
        refText: p.refText || "",
      })),
    });
    setEditingId(t._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = async (t) => {
    if (t.isActive && !window.confirm(`Deactivate "${t.name}"? Doctors will not be able to order it. Existing orders are not affected.`)) return;
    try {
      await api.put(`/lab/tests/${t._id}/toggle`);
      fetchTests();
    } catch (error) {
      toast.error("Could not update test");
    }
  };

  const seedDefaults = async () => {
    try {
      const res = await api.post("/lab/tests/seed-defaults");
      toast.success(res.data.message);
      fetchTests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add default tests");
    }
  };

  const filtered = tests.filter(
    (t) =>
      (category === "all" || t.category === category) &&
      (!search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Lab Tests</h3>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={seedDefaults}>
              Add common tests
            </button>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
              {showForm ? "Cancel" : "+ Add Test"}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card p-4 mb-4 shadow-sm">
            <h5>{editingId ? "Edit Test" : "Add New Test"}</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-5 mb-3">
                  <label className="form-label">Test name</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="col-md-5 mb-3">
                  <label className="form-label">Category (kaun si lab karegi)</label>
                  <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {Object.entries(labCategoryLabels).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" min="0" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
              </div>

              <h6>Result parameters</h6>
              <p className="text-muted small">
                Lab technician ke result form aur PDF ka table inhi se banta hai. Scan jaise tests (X-ray) mein khali chhod sakte ho.
                Number wali range ke liye Min/Max, text wali ke liye "Normal text" bharo.
              </p>
              {form.parameters.map((p, i) => (
                <div className="row g-2 mb-2" key={i}>
                  <div className="col-md-3"><input className="form-control" placeholder="Name (e.g. Hemoglobin)" value={p.name} onChange={(e) => setParam(i, { name: e.target.value })} required /></div>
                  <div className="col-md-2"><input className="form-control" placeholder="Unit" value={p.unit} onChange={(e) => setParam(i, { unit: e.target.value })} /></div>
                  <div className="col-md-2"><input type="number" step="any" className="form-control" placeholder="Min" value={p.refMin} onChange={(e) => setParam(i, { refMin: e.target.value })} /></div>
                  <div className="col-md-2"><input type="number" step="any" className="form-control" placeholder="Max" value={p.refMax} onChange={(e) => setParam(i, { refMax: e.target.value })} /></div>
                  <div className="col-md-2"><input className="form-control" placeholder="Normal text" value={p.refText} onChange={(e) => setParam(i, { refText: e.target.value })} /></div>
                  <div className="col-md-1"><button type="button" className="btn btn-outline-danger w-100" onClick={() => removeParam(i)}>✕</button></div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-primary mb-3" onClick={addParam}>+ Add parameter</button>
              <div>
                <button type="submit" className="btn btn-success">{editingId ? "Update Test" : "Save Test"}</button>
              </div>
            </form>
          </div>
        )}

        <div className="card p-3 mb-3 shadow-sm">
          <div className="row g-2">
            <div className="col-md-8">
              <input className="form-control" placeholder="🔍 Search test" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-4">
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories ({tests.length})</option>
                {Object.entries(labCategoryLabels).map(([k, label]) => (
                  <option key={k} value={k}>{label} ({tests.filter((t) => t.category === k).length})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th>Test</th>
                <th>Category</th>
                <th>Price</th>
                <th>Parameters</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted">No tests yet. "Add common tests" dabao ya naya test jodo.</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t._id} className={!t.isActive ? "table-secondary" : ""}>
                  <td>{t.name}</td>
                  <td>{labCategoryLabels[t.category] || t.category}</td>
                  <td>₹{t.price || 0}</td>
                  <td>{t.parameters?.length || 0}</td>
                  <td>
                    <span className={`badge bg-${t.isActive ? "success" : "danger"}`}>{t.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(t)}>Edit</button>
                    <button className={`btn btn-sm btn-outline-${t.isActive ? "warning" : "success"}`} onClick={() => handleToggle(t)}>
                      {t.isActive ? "Deactivate" : "Activate"}
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

export default LabTests;