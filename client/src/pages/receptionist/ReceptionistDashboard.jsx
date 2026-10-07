import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toast } from "react-toastify";
import DashboardHero from "../../components/DashboardHero";
import Navbar from "../../components/Navbar";

const ReceptionistDashboard = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", email: "", phone: "", age: "", gender: "", address: "" });

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [reason, setReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get("/receptionist/doctors");
        setDoctors(res.data.filter((d) => d.bookingType !== "scheduled"));
      } catch (error) {
        console.error(error);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/receptionist/patients/search?q=${searchTerm}`);
        setSearchResults(res.data);
      } catch (error) {
        console.error(error);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleRegisterNewPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/receptionist/patients/register", newPatient);
      toast.success(`Patient registered: ${res.data.hospitalId}`);
      setSelectedPatient(res.data);
      setShowNewPatientForm(false);
      setNewPatient({ name: "", email: "", phone: "", age: "", gender: "", address: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to register patient");
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedPatient || !selectedDoctor) {
      toast.error("Select a patient and a doctor first");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/receptionist/appointments/book", {
        patientId: selectedPatient._id,
        doctorId: selectedDoctor._id,
        reason,
        paymentMethod,
      });

      if (paymentMethod === "cash") {
        toast.success(res.data.message);
        resetBooking();
      } else {
        // Online payment — open Razorpay right now
        const { data } = await api.post("/payments/create-order", { amount: selectedDoctor.fees || 0 });
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "CityCare Hospital",
          description: `Consultation for ${selectedPatient.name} with Dr. ${selectedDoctor.name}`,
          order_id: data.orderId,
          handler: async (response) => {
            try {
              await api.put(`/receptionist/appointments/${res.data.appointment._id}/verify-online-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Payment verified! Appointment confirmed.");
              resetBooking();
            } catch (error) {
              toast.error("Payment verification failed");
            }
          },
          theme: { color: "#0d6efd" },
          method: { netbanking: true, card: true, upi: true, wallet: true },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setReason("");
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
        <span className="navbar-brand">🏥 Hospital MS — Reception Desk</span>
        <div className="ms-auto">
          <button className="btn btn-light btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="container mt-4 mb-5">
        <DashboardHero icon="🛎️" title="Front Desk" subtitle="Welcome back." />
        <h3 className="mb-4">Welcome, {user?.name}</h3>

        <div className="row g-4">
          <div className="col-md-6">
            <div className="card shadow-sm p-4">
              <h5 className="mb-3">Step 1: Find or Register Patient</h5>

              {!selectedPatient ? (
                <>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="🔍 Search by name, Hospital ID, or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchResults.map((p) => (
                    <div key={p._id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-1">
                      <div>
                        <strong>{p.name}</strong> <br />
                        <small className="text-muted">{p.hospitalId} • {p.phone}</small>
                      </div>
                      <button className="btn btn-sm btn-primary" onClick={() => setSelectedPatient(p)}>Select</button>
                    </div>
                  ))}

                  <button className="btn btn-outline-secondary mt-2" onClick={() => setShowNewPatientForm(!showNewPatientForm)}>
                    {showNewPatientForm ? "Cancel" : "+ Register New Walk-in Patient"}
                  </button>

                  {showNewPatientForm && (
                    <form onSubmit={handleRegisterNewPatient} className="mt-3 border-top pt-3">
                      <div className="mb-2">
                        <input type="text" className="form-control" placeholder="Full Name" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} required />
                      </div>
                      <div className="mb-2">
                        <input type="email" className="form-control" placeholder="Email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} required />
                      </div>
                      <div className="mb-2">
                        <input type="tel" className="form-control" placeholder="Phone (10 digits)" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} maxLength={10} />
                      </div>
                      <div className="row mb-2">
                        <div className="col">
                          <input type="number" className="form-control" placeholder="Age" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
                        </div>
                        <div className="col">
                          <select className="form-select" value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}>
                            <option value="">Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-success w-100">Register Patient</button>
                    </form>
                  )}
                </>
              ) : (
                <div className="alert alert-success d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{selectedPatient.name}</strong> — {selectedPatient.hospitalId}
                  </div>
                  <button className="btn btn-sm btn-outline-dark" onClick={() => setSelectedPatient(null)}>Change</button>
                </div>
              )}
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow-sm p-4">
              <h5 className="mb-3">Step 2: Select Doctor & Book</h5>
              <select
                className="form-select mb-3"
                value={selectedDoctor?._id || ""}
                onChange={(e) => setSelectedDoctor(doctors.find((d) => d._id === e.target.value))}
              >
                <option value="">-- Select Doctor (Queue-based only) --</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} — {d.specialization} (₹{d.fees})
                  </option>
                ))}
              </select>

              <textarea
                className="form-control mb-3"
                placeholder="Reason (optional)"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <div className="mb-3">
                <label className="form-label d-block">Payment Method</label>
                <div className="btn-group w-100">
                  <button
                    type="button"
                    className={`btn ${paymentMethod === "cash" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === "online" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setPaymentMethod("online")}
                  >
                    💳 Online
                  </button>
                </div>
              </div>

              <button
                className="btn btn-success w-100"
                disabled={!selectedPatient || !selectedDoctor || loading}
                onClick={handleBookAppointment}
              >
                {loading ? "Processing..." : "Book Appointment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceptionistDashboard;