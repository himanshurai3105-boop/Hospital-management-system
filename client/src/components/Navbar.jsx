import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = "btn btn-outline-light btn-sm";

// Har role ka home page, Login.jsx ke redirect se same
const getHomeLink = (user) => {
  if (!user) return "/login";
  switch (user.role) {
    case "admin":
      return "/admin/dashboard";
    case "doctor":
      return "/doctor/appointments";
    case "receptionist":
      return "/receptionist/dashboard";
    case "patient":
      return "/patient/dashboard";
    case "staff":
      if (user.staffType === "bed_coordinator") return "/staff/bed-coordinator";
      if (user.staffType === "pharmacist") return "/staff/pharmacy";
      return "/staff/dashboard";
    default:
      return "/"; // koi naya ya unknown role aaye to bhi koi redirect loop nahi
  }
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const homeLink = getHomeLink(user);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
      <Link className="navbar-brand" to={homeLink}>
        🏥 Hospital MS
      </Link>
      <div className="ms-auto d-flex flex-wrap gap-2 justify-content-end">
        {user?.role === "patient" && (
          <>
            <Link className={linkClass} to="/patient/dashboard">Dashboard</Link>
            <Link className={linkClass} to="/patient/book-appointment">Book Appointment</Link>
            <Link className={linkClass} to="/patient/my-queue">Live Queue</Link>
            <Link className={linkClass} to="/patient/history">History</Link>
            <Link className={linkClass} to="/patient/my-rooms">My Rooms</Link>
            <Link className={linkClass} to="/patient/reports">My Reports</Link>
            <Link className={linkClass} to="/patient/medicine-history">Medicine History</Link>
            <Link className={linkClass} to="/patient/checkups">My Checkups</Link>
            <Link className={linkClass} to="/patient/give-feedback">Give Feedback</Link>
            <Link className={linkClass} to="/patient/my-feedback">My Reviews</Link>
          </>
        )}

        {user?.role === "doctor" && (
          <>
            <Link className={linkClass} to="/doctor/appointments">Today's Appointments</Link>
            <Link className={linkClass} to="/doctor/add-report">Add Report</Link>
            <Link className={linkClass} to="/doctor/reports">My Reports</Link>
            <Link className={linkClass} to="/doctor/salary">My Salary</Link>
            <Link className={linkClass} to="/doctor/my-shift">My Shift</Link>
            <Link className={linkClass} to="/doctor/patients">My Patients</Link>
            <Link className={linkClass} to="/doctor/patient-history">Patient History</Link>
            <Link className={linkClass} to="/doctor/request-room">Request Room</Link>
            <Link className={linkClass} to="/doctor/my-room-requests">My Room Requests</Link>
            <Link className={linkClass} to="/doctor/schedule-checkup">Schedule Checkup</Link>
            <Link className={linkClass} to="/doctor/checkups">Checkups</Link>
          </>
        )}

        {user?.role === "admin" && (
          <>
            <Link className={linkClass} to="/admin/dashboard">Dashboard</Link>
            <Link className={linkClass} to="/admin/doctors">Doctors</Link>
            <Link className={linkClass} to="/admin/doctor-insights">Doctor Insights</Link>
            <Link className={linkClass} to="/admin/patients">Patients</Link>
            <Link className={linkClass} to="/admin/appointments">Appointments</Link>
            <Link className={linkClass} to="/admin/rooms">Rooms</Link>
            <Link className={linkClass} to="/admin/medicines">Medicines</Link>
            <Link className={linkClass} to="/admin/lab-tests">Lab Tests</Link>
            <Link className={linkClass} to="/admin/equipment">Equipment</Link>
            <Link className={linkClass} to="/admin/payroll">Payroll</Link>
            <Link className={linkClass} to="/admin/shift-settings">Shift Settings</Link>
            <Link className={linkClass} to="/admin/receptionists">Receptionists</Link>
            <Link className={linkClass} to="/admin/staff">Staff</Link>
          </>
        )}

        {(user?.role === "receptionist" || user?.role === "staff") && (
          <Link className={linkClass} to={homeLink}>Dashboard</Link>
        )}

        {user && (
          <Link className={linkClass} to="/profile">My Profile</Link>
        )}

        {user ? (
          <button className="btn btn-light btn-sm" onClick={logout}>
            Logout
          </button>
        ) : (
          <Link className="btn btn-light btn-sm" to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;