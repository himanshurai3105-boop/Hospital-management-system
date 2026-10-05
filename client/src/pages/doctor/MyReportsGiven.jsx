import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const labStatusText = { ordered: "Ordered", sample_collected: "Sample collected", completed: "Result ready", cancelled: "Cancelled" };
const labStatusColor = { ordered: "secondary", sample_collected: "info", completed: "success", cancelled: "danger" };

const MyReportsGiven = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/reports/doctor/my-reports");
        setReports(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const term = search.trim().toLowerCase();
  const shown = reports.filter(
    (r) =>
      !term ||
      r.patient?.name?.toLowerCase().includes(term) ||
      r.patient?.hospitalId?.toLowerCase().includes(term)
  );

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Reports Given</h3>
          <Link to="/doctor/add-report" className="btn btn-primary">+ Add Report</Link>
        </div>

        <input
          className="form-control mb-4"
          style={{ maxWidth: "420px" }}
          placeholder="🔍 Patient name or Hospital ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p>Loading...</p>
        ) : shown.length === 0 ? (
          <p className="text-muted">No reports found.</p>
        ) : (
          <div className="row g-3">
            {shown.map((r) => {
              const labs = (r.labOrders || []).filter((o) => o.status !== "cancelled");
              return (
                <div className="col-md-6" key={r._id}>
                  <div className="card shadow-sm p-3 h-100">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="mb-0">{r.patient?.name}</h6>
                        <small className="text-muted">{r.patient?.hospitalId}</small>
                      </div>
                      <Link to={`/doctor/reports/${r._id}/edit`} className="btn btn-sm btn-outline-primary align-self-start">
                        Edit
                      </Link>
                    </div>

                    <p className="mb-1 mt-2"><strong>Diagnosis:</strong> {r.diagnosis}</p>
                    {r.prescription && <p className="mb-1"><strong>Advice:</strong> {r.prescription}</p>}
                    {r.notes && <p className="mb-1 text-muted"><strong>Notes:</strong> {r.notes}</p>}

                    {r.prescribedMedicines?.length > 0 && (
                      <div className="mb-1">
                        <strong>Medicines:</strong>
                        <ul className="mb-0 ps-3">
                          {r.prescribedMedicines.map((m) => (
                            <li key={m._id}>
                              {m.medicine?.name} × {m.quantity}{" "}
                              <span className={`badge bg-${m.status === "dispensed" ? "success" : "warning text-dark"}`}>
                                {m.status === "dispensed" ? "Dispensed" : "Pending"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {labs.length > 0 && (
                      <div className="mb-1">
                        <strong>Lab tests:</strong>
                        <ul className="mb-0 ps-3">
                          {labs.map((o) => (
                            <li key={o._id}>
                              {o.testName}{" "}
                              <span className={`badge bg-${labStatusColor[o.status] || "secondary"}`}>
                                {labStatusText[o.status] || o.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {r.followUpDate && (
                      <p className="mb-1 small"><strong>Follow-up:</strong> {new Date(r.followUpDate).toLocaleDateString()}</p>
                    )}

                    <small className="text-muted mt-auto">
                      {new Date(r.createdAt).toLocaleDateString()}
                      {r.editedAt && ` · Edited ${new Date(r.editedAt).toLocaleDateString()}`}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MyReportsGiven;