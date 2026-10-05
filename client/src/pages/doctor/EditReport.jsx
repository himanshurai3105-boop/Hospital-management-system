import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import ReportForm from "../../components/ReportForm";

const EditReport = () => {
  const { reportId } = useParams();
  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <Link to="/doctor/reports" className="btn btn-link p-0 mb-2">← Back to reports</Link>
        <h3 className="mb-4">Edit Report</h3>
        <ReportForm reportId={reportId} />
      </div>
    </>
  );
};

export default EditReport;