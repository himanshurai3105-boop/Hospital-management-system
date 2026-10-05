import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const MyQueue = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchFor, setSwitchFor] = useState(null); // { id, options }

  const load = useCallback(async () => {
    try {
      const res = await api.get("/appointments/queue/my");
      setItems(res.data);
    } catch (e) {
      console.error("Queue refresh failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const cancel = async (a) => {
    const ok = window.confirm(
      `Cancel this appointment?\nYou will get ₹${a.refundAmount} back (${a.refundPercent}% of ₹${a.amountPaid}).`
    );
    if (!ok) return;
    try {
      const res = await api.post(`/appointments/queue/${a._id}/cancel`);
      toast.success(res.data.message);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not cancel");
    }
  };

  const openSwitch = async (a) => {
    try {
      const res = await api.get(`/appointments/queue/${a._id}/switch-options`);
      setSwitchFor({ id: a._id, options: res.data });
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load doctors");
    }
  };

  const doSwitch = async (doctorId) => {
    try {
      const res = await api.post(`/appointments/queue/${switchFor.id}/switch`, { newDoctorId: doctorId });
      toast.success(res.data.message);
      setSwitchFor(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not change doctor");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4" style={{ maxWidth: "700px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">My Live Queue</h3>
          <small className="text-muted">🔄 Updates every 15s</small>
        </div>

        {loading && <p>Loading...</p>}
        {!loading && items.length === 0 && <p className="text-muted">No active daily bookings.</p>}

        {items.map((a) => (
          <div key={a._id} className="card shadow-sm p-3 mb-3">
            <div className="d-flex justify-content-between">
              <div>
                <h5 className="mb-0">Dr. {a.doctor.name}</h5>
                <small className="text-muted">{a.doctor.specialization} · Booking No. {a.bookingNo}</small>
              </div>
              <span className={`badge align-self-start bg-${a.queueStatus === "confirmed" ? "success" : "warning text-dark"}`}>
                {a.queueStatus === "confirmed" ? `Confirmed #${a.position}` : `Waiting #${a.waitingPosition}`}
              </span>
            </div>

            <p className="mt-2 mb-1 small">
              Patients ahead of you: <strong>{a.peopleAhead}</strong>
              {a.estTime && <> · Estimated time: <strong>~{a.estTime}</strong></>}
            </p>

            {a.carriedOver && (
              <div className="alert alert-info small py-2 mb-2">
                Doctor could not see you on the earlier day, so your booking is carried to today with priority.
                You can keep it, or cancel for a <strong>100% refund</strong>.
              </div>
            )}

            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-primary" onClick={() => openSwitch(a)}>Change doctor</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(a)}>
                Cancel (refund ₹{a.refundAmount})
              </button>
            </div>
          </div>
        ))}

        {switchFor && (
          <div className="card shadow-sm p-3">
            <div className="d-flex justify-content-between mb-2">
              <h6 className="mb-0">Same specialization doctors</h6>
              <button className="btn btn-sm btn-link" onClick={() => setSwitchFor(null)}>Close</button>
            </div>
            {switchFor.options.length === 0 && (
              <p className="small text-muted mb-0">No other doctor available right now (fees must be equal or lower).</p>
            )}
            {switchFor.options.map((d) => (
              <div key={d._id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                <div>
                  <strong>Dr. {d.name}</strong>
                  <div className="small text-muted">
                    {d.experience || 0} yrs · ₹{d.fees}
                    {d.refundOnSwitch > 0 && ` · ₹${d.refundOnSwitch} refunded`}
                  </div>
                  <span className={`badge bg-${d.queueStatus === "confirmed" ? "success" : "warning text-dark"}`}>
                    {d.queueStatus === "confirmed" ? `You'd be Confirmed #${d.position}` : `You'd be Waiting #${d.waitingPosition}`}
                  </span>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => doSwitch(d._id)}>Switch</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyQueue;