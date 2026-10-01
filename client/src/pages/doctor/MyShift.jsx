import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

const shiftColors = { day: "primary", night: "dark", emergency: "danger" };

const MyShift = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/shift-settings"),
        ]);
        setProfile(profileRes.data);
        setSettings(settingsRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  if (!profile || !settings) {
    return (
      <>
        <Navbar />
        <div className="container mt-4"><p>Loading...</p></div>
      </>
    );
  }

  const shiftType = profile.shiftType || "day";
  const sessionsKey = shiftType === "night" ? "nightSessions" : shiftType === "emergency" ? "emergencySessions" : "daySessions";
  const sessions = settings[sessionsKey];
  const bookingWindow = shiftType === "night" ? settings.bookingWindow.night : settings.bookingWindow.day;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4">My Shift & Duty Timing</h3>

        <div className="card shadow-sm p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">Dr. {profile.name}</h5>
              <p className="text-muted mb-0">{profile.specialization}</p>
            </div>
            <span className={`badge bg-${shiftColors[shiftType]} fs-6 text-capitalize px-3 py-2`}>
              {shiftType} Shift
            </span>
          </div>
        </div>

        <div className="card shadow-sm p-4 mb-4">
          <h6 className="mb-3">Consultation Sessions</h6>
          {sessions.map((s, idx) => (
            <div key={idx} className="d-flex justify-content-between border-bottom py-2">
              <span>Session {idx + 1}</span>
              <span className="fw-semibold">{s.start} – {s.end}</span>
            </div>
          ))}
        </div>

        {shiftType !== "emergency" && (
          <div className="card shadow-sm p-4">
            <h6 className="mb-2">Patient Booking Window</h6>
            <p className="mb-0">
              Patients can book appointments with you between{" "}
              <strong>{bookingWindow.start}</strong> and <strong>{bookingWindow.end}</strong>.
            </p>
          </div>
        )}

        {shiftType === "emergency" && (
          <div className="alert alert-danger">
            🚨 You are on <strong>Emergency</strong> duty — patients can book with you anytime, 24/7.
          </div>
        )}
      </div>
    </>
  );
};

export default MyShift;
