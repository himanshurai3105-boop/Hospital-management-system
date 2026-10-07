import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const ShiftSettings = () => {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/shift-settings");
      setSettings(res.data);
    } catch (error) {
      toast.error("Failed to load shift settings");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSessionChange = (shiftKey, index, field, value) => {
    const updated = { ...settings };
    updated[shiftKey][index][field] = value;
    setSettings(updated);
  };

  const handleBookingWindowChange = (period, field, value) => {
    const updated = { ...settings };
    updated.bookingWindow[period][field] = value;
    setSettings(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/shift-settings", settings);
      toast.success("Shift settings updated!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <>
        <Navbar />
        <div className="container mt-4"><p>Loading...</p></div>
      </>
    );
  }

  const renderSessionsEditor = (title, shiftKey) => (
    <div className="card shadow-sm p-4 mb-4">
      <h5 className="mb-3">{title}</h5>
      {settings[shiftKey].map((session, idx) => (
        <div className="row g-2 mb-2 align-items-center" key={idx}>
          <div className="col-auto">Session {idx + 1}:</div>
          <div className="col-md-3">
            <input
              type="time"
              className="form-control"
              value={session.start}
              onChange={(e) => handleSessionChange(shiftKey, idx, "start", e.target.value)}
            />
          </div>
          <div className="col-auto">to</div>
          <div className="col-md-3">
            <input
              type="time"
              className="form-control"
              value={session.end}
              onChange={(e) => handleSessionChange(shiftKey, idx, "end", e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <h3 className="mb-4">Shift Timings Settings</h3>

        <div className="card shadow-sm p-4 mb-4">
          <h5 className="mb-3">Booking Windows</h5>
          <p className="text-muted small">When patients are allowed to book appointments for each shift type. Emergency doctors are always bookable.</p>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Day Shift Booking Window</label>
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="time"
                  className="form-control"
                  value={settings.bookingWindow.day.start}
                  onChange={(e) => handleBookingWindowChange("day", "start", e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  className="form-control"
                  value={settings.bookingWindow.day.end}
                  onChange={(e) => handleBookingWindowChange("day", "end", e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Night Shift Booking Window</label>
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="time"
                  className="form-control"
                  value={settings.bookingWindow.night.start}
                  onChange={(e) => handleBookingWindowChange("night", "start", e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  className="form-control"
                  value={settings.bookingWindow.night.end}
                  onChange={(e) => handleBookingWindowChange("night", "end", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {renderSessionsEditor("Day Shift — Consultation Sessions", "daySessions")}
        {renderSessionsEditor("Night Shift — Consultation Sessions", "nightSessions")}
        {renderSessionsEditor("Emergency Shift — Consultation Sessions", "emergencySessions")}

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save All Settings"}
        </button>
      </div>
    </>
  );
};

export default ShiftSettings;
