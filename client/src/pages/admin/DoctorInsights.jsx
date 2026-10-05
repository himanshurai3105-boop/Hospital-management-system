import { useState, useEffect } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import PatientHistorySearch from "../../components/PatientHistorySearch";
import DateFilterBar, { todayFilter, filterToParams, filterLabel, isBadRange } from "../../components/DateFilterBar";

const DoctorInsights = () => {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(todayFilter);
  const [result, setResult] = useState({ singleDay: true, doctors: [] });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (isBadRange(filter)) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await api.get("/doctor-insights/admin/doctors", {
          params: { q, ...filterToParams(filter) },
        });
        if (alive) setResult(res.data);
      } catch (e) {
        console.error("Doctor stats failed");
      }
    };
    const t = setTimeout(load, 400);
    const iv = setInterval(load, 15000);
    return () => {
      alive = false;
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [q, filter]);

  const { singleDay, doctors } = result;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-3">Doctor Insights</h3>

        <div className="card p-3 mb-3 shadow-sm">
          <input
            className="form-control mb-2"
            placeholder="🔍 Doctor name, Hospital ID or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <DateFilterBar value={filter} onChange={setFilter} />
          <small className="text-muted mt-2">
            Stats for {filterLabel(filter) || "all time"}. Updates every 15s.
          </small>
        </div>

        <div className="table-responsive mb-4">
          <table className="table table-bordered align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th>Doctor</th>
                <th>Type</th>
                <th>Total</th>
                <th>{singleDay ? "Confirmed" : "Pending"}</th>
                <th>Waiting</th>
                <th>Checked</th>
                <th>Cancelled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <tr><td colSpan="8" className="text-center text-muted">No doctors found.</td></tr>
              )}
              {doctors.map((d) => (
                <tr key={d._id} className={selected?._id === d._id ? "table-primary" : ""}>
                  <td>
                    <strong>{d.name}</strong>
                    <div className="small text-muted">
                      {d.specialization} {d.employeeId && `· ${d.employeeId}`}
                    </div>
                  </td>
                  <td>{d.bookingType === "scheduled" ? "Special" : `Daily (${d.shiftType})`}</td>
                  <td>{d.total}</td>
                  <td>{d.confirmed}</td>
                  <td>{d.bookingType === "scheduled" || !singleDay ? "—" : d.waiting}</td>
                  <td>{d.completed}</td>
                  <td>{d.cancelled}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => setSelected(d)}>
                      View patients
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Patients of {selected.name}</h5>
              <button className="btn btn-sm btn-link" onClick={() => setSelected(null)}>Close</button>
            </div>
            <PatientHistorySearch
              endpoint={`/doctor-insights/admin/doctors/${selected._id}/patients`}
              recordPath={(id) => `/admin/patients/${id}/record`}
            />
          </>
        )}
      </div>
    </>
  );
};

export default DoctorInsights;