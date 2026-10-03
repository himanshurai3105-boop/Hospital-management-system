import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  const homeLink =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "doctor"
      ? "/doctor/appointments"
      : "/patient/dashboard";

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
      <Link className="navbar-brand" to={homeLink}>
        🏥 Hospital MS
      </Link>
      <div className="ms-auto d-flex gap-2">
        {user?.role === "patient" && (
          <>
            <Link className="btn btn-outline-light btn-sm" to="/patient/dashboard">
              Dashboard
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/book-appointment">
              Book Appointment
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/history">
              History
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/my-rooms">
              My Rooms
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/reports">
              My Reports
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/pharmacy">
              Pharmacy
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/orders">
              My Orders
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/checkups">
              My Checkups
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/give-feedback">
              Give Feedback
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/patient/my-feedback">
              My Reviews
            </Link>
          </>
        )}

        {user?.role === "doctor" && (
  <>
              <Link className="btn btn-outline-light btn-sm" to="/doctor/appointments">
                Today's Appointments
              </Link>
              <Link className="btn btn-outline-light btn-sm" to="/doctor/add-report">
                Add Report
              </Link>
              <Link className="btn btn-outline-light btn-sm" to="/doctor/salary">
                My Salary
              </Link>
              <Link className="btn btn-outline-light btn-sm" to="/doctor/my-shift">
                My Shift
              </Link>
              <Link className="btn btn-outline-light btn-sm" to="/doctor/patients">
                My Patients
              </Link>
                <Link className="btn btn-outline-light btn-sm" to="/doctor/request-room">
                  Request Room
                </Link>
                <Link className="btn btn-outline-light btn-sm" to="/doctor/my-room-requests">
                  My Room Requests
                </Link>
                              <Link className="btn btn-outline-light btn-sm" to="/doctor/schedule-checkup">
                Schedule Checkup
              </Link>
              <Link className="btn btn-outline-light btn-sm" to="/doctor/checkups">
                Checkups
              </Link>
            </>
         )}
                  

        {user?.role === "admin" && (
          <>
            <Link className="btn btn-outline-light btn-sm" to="/admin/dashboard">
              Dashboard
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/admin/doctors">
              Doctors
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/admin/patients">
              Patients
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/admin/appointments">
              Appointments
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/admin/rooms">
              Rooms
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/admin/medicines">
              Medicines
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/admin/equipment">
              Equipment
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/admin/payroll">
              Payroll
            </Link>
            <Link className="btn btn-outline-light btn-sm" to="/admin/shift-settings">
            Shift Settings
          </Link>
          <Link className="btn btn-outline-light btn-sm" to="/admin/receptionists">
            Receptionists
          </Link>
          <Link className="btn btn-outline-light btn-sm" to="/admin/staff">
            Staff
          </Link>
         </>
        )}

        <Link className="btn btn-outline-light btn-sm" to="/profile">
          My Profile
        </Link>

        <button className="btn btn-light btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;