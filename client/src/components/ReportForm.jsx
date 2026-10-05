import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { labCategoryLabels } from "../utils/labCategories";

const statusText = { ordered: "Ordered", sample_collected: "Sample collected", completed: "Result ready" };
const statusColor = { ordered: "secondary", sample_collected: "info", completed: "success" };

const ReportForm = ({ reportId }) => {
  const isEdit = !!reportId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [appointments, setAppointments] = useState([]);
  const [appointmentId, setAppointmentId] = useState(searchParams.get("appointmentId") || "");
  const [patientLabel, setPatientLabel] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medicines, setMedicines] = useState([]); // { key, _id?, medicine, name, quantity, locked }
  const [labRows, setLabRows] = useState([]); // { key, testId, name, category, priority, instructions, status, locked }
  const [catalog, setCatalog] = useState([]);
  const [medSearch, setMedSearch] = useState("");
  const [medResults, setMedResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const cat = await api.get("/lab/tests");
        if (alive) setCatalog(cat.data);
      } catch (e) {
        toast.error("Could not load lab tests");
      }
      try {
        if (isEdit) {
          const { data: r } = await api.get(`/reports/doctor/${reportId}`);
          if (!alive) return;
          setPatientLabel(`${r.patient?.name || "Patient"}${r.patient?.hospitalId ? ` (${r.patient.hospitalId})` : ""}`);
          setDiagnosis(r.diagnosis || "");
          setPrescription(r.prescription || "");
          setNotes(r.notes || "");
          setFollowUpDate(r.followUpDate ? String(r.followUpDate).slice(0, 10) : "");
          setMedicines(
            (r.prescribedMedicines || []).map((m) => ({
              key: m._id,
              _id: m._id,
              medicine: m.medicine?._id,
              name: m.medicine?.name || "Medicine",
              quantity: m.quantity,
              locked: m.status === "dispensed",
            }))
          );
          setLabRows(
            (r.labOrders || [])
              .filter((o) => o.status !== "cancelled")
              .map((o) => ({
                key: o._id,
                testId: o.test,
                name: o.testName,
                category: o.category,
                priority: o.priority,
                instructions: o.instructions || "",
                status: o.status,
                locked: o.status !== "ordered",
              }))
          );
        } else {
          const res = await api.get("/reports/doctor/appointments");
          if (alive) setAppointments(res.data);
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Failed to load");
        if (isEdit) navigate("/doctor/reports");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  // Medicine search (debounced)
  useEffect(() => {
    const q = medSearch.trim();
    if (!q) {
      setMedResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/reports/doctor/medicines", { params: { q } });
        setMedResults(res.data);
      } catch (e) {
        console.error("Medicine search failed");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [medSearch]);

  const addMedicine = (m) => {
    if (medicines.some((x) => !x.locked && x.medicine === m._id)) {
      toast.info("This medicine is already added");
      return;
    }
    setMedicines((prev) => [...prev, { key: `new-${m._id}`, medicine: m._id, name: m.name, quantity: 1, locked: false }]);
    setMedSearch("");
    setMedResults([]);
  };
  const setQty = (key, quantity) => setMedicines((prev) => prev.map((m) => (m.key === key ? { ...m, quantity } : m)));
  const removeMedicine = (key) => setMedicines((prev) => prev.filter((m) => m.key !== key));

  const grouped = useMemo(() => {
    const g = {};
    for (const t of catalog) (g[t.category] = g[t.category] || []).push(t);
    return g;
  }, [catalog]);

  const addTest = (id) => {
    if (!id) return;
    const t = catalog.find((x) => x._id === id);
    if (!t) return;
    if (labRows.some((r) => r.testId === id)) {
      toast.info("This test is already ordered");
      return;
    }
    setLabRows((prev) => [
      ...prev,
      { key: `new-${id}`, testId: id, name: t.name, category: t.category, priority: "routine", instructions: "", status: "ordered", locked: false },
    ]);
  };
  const setLab = (key, patch) => setLabRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeLab = (key) => setLabRows((prev) => prev.filter((r) => r.key !== key));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) return toast.error("Diagnosis is required");
    if (!isEdit && !appointmentId) return toast.error("Please select a patient / appointment");

    const editableMeds = medicines.filter((m) => !m.locked);
    for (const m of editableMeds) {
      const q = Number(m.quantity);
      if (!Number.isInteger(q) || q < 1 || q > 100) return toast.error(`Enter a valid quantity for ${m.name}`);
    }

    const payload = {
      diagnosis,
      prescription,
      notes,
      followUpDate,
      prescribedMedicines: editableMeds.map((m) => ({
        ...(m._id ? { _id: m._id } : {}),
        medicine: m.medicine,
        quantity: Number(m.quantity),
      })),
      labTests: labRows
        .filter((r) => !r.locked)
        .map((r) => ({ testId: r.testId, priority: r.priority, instructions: r.instructions })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.put(`/reports/${reportId}`, payload);
        toast.success(res.data.message === "No changes" ? "No changes to save" : "Report updated");
      } else {
        await api.post("/reports", { appointmentId, ...payload });
        toast.success("Report saved");
      }
      navigate("/doctor/reports");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save report");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  const available = appointments.filter((a) => !a.hasReport);
  const alreadyDone = appointments.filter((a) => a.hasReport);

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "760px" }}>
      <div className="card shadow-sm p-4 mb-3">
        {isEdit ? (
          <div className="mb-3">
            <label className="form-label">Patient</label>
            <input className="form-control" value={patientLabel} disabled />
          </div>
        ) : (
          <div className="mb-3">
            <label className="form-label">Select Patient / Appointment</label>
            <select className="form-select" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} required>
              <option value="">-- Select --</option>
              {available.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.patient?.name}
                  {a.patient?.hospitalId ? ` (${a.patient.hospitalId})` : ""} — {new Date(a.date).toLocaleDateString()} ({a.timeSlot})
                </option>
              ))}
            </select>
            {alreadyDone.length > 0 && (
              <div className="form-text">
                {alreadyDone.length} appointment(s) ki report ban chuki hai. Unhe badalna ho to{" "}
                <Link to="/doctor/reports">Reports Given</Link> se Edit karo.
              </div>
            )}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Diagnosis</label>
          <input className="form-control" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Prescription / advice</label>
          <textarea className="form-control" rows={3} value={prescription} onChange={(e) => setPrescription(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="mb-1">
          <label className="form-label">Follow-up date (optional)</label>
          <input type="date" className="form-control" style={{ maxWidth: "220px" }} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
        </div>
      </div>

      {/* ---------- Medicines ---------- */}
      <div className="card shadow-sm p-4 mb-3">
        <h5>Medicines</h5>
        <div className="position-relative mb-3">
          <input className="form-control" placeholder="🔍 Search medicine to add" value={medSearch} onChange={(e) => setMedSearch(e.target.value)} />
          {medResults.length > 0 && (
            <div className="list-group position-absolute w-100 shadow" style={{ zIndex: 10, maxHeight: "240px", overflowY: "auto" }}>
              {medResults.map((m) => (
                <button type="button" key={m._id} className="list-group-item list-group-item-action d-flex justify-content-between" onClick={() => addMedicine(m)}>
                  <span>{m.name}</span>
                  <small className={m.stock > 0 ? "text-muted" : "text-danger"}>
                    ₹{m.price} · {m.stock > 0 ? `${m.stock} in stock` : "Out of stock"}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        {medicines.length === 0 && <p className="text-muted mb-0">No medicines added.</p>}
        {medicines.map((m) => (
          <div key={m.key} className="d-flex align-items-center gap-2 mb-2">
            <div className="flex-grow-1">
              {m.name}{" "}
              {m.locked && <span className="badge bg-success">Dispensed (locked)</span>}
            </div>
            <input
              type="number"
              min="1"
              max="100"
              className="form-control"
              style={{ width: "90px" }}
              value={m.quantity}
              disabled={m.locked}
              onChange={(e) => setQty(m.key, e.target.value)}
            />
            {!m.locked && (
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeMedicine(m.key)}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ---------- Lab tests ---------- */}
      <div className="card shadow-sm p-4 mb-3">
        <h5>Lab tests</h5>
        <select className="form-select mb-3" value="" onChange={(e) => addTest(e.target.value)}>
          <option value="">+ Add a lab test</option>
          {Object.entries(grouped).map(([cat, list]) => (
            <optgroup key={cat} label={labCategoryLabels[cat] || cat}>
              {list.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {labRows.length === 0 && <p className="text-muted mb-0">No lab tests ordered.</p>}
        {labRows.map((r) => (
          <div key={r.key} className="border rounded p-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <div className="flex-grow-1">
                <strong>{r.name}</strong>
                <div className="small text-muted">{labCategoryLabels[r.category] || r.category}</div>
              </div>
              {r.locked ? (
                <span className={`badge bg-${statusColor[r.status] || "secondary"}`}>{statusText[r.status] || r.status} (locked)</span>
              ) : (
                <>
                  <select className="form-select form-select-sm" style={{ width: "120px" }} value={r.priority} onChange={(e) => setLab(r.key, { priority: e.target.value })}>
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeLab(r.key)}>
                    ✕
                  </button>
                </>
              )}
            </div>
            {!r.locked && (
              <input
                className="form-control form-control-sm mt-2"
                placeholder="Instructions for lab (optional)"
                maxLength={500}
                value={r.instructions}
                onChange={(e) => setLab(r.key, { instructions: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <button type="submit" className="btn btn-success w-100" disabled={saving}>
        {saving ? "Saving..." : isEdit ? "Update Report" : "Save Report"}
      </button>
    </form>
  );
};

export default ReportForm;