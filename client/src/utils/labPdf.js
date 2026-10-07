import api from "../services/api";

// PDF login token ke saath aati hai, isliye seedha link nahi, blob se kholte hain
export const openLabPdf = async (orderId) => {
  const res = await api.get(`/lab/orders/${orderId}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const win = window.open(url, "_blank");
  if (!win) {
    // popup block hua to download kara do
    const a = document.createElement("a");
    a.href = url;
    a.download = `lab-report-${orderId}.pdf`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};