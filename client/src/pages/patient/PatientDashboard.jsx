import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";

const PatientDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2 className="mb-4">Welcome, {user?.name}</h2>

        <div className="row g-4">
          <div className="col-md-4">
            <Link to="/patient/book-appointment" className="text-decoration-none text-dark">
              <div className="card shadow-sm p-3 text-center h-100">
                <h5>Book Appointment</h5>
                <p className="text-muted">Find a doctor and book a slot</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/patient/history" className="text-decoration-none text-dark">
              <div className="card shadow-sm p-3 text-center h-100">
                <h5>Appointment History</h5>
                <p className="text-muted">View your past appointments</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3 text-center h-100">
              <h5>Profile</h5>
              <p className="text-muted">Update your information (coming soon)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientDashboard;