import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const bedStatusColors = { available: "success", occupied: "danger", maintenance: "secondary" };

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomType: "general",
    pricePerDay: "",
    totalBeds: "",
    description: "",
  });

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

  const resetForm = () => {
    setFormData({ roomNumber: "", roomType: "general", pricePerDay: "", totalBeds: "", description: "" });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/rooms", formData);
      toast.success("Room added with beds auto-generated");
      resetForm();
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this room and all its beds?")) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success("Room removed");
      fetchRooms();
    } catch (error) {
      toast.error("Failed to remove room");
    }
  };

  const handleDischarge = async (bedId) => {
    if (!window.confirm("Discharge patient from this bed?")) return;
    try {
      await api.put(`/rooms/beds/${bedId}/discharge`);
      toast.success("Bed discharged");
      fetchRooms();
    } catch (error) {
      toast.error("Failed to discharge bed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Manage Rooms & Beds</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Room"}
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-4 shadow-sm">
            <h5>Add New Room</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Room Number</label>
                  <input type="text" name="roomNumber" className="form-control" value={formData.roomNumber} onChange={handleChange} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Room Type</label>
                  <select name="roomType" className="form-select" value={formData.roomType} onChange={handleChange}>
                    <option value="general">General</option>
                    <option value="private">Private</option>
                    <option value="icu">ICU</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Price / Day (₹)</label>
                  <input type="number" name="pricePerDay" className="form-control" value={formData.pricePerDay} onChange={handleChange} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Total Beds</label>
                  <input type="number" name="totalBeds" className="form-control" value={formData.totalBeds} onChange={handleChange} required min={1} max={10} />
                  <small className="text-muted">Beds will be auto-named (e.g. 101-A, 101-B...)</small>
                </div>
                <div className="col-md-8 mb-3">
                  <label className="form-label">Description</label>
                  <input type="text" name="description" className="form-control" value={formData.description} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" className="btn btn-success">Add Room</button>
            </form>
          </div>
        )}

        <div className="row g-3">
          {rooms.map((room) => (
            <div className="col-md-6" key={room._id}>
              <div className="card shadow-sm p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">
                      Room {room.roomNumber} <span className="text-capitalize text-muted">({room.roomType})</span>
                    </h5>
                    <small className="text-muted">
                      ₹{room.pricePerDay}/day • {room.availableBeds}/{room.totalBeds} beds available
                    </small>
                  </div>
                  <div>
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => setExpandedRoom(expandedRoom === room._id ? null : room._id)}
                    >
                      {expandedRoom === room._id ? "Hide Beds" : "View Beds"}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(room._id)}>
                      Delete
                    </button>
                  </div>
                </div>

                {expandedRoom === room._id && (
                  <div className="mt-3 pt-3 border-top">
                    <table className="table table-sm table-bordered mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Bed No.</th>
                          <th>Status</th>
                          <th>Patient</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.beds.map((bed) => (
                          <tr key={bed._id}>
                            <td>{bed.bedNumber}</td>
                            <td>
                              <span className={`badge bg-${bedStatusColors[bed.status]}`}>{bed.status}</span>
                            </td>
                            <td>{bed.currentPatient?.name || "-"}</td>
                            <td>
                              {bed.status === "occupied" && (
                                <button className="btn btn-xs btn-outline-warning" style={{ fontSize: "0.75rem" }} onClick={() => handleDischarge(bed._id)}>
                                  Discharge
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ManageRooms;