import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/reports/my");
        setReports(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">My Medical Reports</h3>
        {loading ? (
          <p>Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-muted">No reports yet.</p>
        ) : (
          <div className="row g-3">
            {reports.map((r) => (
              <div className="col-md-6" key={r._id}>
                <div className="card shadow-sm p-3">
                  <h6>
                    Dr. {r.doctor?.name}{" "}
                    <span className="text-muted">({r.doctor?.specialization})</span>
                  </h6>
                  <p className="mb-1"><strong>Diagnosis:</strong> {r.diagnosis}</p>
                  {r.prescription && <p className="mb-1"><strong>Prescription:</strong> {r.prescription}</p>}
                  {r.notes && <p className="mb-1 text-muted"><strong>Notes:</strong> {r.notes}</p>}
                  <small className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyReports;