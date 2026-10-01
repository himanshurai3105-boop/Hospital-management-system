import { useAuth } from "../../context/AuthContext";

const DoctorDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dr. {user?.name}</h2>
        <button className="btn btn-outline-danger" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card shadow-sm p-3 text-center">
            <h5>Today's Appointments</h5>
            <p className="text-muted">View and manage today's schedule</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm p-3 text-center">
            <h5>Manage Profile</h5>
            <p className="text-muted">Update your professional details</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;