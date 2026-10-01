import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const roomTypeIcons = { general: "🛏️", private: "🚪", icu: "🏥", deluxe: "✨" };

const BookRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [formData, setFormData] = useState({ fromDate: "", toDate: "" });
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data);
    } catch (error) {
      toast.error("Failed to load rooms");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/rooms/book", {
        bedId: selectedBed._id,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
      });
      toast.success("Bed booked successfully!");
      setSelectedRoom(null);
      setSelectedBed(null);
      setFormData({ fromDate: "", toDate: "" });
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">Book a Room / Bed</h3>

        {!selectedRoom ? (
          <div className="row g-3">
            {rooms.length === 0 && <p className="text-muted">No rooms available yet.</p>}
            {rooms.map((room) => (
              <div className="col-md-4" key={room._id}>
                <div className="card shadow-sm p-3">
                  <div style={{ fontSize: "2rem" }}>{roomTypeIcons[room.roomType]}</div>
                  <h5 className="mt-2">
                    Room {room.roomNumber} <span className="text-capitalize text-muted">({room.roomType})</span>
                  </h5>
                  <p className="mb-1">₹{room.pricePerDay} / day</p>
                  <p className="mb-2">
                    <span className={`badge bg-${room.availableBeds > 0 ? "success" : "danger"}`}>
                      {room.availableBeds} beds available
                    </span>
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={room.availableBeds < 1}
                    onClick={() => setSelectedRoom(room)}
                  >
                    {room.availableBeds < 1 ? "Full" : "View Beds"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !selectedBed ? (
          <div>
            <button className="btn btn-link p-0 mb-3" onClick={() => setSelectedRoom(null)}>
              ← Back to rooms
            </button>
            <h5>Select a Bed in Room {selectedRoom.roomNumber}</h5>
            <div className="row g-3 mt-1">
              {selectedRoom.beds.map((bed) => (
                <div className="col-md-3" key={bed._id}>
                  <div className={`card p-3 text-center ${bed.status !== "available" ? "bg-light" : "shadow-sm"}`}>
                    <div style={{ fontSize: "1.5rem" }}>🛏️</div>
                    <p className="mb-1 fw-bold">{bed.bedNumber}</p>
                    <span className={`badge bg-${bed.status === "available" ? "success" : "danger"} mb-2`}>
                      {bed.status}
                    </span>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={bed.status !== "available"}
                      onClick={() => setSelectedBed(bed)}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm p-4" style={{ maxWidth: "500px" }}>
            <h5>Booking Bed {selectedBed.bedNumber}</h5>
            <button className="btn btn-link p-0 mb-3 text-start" onClick={() => setSelectedBed(null)}>
              ← Change bed
            </button>
            <form onSubmit={handleBook}>
              <div className="mb-3">
                <label className="form-label">From Date</label>
                <input type="date" name="fromDate" className="form-control" value={formData.fromDate} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">To Date</label>
                <input type="date" name="toDate" className="form-control" value={formData.toDate} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn btn-success w-100" disabled={loading}>
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default BookRoom;