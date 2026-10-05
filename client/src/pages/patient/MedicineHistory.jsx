import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const MedicineHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/pharmacy/my-history");
        setHistory(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">My Medicine History</h3>
        {loading ? (
          <p>Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-muted">No medicines dispensed yet.</p>
        ) : (
          <div className="row g-3">
            {history.map((h) => (
              <div className="col-md-6" key={h._id}>
                <div className="card shadow-sm p-3">
                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">{new Date(h.createdAt).toLocaleDateString()}</small>
                    <span className={`badge bg-${h.paymentStatus === "paid" ? "success" : "warning"}`}>
                      {h.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                  {h.items.map((item, idx) => (
                    <p className="mb-1" key={idx}>{item.medicine?.name} x {item.quantity} — ₹{item.priceAtDispense * item.quantity}</p>
                  ))}
                  <hr />
                  <p className="fw-bold mb-1">Total: ₹{h.totalAmount}</p>
                  <small className="text-muted">Dispensed by {h.pharmacist?.name} • {h.paymentMethod}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MedicineHistory;