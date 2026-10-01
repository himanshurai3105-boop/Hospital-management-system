import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import Receipt from "../../components/Receipt";

const ReceiptView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const [receiptData, setReceiptData] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (type === "order") {
          const res = await api.get("/medicines/my-orders");
          const order = res.data.find((o) => o._id === id);
          if (!order) return toast.error("Order not found");
          setReceiptData({
            invoiceNumber: `INV-ORD-${order._id.slice(-6).toUpperCase()}`,
            date: order.createdAt,
            amount: order.totalAmount,
            patientName: order.patient?.name || "Patient",
            patientEmail: order.patient?.email || "",
            items: order.items.map((it) => ({
              description: `${it.medicine?.name} x ${it.quantity}`,
              amount: it.priceAtOrder * it.quantity,
            })),
          });
        } else if (type === "appointment") {
          const res = await api.get("/appointments/my");
          const appt = res.data.find((a) => a._id === id);
          if (!appt) return toast.error("Appointment not found");
          setReceiptData({
            invoiceNumber: `INV-APT-${appt._id.slice(-6).toUpperCase()}`,
            date: appt.createdAt,
            amount: appt.doctor?.fees || 0,
            patientName: appt.patient?.name || "Patient",
            patientEmail: appt.patient?.email || "",
            items: [
              { description: `Consultation — Dr. ${appt.doctor?.name} (${appt.doctor?.specialization})`, amount: appt.doctor?.fees || 0 },
            ],
          });
        } else if (type === "room") {
          const res = await api.get("/rooms/my-bookings");
          const booking = res.data.find((b) => b._id === id);
          if (!booking) return toast.error("Booking not found");
          const days = Math.max(1, Math.ceil((new Date(booking.toDate) - new Date(booking.fromDate)) / (1000 * 60 * 60 * 24)));
          const amount = days * (booking.room?.pricePerDay || 0);
          setReceiptData({
            invoiceNumber: `INV-RM-${booking._id.slice(-6).toUpperCase()}`,
            date: booking.createdAt,
            amount,
            patientName: booking.patient?.name || "Patient",
            patientEmail: booking.patient?.email || "",
            items: [
              { description: `Room ${booking.room?.roomNumber} (${booking.room?.roomType}) — ${days} day(s)`, amount },
            ],
          });
        }
      } catch (error) {
        toast.error("Failed to load receipt");
      }
    };
    fetchData();
  }, [id, type]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="d-print-none">
        <Navbar />
      </div>
      <div className="container mt-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3 d-print-none">
          <h4>Invoice / Receipt</h4>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print / Save as PDF
          </button>
        </div>

        {receiptData ? (
          <div className="card shadow-sm">
            <Receipt ref={printRef} data={receiptData} />
          </div>
        ) : (
          <p>Loading receipt...</p>
        )}
      </div>
    </>
  );
};

export default ReceiptView;