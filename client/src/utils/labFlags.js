// Live preview ke liye (server wahi logic dobara chalata hai, asli flag wahin se aata hai)
export const flagFor = (p, raw) => {
  const v = String(raw ?? "").trim();
  if (v === "") return "";
  if (p.refMin != null || p.refMax != null) {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    if (p.refMin != null && n < p.refMin) return "low";
    if (p.refMax != null && n > p.refMax) return "high";
    return "normal";
  }
  if (p.refText) return v.toLowerCase() === String(p.refText).toLowerCase() ? "normal" : "abnormal";
  return "";
};

export const rangeText = (p) =>
  p.refMin != null || p.refMax != null ? `${p.refMin ?? ""} - ${p.refMax ?? ""}` : p.refText || "";

export const flagClass = { high: "text-danger fw-bold", low: "text-warning fw-bold", abnormal: "text-danger fw-bold" };
export const flagText = { high: "▲ High", low: "▼ Low", abnormal: "⚠ Abnormal" };