import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import DashboardHero from "../../components/DashboardHero";

const urgencyColors = { normal: "secondary", urgent: "warning", emergency: "danger" };

const BedCoordinatorDashboard = () => {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [allottingId, setAllottingId] = useState(null);
  const [selectedBedMap, setSelectedBedMap] = useState({});
  const [dateMap, setDateMap] = useState({});

  const fetchData = async () => {
    try {
      const [reqRes, occRes] = await Promise.all([
        api.get("/room-requests/pending"),
        api.get("/room-requests/occupancy"),
      ]);
      setRequests(reqRes.data);
      setOccupancy(occRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAvailableBeds = (roomType) => {
    const matchingRooms = occupancy.filter((r) => r.roomType === roomType);
    const beds = [];
    matchingRooms.forEach((room) => {
      room.beds.forEach((bed) => {
        if (bed.status === "available") beds.push({ ...bed, roomNumber: room.roomNumber });
      });
    });
    return beds;
  };

  const handleAllot = async (requestId) => {
    const bedId = selectedBedMap[requestId];
    const dates = dateMap[requestId];
    if (!bedId || !dates?.fromDate || !dates?.toDate) {
      toast.error("Select a bed and both dates first");
      return;
    }
    setAllottingId(requestId);
    try {
      await api.put(`/room-requests/${requestId}/allot`, {
        bedId,
        fromDate: dates.fromDate,
        toDate: dates.toDate,
      });
      toast.success("Bed allotted successfully!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to allot bed");
    } finally {
      setAllottingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt("Reason for rejection (e.g. no beds available):");
    if (reason === null) return;
    try {
      await api.put(`/room-requests/${requestId}/reject`, { reason });
      toast.success("Request rejected");
      fetchData();
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
        <span className="navbar-brand">🏥 Hospital MS — Bed Coordinator</span>
        <div className="ms-auto">
          <button className="btn btn-light btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="container mt-4 mb-5">
        <DashboardHero icon="🛎️" title="Front Desk" subtitle="Welcome back." />
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Welcome, {user?.name}</h3>
          <small className="text-muted">🔄 Live updates every 10s</small>
        </div>

        <h5 className="mb-3">Pending Room Requests</h5>
        {requests.length === 0 ? (
          <p className="text-muted mb-4">No pending requests.</p>
        ) : (
          <div className="row g-3 mb-5">
            {requests.map((r) => {
              const availableBeds = getAvailableBeds(r.roomTypeNeeded);
              return (
                <div className="col-md-6" key={r._id}>
                  <div className="card shadow-sm p-3">
                    <div className="d-flex justify-content-between">
                      <h6 className="mb-1">{r.patient?.name} ({r.patient?.hospitalId})</h6>
                      <span className={`badge bg-${urgencyColors[r.urgency]}`}>{r.urgency}</span>
                    </div>
                    <p className="mb-1 text-muted small">Dr. {r.doctor?.name} ({r.doctor?.specialization})</p>
                    <p className="mb-2 text-capitalize">Needs: <strong>{r.roomTypeNeeded}</strong></p>
                    {r.notes && <p className="mb-2 small text-muted">{r.notes}</p>}

                    {availableBeds.length === 0 ? (
                      <p className="text-danger small mb-2">No available beds of this type right now.</p>
                    ) : (
                      <select
                        className="form-select form-select-sm mb-2"
                        value={selectedBedMap[r._id] || ""}
                        onChange={(e) => setSelectedBedMap({ ...selectedBedMap, [r._id]: e.target.value })}
                      >
                        <option value="">-- Select Bed --</option>
                        {availableBeds.map((bed) => (
                          <option key={bed._id} value={bed._id}>Room {bed.roomNumber} — Bed {bed.bedNumber}</option>
                        ))}
                      </select>
                    )}

                    <div className="row g-2 mb-2">
                      <div className="col">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          onChange={(e) => setDateMap({ ...dateMap, [r._id]: { ...dateMap[r._id], fromDate: e.target.value } })}
                        />
                      </div>
                      <div className="col">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          onChange={(e) => setDateMap({ ...dateMap, [r._id]: { ...dateMap[r._id], toDate: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-success flex-grow-1"
                        disabled={availableBeds.length === 0 || allottingId === r._id}
                        onClick={() => handleAllot(r._id)}
                      >
                        {allottingId === r._id ? "Allotting..." : "Allot Bed"}
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleReject(r._id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h5 className="mb-3">Full Room/Bed Occupancy</h5>
        <div className="row g-3">
          {occupancy.map((room) => (
            <div className="col-md-4" key={room._id}>
              <div className="card shadow-sm p-3">
                <h6>Room {room.roomNumber} <span className="text-capitalize text-muted">({room.roomType})</span></h6>
                {room.beds.map((bed) => (
                  <div key={bed._id} className="d-flex justify-content-between border-bottom py-1 small">
                    <span>{bed.bedNumber}</span>
                    <span>
                      <span className={`badge bg-${bed.status === "available" ? "success" : "danger"} me-1`}>{bed.status}</span>
                      {bed.currentPatient?.name || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default BedCoordinatorDashboard;