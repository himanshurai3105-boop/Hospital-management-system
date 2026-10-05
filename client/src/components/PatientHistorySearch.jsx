import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const PatientHistorySearch = ({ endpoint, recordPath }) => {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("all"); // all | date | month | year
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("completed");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setPage(1), [q, mode, value, status, endpoint]);

  useEffect(() => {
    if (mode !== "all" && !value) return; // date/month/year chuna hai par value nahi daali
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { q, status, page };
        if (mode !== "all") params[mode] = value;
        const res = await api.get(endpoint, { params });
        setData(res.data);
      } catch (e) {
        console.error("Patient history failed");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [endpoint, q, mode, value, status, page]);

  const changeMode = (m) => {
    setMode(m);
    setValue("");
  };

  return (
    <div>
      <div className="card p-3 mb-3 shadow-sm">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="🔍 Patient name, Hospital ID or phone"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={mode} onChange={(e) => changeMode(e.target.value)}>
              <option value="all">All time</option>
              <option value="date">Single date</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div className="col-md-3">
            {mode === "date" && <input type="date" className="form-control" value={value} onChange={(e) => setValue(e.target.value)} />}
            {mode === "month" && <input type="month" className="form-control" value={value} onChange={(e) => setValue(e.target.value)} />}
            {mode === "year" && (
              <input type="number" min="2000" max="2100" placeholder="e.g. 2026" className="form-control" value={value} onChange={(e) => setValue(e.target.value)} />
            )}
          </div>
          <div className="col-md-3">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="completed">Checked-up patients</option>
              <option value="all">Including upcoming</option>
            </select>
          </div>
        </div>
        {data && (
          <p className="text-muted small mt-2 mb-0">
            {data.total} patient{data.total === 1 ? "" : "s"} found {loading && "· updating..."}
          </p>
        )}
      </div>

      {mode !== "all" && !value && <p className="text-muted">Select a {mode} to see patients.</p>}

      {data && (
        <div className="table-responsive">
          <table className="table table-bordered align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th>Patient</th>
                <th>Hospital ID</th>
                <th>Phone</th>
                <th>Visits</th>
                <th>Last visit</th>
                <th>Next appointment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.patients.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted">No patients found.</td></tr>
              )}
              {data.patients.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.hospitalId || "—"}</td>
                  <td>{p.phone || "—"}</td>
                  <td>{p.visits}</td>
                  <td>{fmt(p.lastVisit)}</td>
                  <td>{fmt(p.nextAppointment)}</td>
                  <td>
                    <Link className="btn btn-sm btn-outline-primary" to={recordPath(p._id)}>
                      View record
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.pages > 1 && (
            <div className="d-flex justify-content-between align-items-center">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <small>Page {data.page} of {data.pages}</small>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientHistorySearch;