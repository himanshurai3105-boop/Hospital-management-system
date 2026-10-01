import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPatients = async (term = "") => {
    try {
      const res = await api.get(`/admin/patients${term ? `?search=${term}` : ""}`);
      setPatients(res.data);
    } catch (error) {
      console.error(error);
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
        <h3 className="mb-4">All Patients</h3>
        <input
          type="text"
          className="form-control mb-4"
          placeholder="🔍 Search by name, Hospital ID, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Hospital ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id}>
                    <td>{p.hospitalId}</td>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.phone || "-"}</td>
                    <td>{p.age || "-"}</td>
                    <td>{p.gender || "-"}</td>
                    <td>
                      <Link to={`/admin/patients/${p._id}/record`} className="btn btn-sm btn-primary">
                        View Full Record
                      </Link>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted">No patients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ManagePatients;