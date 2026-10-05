import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toast } from "react-toastify";

const PharmacyDashboard = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [pendingMeds, setPendingMeds] = useState([]);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: true/false }
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/pharmacy/patients/search?q=${searchTerm}`);
        setSearchResults(res.data);
      } catch (error) {
        console.error(error);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedItems({});
    try {
      const res = await api.get(`/pharmacy/patients/${patient._id}/pending-medicines`);
      setPendingMeds(res.data);
    } catch (error) {
      toast.error("Failed to load prescribed medicines");
    }
  };

  const toggleItem = (itemId) => {
    setSelectedItems({ ...selectedItems, [itemId]: !selectedItems[itemId] });
  };

  const getSelectedList = () => pendingMeds.filter((m) => selectedItems[m.itemId]);

  const totalAmount = getSelectedList().reduce((sum, m) => sum + (m.medicine?.price || 0) * m.quantity, 0);

  const handleDispense = async () => {
    const items = getSelectedList().map((m) => ({
      reportId: m.reportId,
      itemId: m.itemId,
      medicineId: m.medicine._id,
      quantity: m.quantity,
    }));

    if (items.length === 0) {
      toast.error("Select at least one medicine");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/pharmacy/dispense", {
        patientId: selectedPatient._id,
        items,
        paymentMethod,
      });

      if (paymentMethod === "cash") {
        toast.success("Medicines dispensed! Cash payment recorded.");
        resetSelection();
      } else {
        const { data } = await api.post("/payments/create-order", { amount: totalAmount });
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "CityCare Hospital Pharmacy",
          description: `Medicines for ${selectedPatient.name}`,
          order_id: data.orderId,
          handler: async (response) => {
            try {
              await api.post(`/pharmacy/dispense/${res.data._id}/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Payment verified! Medicines dispensed.");
              resetSelection();
            } catch (error) {
              toast.error("Payment verification failed");
            }
          },
          theme: { color: "#0d6efd" },
          method: { netbanking: true, card: true, upi: true, wallet: true },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Dispense failed");
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedPatient(null);
    setPendingMeds([]);
    setSelectedItems({});
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
        <span className="navbar-brand">🏥 Hospital MS — Pharmacy Counter</span>
        <div className="ms-auto">
          <button className="btn btn-light btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="container mt-4 mb-5">
        <h3 className="mb-4">Welcome, {user?.name}</h3>

        {!selectedPatient ? (
          <div className="card shadow-sm p-4" style={{ maxWidth: "500px" }}>
            <h5 className="mb-3">Find Patient</h5>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search by name, Hospital ID, or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchResults.map((p) => (
              <div key={p._id} className="d-flex justify-content-between align-items-center border rounded p-2 mt-2">
                <div>
                  <strong>{p.name}</strong> <br />
                  <small className="text-muted">{p.hospitalId} • {p.phone}</small>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => handleSelectPatient(p)}>Select</button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="alert alert-success d-flex justify-content-between align-items-center">
              <div><strong>{selectedPatient.name}</strong> — {selectedPatient.hospitalId}</div>
              <button className="btn btn-sm btn-outline-dark" onClick={resetSelection}>Change Patient</button>
            </div>

            <h5 className="mb-3">Prescribed Medicines (Pending)</h5>
            {pendingMeds.length === 0 ? (
              <p className="text-muted">No pending prescribed medicines for this patient.</p>
            ) : (
              <div className="table-responsive mb-4">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th></th>
                      <th>Medicine</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Prescribed By</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMeds.map((m) => (
                      <tr key={m.itemId}>
                        <td>
                          <input type="checkbox" checked={!!selectedItems[m.itemId]} onChange={() => toggleItem(m.itemId)} />
                        </td>
                        <td>{m.medicine?.name}</td>
                        <td>{m.quantity}</td>
                        <td>₹{m.medicine?.price}</td>
                        <td>Dr. {m.doctor?.name}</td>
                        <td>{new Date(m.prescribedDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {getSelectedList().length > 0 && (
              <div className="card shadow-sm p-4" style={{ maxWidth: "400px" }}>
                <h6>Total: ₹{totalAmount}</h6>
                <div className="mb-3">
                  <label className="form-label d-block">Payment Method</label>
                  <div className="btn-group w-100">
                    <button type="button" className={`btn ${paymentMethod === "cash" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setPaymentMethod("cash")}>💵 Cash</button>
                    <button type="button" className={`btn ${paymentMethod === "online" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setPaymentMethod("online")}>💳 Online</button>
                  </div>
                </div>
                <button className="btn btn-success w-100" onClick={handleDispense} disabled={loading}>
                  {loading ? "Processing..." : "Dispense & Collect Payment"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PharmacyDashboard;