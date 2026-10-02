import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [salaries, setSalaries] = useState([]);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const res = await api.get("/salary/my");
        setSalaries(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSalaries();
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
        <span className="navbar-brand">🏥 Hospital MS — Staff Portal</span>
        <div className="ms-auto">
          <button className="btn btn-light btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="container mt-4">
        <h3 className="mb-4">Welcome, {user?.name}</h3>

        <h5 className="mb-3">My Salary History</h5>
        {salaries.length === 0 ? (
          <p className="text-muted">No salary records yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr><th>Month</th><th>Amount</th><th>Status</th><th>Paid Date</th></tr>
              </thead>
              <tbody>
                {salaries.map((s) => (
                  <tr key={s._id}>
                    <td>{months[s.month - 1]} {s.year}</td>
                    <td>₹{s.amount}</td>
                    <td><span className={`badge bg-${s.status === "paid" ? "success" : "warning"}`}>{s.status}</span></td>
                    <td>{s.paidDate ? new Date(s.paidDate).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default StaffDashboard;