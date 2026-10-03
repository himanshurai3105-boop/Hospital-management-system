import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const statusColors = { pending: "secondary", confirmed: "info", completed: "success", cancelled: "danger" };

const MyRoomBookingsDoctor = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/rooms/my-bookings-doctor");
        setBookings(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Room Bookings I've Made</h3>
        {loading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-muted">No room bookings made yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr><th>Patient</th><th>Room</th><th>Bed</th><th>From</th><th>To</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.patient?.name} ({b.patient?.hospitalId})</td>
                    <td>{b.room?.roomNumber} ({b.room?.roomType})</td>
                    <td>{b.bed?.bedNumber}</td>
                    <td>{new Date(b.fromDate).toLocaleDateString()}</td>
                    <td>{new Date(b.toDate).toLocaleDateString()}</td>
                    <td><span className={`badge bg-${statusColors[b.status]}`}>{b.status}</span></td>
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

export default MyRoomBookingsDoctor;