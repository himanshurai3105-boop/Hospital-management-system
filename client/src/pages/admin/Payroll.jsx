import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Payroll = () => {
  const [salaries, setSalaries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const fetchSalaries = async () => {
    try {
      const res = await api.get(`/salary/all?month=${selectedMonth}&year=${selectedYear}`);
      setSalaries(res.data);
    } catch (error) {
      toast.error("Failed to load salary records");
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [selectedMonth, selectedYear]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/salary/generate", { month: selectedMonth, year: selectedYear });
      toast.success(res.data.message);
      fetchSalaries();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate salary");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/salary/${id}/pay`);
      toast.success("Marked as paid");
      fetchSalaries();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const totalAmount = salaries.reduce((sum, s) => sum + s.amount, 0);
  const paidAmount = salaries.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.amount, 0);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Payroll Management</h3>

        <div className="card shadow-sm p-4 mb-4">
          <div className="row align-items-end">
            <div className="col-md-3 mb-3">
              <label className="form-label">Month</label>
              <select className="form-select" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {months.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-control"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              />
            </div>
            <div className="col-md-3 mb-3">
              <button className="btn btn-primary w-100" onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating..." : "Generate Salary"}
              </button>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted">Total Payroll ({months[selectedMonth - 1]} {selectedYear})</h6>
              <h3>₹{totalAmount}</h3>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted">Paid So Far</h6>
              <h3 className="text-success">₹{paidAmount}</h3>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Doctor</th>
                <th>Hospital ID</th>
                <th>Specialization</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">No salary records for this period. Click "Generate Salary".</td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s._id}>
                    <td>{s.doctor?.name}</td>
                    <td>{s.doctor?.hospitalId}</td>
                    <td>{s.doctor?.specialization}</td>
                    <td>₹{s.amount}</td>
                    <td>
                      <span className={`badge bg-${s.status === "paid" ? "success" : "warning"}`}>{s.status}</span>
                    </td>
                    <td>
                      {s.status === "pending" && (
                        <button className="btn btn-sm btn-success" onClick={() => handleMarkPaid(s._id)}>
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Payroll;