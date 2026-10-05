const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const START_YEAR = 2020;

export const emptyFilter = { mode: "parts", day: "", month: "", year: "", from: "", to: "" };

// Aaj ki date (IST) pehle se bhari hui
export const todayFilter = () => {
  const [y, m, d] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    .split("-")
    .map(Number);
  return { ...emptyFilter, day: String(d), month: String(m), year: String(y) };
};

export const filterToParams = (f) => {
  const p = {};
  if (f.mode === "parts") {
    if (f.day) p.day = f.day;
    if (f.month) p.month = f.month;
    if (f.year) p.year = f.year;
  } else {
    if (f.from) p.from = f.from;
    if (f.to) p.to = f.to;
  }
  return p;
};

export const isBadRange = (f) => f.mode === "range" && f.from && f.to && f.from > f.to;

export const filterLabel = (f) => {
  if (f.mode === "parts") {
    return [f.day, f.month && MONTHS[f.month - 1], f.year].filter(Boolean).join(" ");
  }
  return [f.from && `from ${f.from}`, f.to && `to ${f.to}`].filter(Boolean).join(" ");
};

const DateFilterBar = ({ value, onChange }) => {
  const set = (patch) => onChange({ ...value, ...patch });
  const years = [];
  for (let y = new Date().getFullYear() + 1; y >= START_YEAR; y--) years.push(y);

  return (
    <div>
      <div className="btn-group btn-group-sm mb-2" role="group">
        <button
          type="button"
          className={`btn ${value.mode === "parts" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => set({ mode: "parts" })}
        >
          Day / Month / Year
        </button>
        <button
          type="button"
          className={`btn ${value.mode === "range" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => set({ mode: "range" })}
        >
          Date range
        </button>
      </div>

      {value.mode === "parts" ? (
        <div className="row g-2">
          <div className="col-4 col-md-2">
            <select className="form-select" value={value.day} onChange={(e) => set({ day: e.target.value })}>
              <option value="">All days</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="col-8 col-md-3">
            <select className="form-select" value={value.month} onChange={(e) => set({ month: e.target.value })}>
              <option value="">All months</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={value.year} onChange={(e) => set({ year: e.target.value })}>
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="row g-2">
          <div className="col-md-3">
            <label className="form-label small mb-0">From</label>
            <input type="date" className="form-control" value={value.from} onChange={(e) => set({ from: e.target.value })} />
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-0">To</label>
            <input type="date" className="form-control" value={value.to} onChange={(e) => set({ to: e.target.value })} />
          </div>
        </div>
      )}

      {isBadRange(value) && (
        <div className="text-danger small mt-2">"From" date "To" date se pehle honi chahiye.</div>
      )}
    </div>
  );
};

export default DateFilterBar;