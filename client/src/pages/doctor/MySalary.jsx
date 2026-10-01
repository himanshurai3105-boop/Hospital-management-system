import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MySalary = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const res = await api.get("/salary/my");
        setSalaries(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalaries();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">My Salary</h3>
        {loading ? (
          <p>Loading...</p>
        ) : salaries.length === 0 ? (
          <p className="text-muted">No salary records yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Paid Date</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s) => (
                  <tr key={s._id}>
                    <td>{months[s.month - 1]} {s.year}</td>
                    <td>₹{s.amount}</td>
                    <td>
                      <span className={`badge bg-${s.status === "paid" ? "success" : "warning"}`}>{s.status}</span>
                    </td>
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

export default MySalary;