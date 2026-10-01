import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const statusColors = { pending: "warning", confirmed: "info", completed: "success", cancelled: "danger" };

const MyRoomBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get("/rooms/my-bookings");
      setBookings(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const calculateAmount = (booking) => {
    const days = Math.max(
      1,
      Math.ceil((new Date(booking.toDate) - new Date(booking.fromDate)) / (1000 * 60 * 60 * 24))
    );
    return days * (booking.room?.pricePerDay || 0);
  };

  const handlePay = async (booking) => {
    setPayingId(booking._id);
    try {
      const amount = calculateAmount(booking);
      const { data } = await api.post("/payments/create-order", { amount });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "CityCare Hospital",
        description: `Room ${booking.room?.roomNumber} Booking Payment`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await api.post("/payments/verify/room-booking", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            });
            toast.success("Payment successful!");
            fetchBookings();
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#0d6efd" },
        method: { netbanking: true, card: true, upi: true, wallet: true, paylater: true },
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
        <h3 className="mb-4">My Room Bookings</h3>
        {loading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-muted">No room bookings yet.</p>
        ) : (
          <div className="row g-3">
            {bookings.map((b) => (
              <div className="col-md-6" key={b._id}>
                <div className="card shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">
                      Room {b.room?.roomNumber} — Bed {b.bed?.bedNumber}
                    </h6>
                    <span className={`badge bg-${statusColors[b.status]}`}>{b.status}</span>
                  </div>
                  <p className="mb-1 text-capitalize text-muted">{b.room?.roomType}</p>
                  <p className="mb-1">
                    {new Date(b.fromDate).toLocaleDateString()} → {new Date(b.toDate).toLocaleDateString()}
                  </p>
                  <p className="mb-2 fw-bold">Total: ₹{calculateAmount(b)}</p>
                  {b.paymentStatus === "paid" ? (
                    <span className="badge bg-success align-self-start">Paid</span>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary align-self-start"
                      onClick={() => handlePay(b)}
                      disabled={payingId === b._id}
                    >
                      {payingId === b._id ? "Processing..." : "Pay Now"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyRoomBookings;