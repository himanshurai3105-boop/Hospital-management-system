import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type");
  const mode = type === "daily" ? "queue" : type === "special" ? "scheduled" : null;

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
  const [freeDoctors, setFreeDoctors] = useState(null); // null = abhi nahi mangaya
  const [loadingFree, setLoadingFree] = useState(false);

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

  const clearFilters = () => {
    setSearchTerm("");
    setSpecializationFilter("all");
    setShiftFilter("all");
  };

  const openSection = (t) => {
    clearFilters();
    setSearchParams({ type: t });
  };

  const backToSections = () => {
    clearFilters();
    setSearchParams({});
  };

  const handleSelectDate = async (dateStr, doctorId = selectedDoctor?._id) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setFreeDoctors(null);
    setLoadingSlots(true);
    try {
      const res = await api.get(`/appointments/scheduled/availability/${doctorId}?date=${dateStr}`);
      setDaySlots(res.data.slots);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectDoctor = async (doc, presetDate = null) => {
    setSelectedDoctor(doc);
    setAvailability(null);
    setSelectedDate(null);
    setDaySlots([]);
    setSelectedSlot(null);
    setFreeDoctors(null);

    if (doc.bookingType === "scheduled") {
      setLoadingCalendar(true);
      try {
        const res = await api.get(`/appointments/scheduled/overview/${doc._id}`);
        setCalendarOverview(res.data);
      } catch (error) {
        toast.error("Could not load calendar");
        setSelectedDoctor(null);
        return;
      } finally {
        setLoadingCalendar(false);
      }
      if (presetDate) await handleSelectDate(presetDate, doc._id);
    } else {
      setCheckingSlot(true);
      try {
        const res = await api.get(`/appointments/queue/availability/${doc._id}`);
        setAvailability(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not check availability");
        setSelectedDoctor(null);
      } finally {
        setCheckingSlot(false);
      }
    }
  };

  const fetchFreeDoctors = async () => {
    setLoadingFree(true);
    try {
      const res = await api.get(
        `/appointments/scheduled/free-doctors?specialization=${encodeURIComponent(
          selectedDoctor.specialization
        )}&date=${selectedDate}&exclude=${selectedDoctor._id}`
      );
      setFreeDoctors(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load doctors");
    } finally {
      setLoadingFree(false);
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
            toast.error(error.response?.data?.message || "Booking failed after payment. Contact support.", {
              autoClose: 8000,
            });
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
     await api.post("/appointments/queue/book-with-payment", {
        doctorId: selectedDoctor._id,
        reason,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    });
  };

  const handleBookScheduled = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;

    // Payment se pehle slot / one-per-day check
    try {
      await api.post("/appointments/scheduled/precheck", {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "This slot is not available");
      handleSelectDate(selectedDate);
      return;
    }

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

  const dailyDoctors = doctors.filter((d) => d.bookingType !== "scheduled");
  const specialDoctors = doctors.filter((d) => d.bookingType === "scheduled");
  const modeDoctors = mode === "queue" ? dailyDoctors : mode === "scheduled" ? specialDoctors : [];

  const specializations = [...new Set(modeDoctors.map((d) => d.specialization).filter(Boolean))].sort();

  const filteredDoctors = modeDoctors.filter((doc) => {
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
    const matchesShiftFilter = mode !== "queue" || shiftFilter === "all" || doc.shiftType === shiftFilter;
    return matchesSearch && matchesSpecFilter && matchesShiftFilter;
  });

  const resetSelection = () => {
    setSelectedDoctor(null);
    setAvailability(null);
    setSelectedDate(null);
    setDaySlots([]);
    setSelectedSlot(null);
    setFreeDoctors(null);
  };

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  // Selected date pe koi slot free nahi
  const noSlotsOnDate = selectedDate && !loadingSlots && daySlots.length > 0 && daySlots.every((s) => !s.available);

  // Is doctor ki sabse paas ki free dates (aage + peeche)
  const nearbyDates = selectedDate
    ? calendarOverview
        .filter((d) => d.availableSlots > 0 && d.date !== selectedDate)
        .sort(
          (a, b) =>
            Math.abs(new Date(a.date) - new Date(selectedDate)) - Math.abs(new Date(b.date) - new Date(selectedDate))
        )
        .slice(0, 4)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short" });

  const pageTitle =
    mode === "queue" ? "Daily Booking" : mode === "scheduled" ? "Book Special Appointment" : "Book an Appointment";

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">{pageTitle}</h3>
          {!selectedDoctor && mode && <small className="text-muted">🔄 Live updates every 15s</small>}
        </div>

        {selectedDoctor ? (
          /* ---------- BOOKING FLOW ---------- */
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
                    <h6 className="mb-2">Select a Date (today + next 14 days)</h6>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {calendarOverview.map((day) => {
                        const isToday = day.date === todayStr;
                        const isFullDay = day.availableSlots === 0;
                        const isSelected = selectedDate === day.date;
                        return (
                          <button
                            key={day.date}
                            className={`btn btn-sm ${isSelected ? "btn-primary" : isFullDay ? "btn-outline-secondary" : "btn-outline-primary"}`}
                            onClick={() => handleSelectDate(day.date)}
                            style={{ minWidth: "70px" }}
                          >
                            <div>{fmtDate(day.date)}</div>
                            {isToday && <small className="d-block fw-bold">Today</small>}
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
                        ) : noSlotsOnDate ? (
                          <div className="alert alert-warning">
                            <p className="mb-2">
                              <strong>Dr. {selectedDoctor.name}</strong> has no free slot on <strong>{selectedDate}</strong>.
                            </p>

                            {nearbyDates.length > 0 ? (
                              <>
                                <p className="mb-1 small">Nearest dates with free slots for this doctor:</p>
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                  {nearbyDates.map((d) => (
                                    <button
                                      key={d.date}
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleSelectDate(d.date)}
                                    >
                                      {fmtDate(d.date)} · {d.availableSlots} slots
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="small">This doctor has no free slots in the next 15 days.</p>
                            )}

                            <p className="mb-1 small">Need exactly {fmtDate(selectedDate)}?</p>
                            <button
                              className="btn btn-sm btn-dark"
                              onClick={fetchFreeDoctors}
                              disabled={loadingFree}
                            >
                              {loadingFree
                                ? "Searching..."
                                : `Show other ${selectedDoctor.specialization} doctors free on this date`}
                            </button>

                            {freeDoctors && (
                              <div className="mt-3">
                                {freeDoctors.length === 0 ? (
                                  <p className="small mb-0">
                                    No other {selectedDoctor.specialization} doctor is free on this date either.
                                  </p>
                                ) : (
                                  freeDoctors.map((fd) => (
                                    <div
                                      key={fd._id}
                                      className="d-flex justify-content-between align-items-center bg-white border rounded p-2 mb-2"
                                    >
                                      <div>
                                        <strong>Dr. {fd.name}</strong>
                                        <div className="small text-muted">
                                          {fd.experience || 0} yrs · ₹{fd.fees || "N/A"} · {fd.availableSlots} slots free
                                        </div>
                                      </div>
                                      <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleSelectDoctor(fd, selectedDate)}
                                      >
                                        View slots
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
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
                    <div className={`alert alert-${availability.queueStatus === "confirmed" ? "success" : "warning"}`}>
                      {availability.queueStatus === "confirmed" ? (
                        <>
                          <p className="mb-1"><strong>✅ Confirmed. Your position: #{availability.position}</strong></p>
                          <p className="mb-0">Booking No. {availability.tokenNumber} · Estimated time ~{availability.estimatedTime}</p>
                        </>
                      ) : (
                        <>
                          <p className="mb-1"><strong>⏳ Waiting list. Position: #{availability.waitingPosition}</strong></p>
                          <p className="mb-0 small">
                            You move up automatically as patients are checked. If the doctor cannot see you today, this carries to the next day and you can cancel it with a 100% refund.
                          </p>
                        </>
                      )}
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
        ) : !mode ? (
          /* ---------- STEP 1: CHOOSE SECTION ---------- */
          <div className="row g-4">
            <div className="col-md-6">
              <div
                className="card shadow-sm p-4 text-center h-100 border-primary"
                role="button"
                style={{ cursor: "pointer" }}
                onClick={() => openSection("daily")}
              >
                <h4>🎫 Daily Booking</h4>
                <p className="text-muted mb-2">
                  Same-day queue for check-ups and general consultation. You get a token number and time.
                </p>
                <small className="text-muted d-block mb-2">Booking is open during each doctor's shift hours</small>
                <span className="badge bg-secondary align-self-center">{dailyDoctors.length} doctors</span>
              </div>
            </div>
            <div className="col-md-6">
              <div
                className="card shadow-sm p-4 text-center h-100 border-success"
                role="button"
                style={{ cursor: "pointer" }}
                onClick={() => openSection("special")}
              >
                <h4>📅 Book Special Appointment</h4>
                <p className="text-muted mb-2">
                  Specialist doctors, 30-minute slots between 9 AM and 7 PM. Book for today too, if a slot is free.
                </p>
                <small className="text-muted d-block mb-2">Cardiology, Neurology, Oncology and more</small>
                <span className="badge bg-success align-self-center">{specialDoctors.length} doctors</span>
              </div>
            </div>
          </div>
        ) : (
          /* ---------- STEP 2: DOCTOR LIST ---------- */
          <>
            <button className="btn btn-link p-0 mb-3" onClick={backToSections}>
              ← Back to booking options
            </button>

            <div className="alert alert-info small">
              {mode === "queue" ? (
                <>
                  🎫 <strong>Daily Booking</strong>: same-day queue system. Booking is open during the doctor's shift window.
                </>
              ) : (
                <>
                  📅 <strong>Special Appointment</strong>: 30-minute slots, 9 AM – 7 PM, up to 15 days ahead. Same-day
                  booking works if a slot is free (at least 30 minutes from now). Only one appointment per day is
                  allowed.
                </>
              )}
            </div>

            <div className="card p-3 mb-4 shadow-sm">
              <div className="row g-2">
                <div className={mode === "queue" ? "col-md-5" : "col-md-6"}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Search by doctor name, specialization, or symptom"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className={mode === "queue" ? "col-md-4" : "col-md-6"}>
                  <select
                    className="form-select"
                    value={specializationFilter}
                    onChange={(e) => setSpecializationFilter(e.target.value)}
                  >
                    <option value="all">All Specializations</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec} ({modeDoctors.filter((d) => d.specialization === spec).length})
                      </option>
                    ))}
                  </select>
                </div>

                {mode === "queue" && (
                  <div className="col-md-3">
                    <select className="form-select" value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
                      <option value="all">All Shifts</option>
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                )}
              </div>
              <p className="text-muted small mt-2 mb-0">
                Showing {filteredDoctors.length} of {modeDoctors.length} available doctors
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
                        {mode === "queue" && (
                          <span className={`badge bg-${shiftColors[doc.shiftType] || "primary"} text-capitalize`}>
                            {doc.shiftType || "day"}
                          </span>
                        )}
                      </div>
                      <p className="mb-1 text-muted">{doc.specialization}</p>
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
        )}
      </div>
    </>
  );
};

export default BookAppointment;