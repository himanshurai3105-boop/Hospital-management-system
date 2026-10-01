import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const statusColors = { scheduled: "warning", completed: "success", cancelled: "danger" };

const MyCheckups = () => {
  const [checkups, setCheckups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheckups = async () => {
      try {
        const res = await api.get("/equipment/my-checkups");
        setCheckups(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckups();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">My Checkups & Tests</h3>
        {loading ? (
          <p>Loading...</p>
        ) : checkups.length === 0 ? (
          <p className="text-muted">No checkups scheduled yet.</p>
        ) : (
          <div className="row g-3">
            {checkups.map((c) => (
              <div className="col-md-6" key={c._id}>
                <div className="card shadow-sm p-3">
                  <div className="d-flex justify-content-between">
                    <h6>{c.equipment?.name} ({c.equipment?.type})</h6>
                    <span className={`badge bg-${statusColors[c.status]}`}>{c.status}</span>
                  </div>
                  <p className="mb-1">Dr. {c.doctor?.name} ({c.doctor?.specialization})</p>
                  <p className="mb-1">Date: {new Date(c.scheduledDate).toLocaleDateString()}</p>
                  <p className="mb-0">Cost: ₹{c.equipment?.costPerUse}</p>
                  {c.status === "completed" && (
                    <p className="mb-0 mt-2 text-muted"><strong>Result:</strong> {c.resultNotes || "-"}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyCheckups;