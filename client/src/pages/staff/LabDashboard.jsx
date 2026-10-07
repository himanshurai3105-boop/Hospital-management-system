import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { labCategoryLabels } from "../../utils/labCategories";
import { openLabPdf } from "../../utils/labPdf";
import DashboardHero from "../../components/DashboardHero";
import { flagFor, rangeText, flagClass, flagText } from "../../utils/labFlags";

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

// ---------- Result entry / amend panel ----------
const ResultPanel = ({ orderId, mode, onClose, onDone }) => {
  const [order, setOrder] = useState(null);
  const [vals, setVals] = useState({});
  const [remarks, setRemarks] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/lab/orders/${orderId}`);
        if (!alive) return;
        setOrder(data);
        if (mode === "amend") {
          setVals(Object.fromEntries((data.result?.values || []).map((v) => [v.name, v.value])));
          setRemarks(data.result?.remarks || "");
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Could not load order");
        onClose();
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!order) return <div className="card p-3 mb-3">Loading...</div>;

  const params = order.parameters || [];

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      values: params.map((p) => ({ name: p.name, value: vals[p.name] ?? "" })),
      remarks,
      ...(mode === "amend" ? { reason } : {}),
    };
    setSaving(true);
    try {
      if (mode === "amend") await api.put(`/lab/orders/${orderId}/result`, payload);
      else await api.post(`/lab/orders/${orderId}/result`, payload);
      toast.success(mode === "amend" ? "Result amended" : "Result submitted");
      onDone();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save result");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card shadow p-4 mb-4 border-primary">
      <div className="d-flex justify-content-between">
        <div>
          <h5 className="mb-0">{mode === "amend" ? "Amend result" : "Enter result"}: {order.testName}</h5>
          <small className="text-muted">
            {order.patient?.name} ({order.patient?.hospitalId}) · {order.patient?.age ?? "-"} yrs · {order.patient?.gender || "-"}
            {" · "}Ordered by {order.doctor?.name}
            {order.sampleId && ` · Sample ${order.sampleId}`}
          </small>
        </div>
        <button className="btn btn-sm btn-link align-self-start" onClick={onClose}>Close</button>
      </div>

      {order.instructions && <div className="alert alert-info py-2 mt-3 mb-0">Doctor's note: {order.instructions}</div>}

      <form onSubmit={submit} className="mt-3">
        {params.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead className="table-light">
                <tr><th>Parameter</th><th style={{ width: "160px" }}>Result</th><th>Unit</th><th>Reference</th><th></th></tr>
              </thead>
              <tbody>
                {params.map((p) => {
                  const flag = flagFor(p, vals[p.name]);
                  return (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>
                        <input
                          className={`form-control form-control-sm ${flag === null ? "is-invalid" : ""}`}
                          value={vals[p.name] ?? ""}
                          onChange={(e) => setVals({ ...vals, [p.name]: e.target.value })}
                        />
                      </td>
                      <td>{p.unit}</td>
                      <td className="text-muted">{rangeText(p)}</td>
                      <td className={flagClass[flag] || ""}>{flagText[flag] || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">{params.length ? "Remarks (optional)" : "Report / findings"}</label>
          <textarea
            className="form-control"
            rows={params.length ? 2 : 6}
            maxLength={2000}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required={!params.length}
          />
        </div>

        {mode === "amend" && (
          <div className="mb-3">
            <label className="form-label">Reason for the change (patient ke record mein save hoga)</label>
            <input className="form-control" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} required minLength={5} />
          </div>
        )}

        <button className="btn btn-success" disabled={saving}>
          {saving ? "Saving..." : mode === "amend" ? "Save amendment" : "Submit result"}
        </button>
        {mode !== "amend" && <small className="text-muted ms-3">Submit ke baad result lock ho jaata hai, badlav sirf Amend se.</small>}
      </form>
    </div>
  );
};

// ---------- Dashboard ----------
const LabDashboard = () => {
  const { user } = useAuth();
  const [view, setView] = useState("pending");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ orders: [], total: 0, pages: 1 });
  const [panel, setPanel] = useState(null); // { id, mode }

  const badRange = from && to && from > to;

  useEffect(() => setPage(1), [view, q, from, to]);

  const load = useCallback(async () => {
    if (badRange) return;
    const params = { view, page };
    if (q.trim()) params.q = q.trim();
    if (from) params.from = from;
    if (to) params.to = to;
    try {
      const res = await api.get("/lab/queue", { params });
      setData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load the queue");
    }
  }, [view, q, from, to, page, badRange]);

  useEffect(() => {
    const t = setTimeout(load, 400);
    const iv = setInterval(load, 30000);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [load]);

  const collect = async (o) => {
    try {
      const res = await api.put(`/lab/orders/${o._id}/collect-sample`);
      toast.success(`Sample ID: ${res.data.sampleId}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not update");
    }
    load();
  };

  const pdf = async (id) => {
    try {
      await openLabPdf(id);
    } catch (e) {
      toast.error("Could not open the PDF");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
                      <DashboardHero
          icon="🧪"
          title="Lab Dashboard"
          subtitle={`${user?.name} · ${labCategoryLabels[user?.labSpecialization] || "Lab"}`}
        />
        {panel && (
          <ResultPanel
            key={`${panel.id}-${panel.mode}`}
            orderId={panel.id}
            mode={panel.mode}
            onClose={() => setPanel(null)}
            onDone={() => {
              setPanel(null);
              load();
            }}
          />
        )}

        <div className="card p-3 mb-3 shadow-sm">
          <div className="btn-group btn-group-sm mb-2" role="group">
            <button className={`btn ${view === "pending" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setView("pending")}>
              Pending
            </button>
            <button className={`btn ${view === "done" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setView("done")}>
              Completed
            </button>
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="🔍 Patient name, Hospital ID, doctor name, test or sample ID"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-3">
              <input type="date" className="form-control" title="From" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="col-6 col-md-3">
              <input type="date" className="form-control" title="To" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {badRange && <div className="text-danger small mt-2">"From" date "To" date se pehle honi chahiye.</div>}
          <small className="text-muted mt-2">
            {data.total} {view === "pending" ? "pending" : "completed"} order(s) · updates every 30s
          </small>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th>Patient</th>
                <th>Test</th>
                <th>Ordered by</th>
                <th>{view === "done" ? "Reported" : "Ordered"}</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.orders.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted">Nothing here.</td></tr>
              )}
              {data.orders.map((o) => (
                <tr key={o._id} className={o.priority === "urgent" ? "table-danger" : ""}>
                  <td>
                    <strong>{o.patient?.name}</strong>
                    <div className="small text-muted">
                      {o.patient?.hospitalId} · {o.patient?.age ?? "-"} yrs · {o.patient?.gender || "-"}
                    </div>
                  </td>
                  <td>
                    {o.testName} {o.priority === "urgent" && <span className="badge bg-danger">Urgent</span>}
                    {o.instructions && <div className="small text-muted">Note: {o.instructions}</div>}
                    {o.sampleId && <div className="small text-muted">Sample {o.sampleId}</div>}
                  </td>
                  <td>{o.doctor?.name}</td>
                  <td>{fmt(view === "done" ? o.submittedAt : o.createdAt)}</td>
                  <td>
                    <span className={`badge bg-${o.status === "completed" ? "success" : o.status === "sample_collected" ? "info" : "secondary"}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {o.status === "ordered" && (
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => collect(o)}>Collect sample</button>
                    )}
                    {(o.status === "ordered" || o.status === "sample_collected") && (
                      <button className="btn btn-sm btn-primary" onClick={() => setPanel({ id: o._id, mode: "result" })}>
                        Enter result
                      </button>
                    )}
                    {o.status === "completed" && (
                      <>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => pdf(o._id)}>PDF</button>
                        <button className="btn btn-sm btn-outline-warning" onClick={() => setPanel({ id: o._id, mode: "amend" })}>
                          Amend
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.pages > 1 && (
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
            <small>Page {data.page} of {data.pages}</small>
            <button className="btn btn-sm btn-outline-secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
};

export default LabDashboard;