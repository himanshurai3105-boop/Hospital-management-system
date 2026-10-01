import { forwardRef } from "react";

const GST_RATE = 0.18; // 18% GST (9% CGST + 9% SGST)

const Receipt = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const baseAmount = data.amount / (1 + GST_RATE);
  const gstAmount = data.amount - baseAmount;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return (
    <div ref={ref} className="p-4" style={{ fontFamily: "Arial, sans-serif", maxWidth: "700px", margin: "0 auto" }}>
      <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
        <div>
          <h4 className="fw-bold mb-1">🏥 CityCare Hospital</h4>
          <p className="mb-0 small text-muted">123 MG Road, New Delhi, India</p>
          <p className="mb-0 small text-muted">GSTIN: 07ABCDE1234F1Z5</p>
          <p className="mb-0 small text-muted">Email: billing@citycare.com</p>
        </div>
        <div className="text-end">
          <h5 className="fw-bold">INVOICE</h5>
          <p className="mb-0 small">Invoice #: {data.invoiceNumber}</p>
          <p className="mb-0 small">Date: {new Date(data.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <p className="mb-0 fw-semibold">Billed To:</p>
          <p className="mb-0">{data.patientName}</p>
          <p className="mb-0 small text-muted">{data.patientEmail}</p>
        </div>
        <div className="col-6 text-end">
          <p className="mb-0 fw-semibold">Payment Status:</p>
          <span className="badge bg-success">PAID</span>
        </div>
      </div>

      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Description</th>
            <th className="text-end">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.description}</td>
              <td className="text-end">₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="table table-borderless" style={{ maxWidth: "350px", marginLeft: "auto" }}>
        <tbody>
          <tr>
            <td>Subtotal (Taxable Value)</td>
            <td className="text-end">₹{baseAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>CGST (9%)</td>
            <td className="text-end">₹{cgst.toFixed(2)}</td>
          </tr>
          <tr>
            <td>SGST (9%)</td>
            <td className="text-end">₹{sgst.toFixed(2)}</td>
          </tr>
          <tr className="border-top fw-bold">
            <td>Total Amount Paid</td>
            <td className="text-end">₹{data.amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 pt-3 border-top text-center text-muted small">
        <p className="mb-0">This is a computer-generated invoice and does not require a signature.</p>
        <p className="mb-0">Thank you for choosing CityCare Hospital.</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";
export default Receipt;