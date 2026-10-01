import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const diseaseMap = {
  heart: "Cardiology", chest: "Cardiology", cardiac: "Cardiology",
  brain: "Neurology", headache: "Neurology", stroke: "Neurology",
  bone: "Orthopedics", fracture: "Orthopedics", joint: "Orthopedics",
  child: "Pediatrics", baby: "Pediatrics",
  skin: "Dermatology", rash: "Dermatology",
  ear: "ENT", nose: "ENT", throat: "ENT",
  pregnancy: "Gynecology", women: "Gynecology",
  eye: "Ophthalmology", vision: "Ophthalmology",
  mental: "Psychiatry", stress: "Psychiatry", anxiety: "Psychiatry",
  kidney: "Urology", urine: "Urology",
  stomach: "Gastroenterology", digestion: "Gastroenterology",
  lung: "Pulmonology", breathing: "Pulmonology", asthma: "Pulmonology",
  cancer: "Oncology", tumor: "Oncology",
  fever: "General Medicine", cold: "General Medicine",
};

const shiftColors = { day: "primary", night: "dark", emergency: "danger" };

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const navigate = useNavigate();

  // Queue-type state
  const [availability, setAvailability] = useState(null);
  const [checkingSlot, setCheckingSlot] = useState(false);

  // Scheduled-type state
  const [calendarOverview, setCalendarOverview] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [daySlots, setDaySlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/doctors?forBooking=true");
      setDoctors(res.data);
    } catch (error) {
      console.error("Failed to refresh doctors");
    }
  };

  useEffect(() => {
    fetchDoctors();
    const interval = setInterval(fetchDoctors, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDoctor = async (doc) => {
    setSelectedDoctor(doc);
    setAvailability(null);
    setSelectedDate(null);
    setDaySlots([]);
    setSelectedSlot(null);

    if (doc.bookingType === "scheduled") {
      setLoadingCalendar(true);
      try {
        const res = await api.get(`/appointments/scheduled/overview/${doc._id}`);
        setCalendarOverview(res.data);
      } catch (error) {
        toast.error("Could not load calendar");
        setSelectedDoctor(null);
      } finally {
        setLoadingCalendar(false);
      }
    } else {
      setCheckingSlot(true);
      try {
        const res = await api.get(`/appointments/availability/${doc._id}`);
        setAvailability(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not check availability");
        setSelectedDoctor(null);
      } finally {
        setCheckingSlot(false);
      }
    }
  };

  const handleSelectDate = async (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const res = await api.get(`/appointments/scheduled/availability/${selectedDoctor._id}?date=${dateStr}`);
      setDaySlots(res.data.slots);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const runPayment = async (description, onSuccess) => {
    setLoading(true);
    try {
      const { data } = await api.post("/payments/create-order", { amount: selectedDoctor.fees || 0 });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "CityCare Hospital",
        description,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await onSuccess(response);
            toast.success("Payment successful! Appointment booked.");
            navigate("/patient/history");
          } catch (error) {
            toast.error(error.response?.data?.message || "Booking failed after payment. Contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled. Appointment was not booked.");
            setLoading(false);
          },
        },
        theme: { color: "#0d6efd" },
        method: { netbanking: true, card: true, upi: true, wallet: true, paylater: true },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Appointment was not booked.");
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      toast.error("Failed to initiate payment");
      setLoading(false);
    }
  };

  const handleBookQueue = (e) => {
    e.preventDefault();
    if (!selectedDoctor || !availability) return;
    runPayment(`Consultation with Dr. ${selectedDoctor.name}`, async (response) => {
      await api.post("/appointments/book-with-payment", {
        doctorId: selectedDoctor._id,
        reason,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    });
  };

  const handleBookScheduled = (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    runPayment(`Consultation with Dr. ${selectedDoctor.name} on ${selectedDate}`, async (response) => {
      await api.post("/appointments/scheduled/book-with-payment", {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    });
  };

  const specializations = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))].sort();

  const filteredDoctors = doctors.filter((doc) => {
    const term = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (term) {
      const mappedSpecialization = diseaseMap[term];
      matchesSearch =
        doc.name?.toLowerCase().includes(term) ||
        doc.specialization?.toLowerCase().includes(term) ||
        (mappedSpecialization && doc.specialization === mappedSpecialization);
    }
    const matchesSpecFilter = specializationFilter === "all" || doc.specialization === specializationFilter;
    const matchesShiftFilter = shiftFilter === "all" || doc.shiftType === shiftFilter;
    return matchesSearch && matchesSpecFilter && matchesShiftFilter;
  });

  const resetSelection = () => {
    setSelectedDoctor(null);
    setAvailability(null);
    setSelectedDate(null);
    setDaySlots([]);
    setSelectedSlot(null);
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Book an Appointment</h3>
          {!selectedDoctor && <small className="text-muted">🔄 Live updates every 15s</small>}
        </div>

        {!selectedDoctor ? (
          <>
            <div className="alert alert-info small">
              🩺 Specialist doctors (Cardiology, Neurology, etc.) use a <strong>15-day calendar</strong> — pick any date & time.
              General doctors use a <strong>same-day queue system</strong> — booking open 12:00 AM – 12:00 PM.
            </div>

            <div className="card p-3 mb-4 shadow-sm">
              <div className="row g-2">
                <div className="col-md-5">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Search by doctor name, specialization, or symptom"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)}>
                    <option value="all">All Specializations</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec} ({doctors.filter((d) => d.specialization === spec).length})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select className="form-select" value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
                    <option value="all">All Shifts</option>
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
              <p className="text-muted small mt-2 mb-0">
                Showing {filteredDoctors.length} of {doctors.length} available doctors
              </p>
            </div>

            <div className="row g-3">
              {filteredDoctors.length === 0 && <p className="text-muted">No doctors match your search.</p>}
              {filteredDoctors.map((doc) => {
                const isFull = doc.bookingType === "queue" && doc.todayBooked >= doc.dailyCapacity;
                const fillPercent = Math.min(100, Math.round((doc.todayBooked / doc.dailyCapacity) * 100));
                return (
                  <div className="col-md-4" key={doc._id}>
                    <div className="card shadow-sm p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <h5>{doc.name}</h5>
                        <span className={`badge bg-${shiftColors[doc.shiftType] || "primary"} text-capitalize`}>
                          {doc.shiftType || "day"}
                        </span>
                      </div>
                      <p className="mb-1 text-muted">{doc.specialization}</p>
                      <span className={`badge bg-${doc.bookingType === "scheduled" ? "success" : "secondary"} mb-2`}>
                        {doc.bookingType === "scheduled" ? "📅 Calendar Booking" : "🎫 Queue Booking"}
                      </span>
                      {doc.avgRating > 0 && (
                        <p className="mb-1 small">
                          <span style={{ color: "#ffc107" }}>★</span> {doc.avgRating} ({doc.totalReviews} reviews)
                        </p>
                      )}
                      <p className="mb-1">Experience: {doc.experience || 0} yrs</p>
                      <p className="mb-2">Fees: ₹{doc.fees || "N/A"}</p>

                      {doc.bookingType === "queue" && (
                        <div className="mb-2">
                          <div className="d-flex justify-content-between small mb-1">
                            <span>Today's Bookings</span>
                            <span className={isFull ? "text-danger fw-bold" : ""}>
                              {doc.todayBooked}/{doc.dailyCapacity}
                            </span>
                          </div>
                          <div className="progress" style={{ height: "6px" }}>
                            <div
                              className={`progress-bar bg-${isFull ? "danger" : fillPercent > 70 ? "warning" : "success"}`}
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        className="btn btn-primary btn-sm"
                        disabled={isFull}
                        onClick={() => handleSelectDoctor(doc)}
                      >
                        {isFull ? "Fully Booked Today" : doc.bookingType === "scheduled" ? "View Calendar" : "Check Availability"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card shadow-sm p-4" style={{ maxWidth: "650px" }}>
            <h5>
              Booking with Dr. {selectedDoctor.name} ({selectedDoctor.specialization})
            </h5>
            <button className="btn btn-link p-0 mb-3 text-start" onClick={resetSelection}>
              ← Change doctor
            </button>

            {selectedDoctor.bookingType === "scheduled" ? (
              <>
                {loadingCalendar ? (
                  <p>Loading calendar...</p>
                ) : (
                  <>
                    <h6 className="mb-2">Select a Date (next 15 days)</h6>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {calendarOverview.map((day) => {
                        const dateObj = new Date(day.date);
                        const isFullDay = day.availableSlots === 0;
                        const isSelected = selectedDate === day.date;
                        return (
                          <button
                            key={day.date}
                            className={`btn btn-sm ${isSelected ? "btn-primary" : isFullDay ? "btn-outline-secondary" : "btn-outline-primary"}`}
                            disabled={isFullDay}
                            onClick={() => handleSelectDate(day.date)}
                            style={{ minWidth: "70px" }}
                          >
                            <div>{dateObj.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</div>
                            <small>{isFullDay ? "Full" : `${day.availableSlots} slots`}</small>
                          </button>
                        );
                      })}
                    </div>

                    {selectedDate && (
                      <>
                        <h6 className="mb-2">Available Times — {selectedDate}</h6>
                        {loadingSlots ? (
                          <p>Loading times...</p>
                        ) : daySlots.every((s) => !s.available) ? (
                          <div className="alert alert-warning">
                            No availability on this date. Please pick the next available date shown above.
                          </div>
                        ) : (
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {daySlots.map((slot) => (
                              <button
                                key={slot.timeSlot}
                                className={`btn btn-sm ${selectedSlot === slot.timeSlot ? "btn-success" : "btn-outline-secondary"}`}
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot.timeSlot)}
                              >
                                {slot.timeSlot}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {selectedSlot && (
                      <form onSubmit={handleBookScheduled}>
                        <div className="alert alert-success">
                          Selected: <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Reason (optional)</label>
                          <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                        </div>
                        <button type="submit" className="btn btn-success w-100" disabled={loading}>
                          {loading ? "Processing..." : `Pay ₹${selectedDoctor.fees || 0} & Confirm Booking`}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {checkingSlot ? (
                  <p>Checking availability...</p>
                ) : availability ? (
                  <>
                    <div className="alert alert-success">
                      <p className="mb-1">
                        <strong>Your Token Number: #{availability.tokenNumber}</strong>
                      </p>
                      <p className="mb-0">
                        Assigned Time: <strong>{availability.timeSlot}</strong> (Session: {availability.session})
                      </p>
                    </div>
                    <p className="text-muted small mb-3">
                      Consultation Fee: <strong>₹{selectedDoctor.fees || 0}</strong> — payment required to confirm booking
                    </p>
                    <form onSubmit={handleBookQueue}>
                      <div className="mb-3">
                        <label className="form-label">Reason (optional)</label>
                        <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                      </div>
                      <button type="submit" className="btn btn-success w-100" disabled={loading}>
                        {loading ? "Processing..." : `Pay ₹${selectedDoctor.fees || 0} & Confirm Booking`}
                      </button>
                    </form>
                  </>
                ) : (
                  <p className="text-muted">Unable to check availability.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default BookAppointment;