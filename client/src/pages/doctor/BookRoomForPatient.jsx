import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const roomTypeIcons = { general: "🛏️", private: "🚪", icu: "🏥", deluxe: "✨" };

const BookRoomForPatient = () => {
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [formData, setFormData] = useState({ fromDate: "", toDate: "" });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [patientsRes, roomsRes] = await Promise.all([
        api.get("/doctors/my-patients"),
        api.get("/rooms"),
      ]);
      setPatients(patientsRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedBed) {
      toast.error("Select a patient and a bed first");
      return;
    }
    setLoading(true);
    try {
      await api.post("/rooms/book", {
        patientId: selectedPatient,
        bedId: selectedBed._id,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
      });
      toast.success("Bed booked for patient successfully!");
      setSelectedRoom(null);
      setSelectedBed(null);
      setSelectedPatient("");
      setFormData({ fromDate: "", toDate: "" });
      fetchData();
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
        <h3 className="mb-4">Book a Room for Patient</h3>

        <div className="card shadow-sm p-4 mb-4" style={{ maxWidth: "500px" }}>
          <label className="form-label">Select Patient</label>
          <select className="form-select" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
            <option value="">-- Select Patient --</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.hospitalId})
              </option>
            ))}
          </select>
        </div>

        {!selectedPatient ? (
          <p className="text-muted">Select a patient first to proceed with room booking.</p>
        ) : !selectedRoom ? (
          <div className="row g-3">
            {rooms.length === 0 && <p className="text-muted">No rooms available.</p>}
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
            <h5>Booking Bed {selectedBed.bedNumber} for {patients.find((p) => p._id === selectedPatient)?.name}</h5>
            <button className="btn btn-link p-0 mb-3 text-start" onClick={() => setSelectedBed(null)}>
              ← Change bed
            </button>
            <form onSubmit={handleBook}>
              <div className="mb-3">
                <label className="form-label">From Date</label>
                <input type="date" name="fromDate" className="form-control" value={formData.fromDate} onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">To Date</label>
                <input type="date" name="toDate" className="form-control" value={formData.toDate} onChange={(e) => setFormData({ ...formData, toDate: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-success w-100" disabled={loading}>
                {loading ? "Booking..." : "Confirm Room Booking"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default BookRoomForPatient;