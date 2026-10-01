import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom";

const statusColors = { pending: "warning", confirmed: "info", delivered: "success", cancelled: "danger" };

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/medicines/my-orders");
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePay = async (order) => {
    setPayingId(order._id);
    try {
      const { data } = await api.post("/payments/create-order", { amount: order.totalAmount });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "CityCare Hospital",
        description: "Medicine Order Payment",
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await api.post("/payments/verify/medicine-order", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });
            toast.success("Payment successful!");
            fetchOrders();
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#0d6efd" },
        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: true,
          paylater: true,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Failed to initiate payment");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">My Medicine Orders</h3>
        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-muted">No orders yet.</p>
        ) : (
          <div className="row g-3">
            {orders.map((order) => (
              <div className="col-md-6" key={order._id}>
                <div className="card shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">{new Date(order.createdAt).toLocaleDateString()}</small>
                    <span className={`badge bg-${statusColors[order.status]}`}>{order.status}</span>
                  </div>
                  {order.items.map((item, idx) => (
                    <p className="mb-1" key={idx}>
                      {item.medicine?.name} x {item.quantity} — ₹{item.priceAtOrder * item.quantity}
                    </p>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <p className="fw-bold mb-0">Total: ₹{order.totalAmount}</p>
                  {order.paymentStatus === "paid" ? (
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success">Paid</span>
                    <Link to={`/patient/receipt/${order._id}?type=order`} className="btn btn-sm btn-outline-secondary">
                      View Receipt
                    </Link>
                  </div>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handlePay(order)}
                    disabled={payingId === order._id}
                  >
                    {payingId === order._id ? "Processing..." : "Pay Now"}
                  </button>
                )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrders;