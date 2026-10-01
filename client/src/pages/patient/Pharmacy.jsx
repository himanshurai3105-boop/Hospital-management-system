import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const Pharmacy = () => {
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState({}); // { medicineId: quantity }
  const [loading, setLoading] = useState(false);

  const fetchMedicines = async () => {
    try {
      const res = await api.get("/medicines");
      setMedicines(res.data);
    } catch (error) {
      toast.error("Failed to load medicines");
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const updateQty = (id, qty) => {
    if (qty < 0) return;
    setCart({ ...cart, [id]: qty });
  };

  const cartItems = Object.entries(cart).filter(([_, qty]) => qty > 0);
  const totalAmount = cartItems.reduce((sum, [id, qty]) => {
    const med = medicines.find((m) => m._id === id);
    return sum + (med ? med.price * qty : 0);
  }, 0);

  const handleOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Add at least one medicine to order");
      return;
    }
    setLoading(true);
    try {
      const items = cartItems.map(([medicineId, quantity]) => ({ medicineId, quantity }));
      await api.post("/medicines/order", { items });
      toast.success("Order placed successfully!");
      setCart({});
      fetchMedicines();
    } catch (error) {
      toast.error(error.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Pharmacy</h3>

        <div className="row g-3">
          {medicines.map((med) => (
            <div className="col-md-4" key={med._id}>
              <div className="card shadow-sm p-3">
                <h6>{med.name}</h6>
                <p className="mb-1 text-muted small">{med.category}</p>
                <p className="mb-1">₹{med.price}</p>
                <p className="mb-2">
                  <span className={`badge bg-${med.stock > 0 ? "success" : "danger"}`}>
                    {med.stock > 0 ? `${med.stock} in stock` : "Out of stock"}
                  </span>
                </p>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => updateQty(med._id, (cart[med._id] || 0) - 1)}
                    disabled={!cart[med._id]}
                  >
                    -
                  </button>
                  <span>{cart[med._id] || 0}</span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => updateQty(med._id, (cart[med._id] || 0) + 1)}
                    disabled={(cart[med._id] || 0) >= med.stock}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cartItems.length > 0 && (
          <div className="card shadow-sm p-4 mt-4" style={{ maxWidth: "400px" }}>
            <h5>Order Summary</h5>
            {cartItems.map(([id, qty]) => {
              const med = medicines.find((m) => m._id === id);
              return (
                <div className="d-flex justify-content-between" key={id}>
                  <span>{med?.name} x {qty}</span>
                  <span>₹{med?.price * qty}</span>
                </div>
              );
            })}
            <hr />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total</span>
              <span>₹{totalAmount}</span>
            </div>
            <button className="btn btn-success w-100 mt-3" onClick={handleOrder} disabled={loading}>
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Pharmacy;