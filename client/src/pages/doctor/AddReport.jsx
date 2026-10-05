import Navbar from "../../components/Navbar";
import ReportForm from "../../components/ReportForm";

const AddReport = () => (
  <>
    <Navbar />
    <div className="container mt-4 mb-5">
      <h3 className="mb-4">Add Patient Report</h3>
      <ReportForm />
    </div>
  </>
);

export default AddReport;