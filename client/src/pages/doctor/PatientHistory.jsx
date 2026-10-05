import Navbar from "../../components/Navbar";
import PatientHistorySearch from "../../components/PatientHistorySearch";

const PatientHistory = () => (
  <>
    <Navbar />
    <div className="container mt-4">
      <h3 className="mb-3">My Patient History</h3>
      <PatientHistorySearch
        endpoint="/doctor-insights/my/patients"
        recordPath={(id) => `/doctor/patients/${id}`}
      />
    </div>
  </>
);

export default PatientHistory;