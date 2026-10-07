import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import { labCategoryLabels } from "../utils/labCategories";
import { openLabPdf } from "../utils/labPdf";
import { rangeText, flagClass, flagText } from "../utils/labFlags";

const STEPS = [
  ["ordered", "Ordered"],
  ["sample_collected", "Sample collected"],
  ["completed", "Result ready"],
];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const LabResultsList = ({ endpoint, empty = "No lab tests yet." }) => {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(endpoint);
        if (alive) setItems(res.data);
      } catch (e) {
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [endpoint]);

  const download = async (id) => {
    try {
      await openLabPdf(id);
    } catch (e) {
      toast.error("Could not open the PDF");
    }
  };

  if (items === null) return <p className="text-muted">Loading...</p>;
  if (items.length === 0) return <p className="text-muted">{empty}</p>;

  return (
    <div className="mb-4">
      {items.map((o) => {
        const idx = STEPS.findIndex((s) => s[0] === o.status);
        return (
          <div key={o._id} className="card shadow-sm p-3 mb-3">
            <div className="d-flex justify-content-between flex-wrap gap-2">
              <div>
                <h6 className="mb-0">
                  {o.testName}{" "}
                  {o.priority === "urgent" && <span className="badge bg-danger">Urgent</span>}
                </h6>
                <small className="text-muted">
                  {labCategoryLabels[o.category] || o.category} · Ordered by {o.doctor?.name || "-"} · {fmt(o.createdAt)}
                </small>
              </div>
              {o.status === "completed" && (
                <button className="btn btn-sm btn-outline-primary align-self-start" onClick={() => download(o._id)}>
                  Download PDF
                </button>
              )}
            </div>

            <div className="d-flex flex-wrap gap-1 my-2">
              {STEPS.map(([key, label], i) => (
                <span key={key} className={`badge ${i <= idx ? "bg-success" : "bg-light text-muted border"}`}>
                  {label}
                </span>
              ))}
            </div>

            {o.status === "completed" && o.result && (
              <>
                {o.result.values.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered mb-2">
                      <thead className="table-light">
                        <tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference range</th></tr>
                      </thead>
                      <tbody>
                        {o.result.values.map((v) => (
                          <tr key={v.name}>
                            <td>{v.name}</td>
                            <td className={flagClass[v.flag] || ""}>
                              {v.value} {flagText[v.flag] && <small>{flagText[v.flag]}</small>}
                            </td>
                            <td>{v.unit}</td>
                            <td className="text-muted">{rangeText(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {o.result.remarks && (
                  <p className="mb-1"><strong>Remarks:</strong> {o.result.remarks}</p>
                )}
                <small className="text-muted">
                  Reported {fmt(o.result.submittedAt)}
                  {o.amendmentCount > 0 && ` · Amended ${o.amendmentCount} time(s), last on ${fmt(o.lastAmendedAt)}`}
                </small>
                {o.amendments?.length > 0 && (
                  <ul className="small text-muted mb-0 mt-1">
                    {o.amendments.map((a, i) => (
                      <li key={i}>{fmt(a.at)} · {a.by || "Lab"}: {a.reason}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LabResultsList;