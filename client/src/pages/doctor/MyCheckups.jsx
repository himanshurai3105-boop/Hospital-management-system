import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const statusColors = { scheduled: "warning", completed: "success", cancelled: "danger" };

const MyCheckups = () => {
  const [checkups, setCheckups] = useState([]);
  const [notesInput, setNotesInput] = useState({});

  const fetchCheckups = async () => {
    try {
      const res = await api.get("/equipment/doctor/checkups");
      setCheckups(res.data);
    } catch (error) {
      toast.error("Failed to load checkups");
    }
  };

  useEffect(() => {
    fetchCheckups();
  }, []);

  const handleComplete = async (id) => {
    try {
      await api.put(`/equipment/checkup/${id}/complete`, { resultNotes: notesInput[id] || "" });
      toast.success("Checkup marked as completed");
      fetchCheckups();
    } catch (error) {
      toast.error("Failed to complete checkup");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Scheduled Checkups</h3>
        {checkups.length === 0 ? (
          <p className="text-muted">No checkups scheduled yet.</p>
        ) : (
          <div className="row g-3">
            {checkups.map((c) => (
              <div className="col-md-6" key={c._id}>
                <div className="card shadow-sm p-3">
                  <div className="d-flex justify-content-between">
                    <h6>{c.patient?.name}</h6>
                    <span className={`badge bg-${statusColors[c.status]}`}>{c.status}</span>
                  </div>
                  <p className="mb-1"><strong>Test:</strong> {c.equipment?.name} ({c.equipment?.type})</p>
                  <p className="mb-2"><strong>Date:</strong> {new Date(c.scheduledDate).toLocaleDateString()}</p>
                  {c.status === "completed" ? (
                    <p className="mb-0 text-muted"><strong>Result:</strong> {c.resultNotes || "-"}</p>
                  ) : (
                    <>
                      <textarea
                        className="form-control mb-2"
                        placeholder="Enter result notes"
                        rows={2}
                        onChange={(e) => setNotesInput({ ...notesInput, [c._id]: e.target.value })}
                      />
                      <button className="btn btn-sm btn-success" onClick={() => handleComplete(c._id)}>
                        Mark as Completed
                      </button>
                    </>
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