import { useState, useEffect } from "react";
import api from "../services/api";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const PharmacyHistory = ({ endpoint }) => {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(endpoint);
        if (alive) setItems(res.data);
      } catch (e) {
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [endpoint]);

  if (items === null) return <p className="text-muted">Loading...</p>;
  if (items.length === 0) return <p className="text-muted">No medicines dispensed yet.</p>;

  return (
    <div className="table-responsive mb-4">
      <table className="table table-bordered table-sm align-middle">
        <thead className="table-light">
          <tr><th>Date</th><th>Medicines</th><th>Total</th><th>Payment</th><th>Pharmacist</th></tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td>{fmt(d.createdAt)}</td>
              <td>
                {d.items.map((it, i) => (
                  <div key={i}>{it.medicine?.name} × {it.quantity}</div>
                ))}
              </td>
              <td>₹{d.totalAmount}</td>
              <td>
                <span className={`badge bg-${d.paymentStatus === "paid" ? "success" : "warning text-dark"}`}>
                  {d.paymentStatus} ({d.paymentMethod})
                </span>
              </td>
              <td>{d.pharmacist?.name || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PharmacyHistory;