import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const MyPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPatients = async (term = "") => {
    try {
      const res = await api.get(`/doctors/my-patients${term ? `?search=${term}` : ""}`);
      setPatients(res.data);
    } catch (error) {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => fetchPatients(search), 400);
    return () => clearTimeout(delay);
  }, [search]);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">My Patients</h3>
        <input
          type="text"
          className="form-control mb-4"
          placeholder="🔍 Search by patient name or Hospital ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? (
          <p>Loading...</p>
        ) : patients.length === 0 ? (
          <p className="text-muted">No patients found.</p>
        ) : (
          <div className="row g-3">
            {patients.map((p) => (
              <div className="col-md-4" key={p._id}>
                <div className="card shadow-sm p-3">
                  <h6 className="mb-1">{p.name}</h6>
                  <p className="mb-1 text-muted small">{p.hospitalId} • {p.email}</p>
                  <p className="mb-2 small">
                    {p.age ? `${p.age} yrs` : "-"} • {p.gender || "-"} • {p.phone || "-"}
                  </p>
                  <Link to={`/doctor/patients/${p._id}`} className="btn btn-sm btn-primary">
                    View Medical History
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyPatients;