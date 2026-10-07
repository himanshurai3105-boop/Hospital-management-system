// Phone par table ki har row card ban jaati hai. Har cell par uske column ka naam (data-label) lagta hai.
// Kisi table ko card nahi banana ho to usme className="... no-stack" jodo.
const labelTable = (table) => {
  const head = table.tHead;
  if (!head || head.rows.length !== 1) return;
  const heads = [...head.rows[0].cells];
  if (heads.some((h) => h.colSpan > 1 || h.rowSpan > 1)) return;

  const labels = heads.map((h) => h.textContent.trim());
  table.classList.add("stack-table");

  for (const body of table.tBodies) {
    for (const row of body.rows) {
      [...row.cells].forEach((cell, i) => {
        if (cell.colSpan > 1) {
          cell.classList.add("stack-full");
          cell.removeAttribute("data-label");
          return;
        }
        const label = labels[i] || "";
        if (label) {
          if (cell.getAttribute("data-label") !== label) cell.setAttribute("data-label", label);
        } else {
          cell.removeAttribute("data-label");
        }
      });
    }
  }
};

let queued = false;
const run = () => {
  queued = false;
  document.querySelectorAll("table.table:not(.no-stack)").forEach(labelTable);
};
const schedule = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(run);
};

export const startStackTables = () => {
  // sirf childList dekhte hain, attributes nahi, taaki loop na bane
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  schedule();
};