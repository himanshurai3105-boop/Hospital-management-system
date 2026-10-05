import { useState, useEffect } from "react";
import api from "../services/api";

const QueueStats = () => {
  const [s, setS] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/appointments/queue/doctor-summary");
        setS(res.data);
      } catch (e) {
        console.error("Summary failed");
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  if (!s || !s.applicable) return null;

  const cards = [
    ["Total Today", s.total, "primary"],
    ["Confirmed", s.confirmed, "success"],
    ["Waiting", s.waiting, "warning"],
    ["Checked", s.completed, "secondary"],
  ];

  return (
    <div className="mb-4">
      <div className="row g-2 mb-2">
        {cards.map(([label, val, color]) => (
          <div className="col-6 col-md-3" key={label}>
            <div className={`card text-center p-2 border-${color}`}>
              <h4 className="mb-0">{val}</h4>
              <small className="text-muted">{label}</small>
            </div>
          </div>
        ))}
      </div>
      {s.carriedOver > 0 && <small className="text-muted">{s.carriedOver} carried over from the previous day (priority)</small>}
    </div>
  );
};

export default QueueStats;