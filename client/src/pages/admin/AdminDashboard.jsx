import DashboardHero from "../../components/DashboardHero";
import TileGrid from "../../components/TileGrid";
import { ADMIN_TILES } from "../../utils/dashboardTiles";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const COLORS = ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#20c997", "#fd7e14", "#0dcaf0"];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalDoctors: 0, totalPatients: 0, totalAppointments: 0 });
  const [analytics, setAnalytics] = useState(null);

  const [testingJob, setTestingJob] = useState(false);

  const handleTestJob = async () => {
    setTestingJob(true);
    try {
      const res = await api.post("/admin/trigger-auto-cancel");
      toast.success(res.data.message);
    } catch (error) {
      toast.error("Failed to run job");
    } finally {
      setTestingJob(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/analytics"),
        ]);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <DashboardHero icon="🏥" title="Admin Console" subtitle="Everything that runs the hospital, one tap away." />
<TileGrid tiles={ADMIN_TILES} />
<div className="mb-4" />
        <h2 className="mb-4">Admin Panel — {user?.name}</h2>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted">Total Doctors</h6>
              <h2>{stats.totalDoctors}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted">Total Patients</h6>
              <h2>{stats.totalPatients}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3 text-center bg-light">
              <h6 className="text-muted">Total Appointments</h6>
              <h2>{stats.totalAppointments}</h2>
            </div>
          </div>
        </div>

            <div className="card shadow-sm p-3 mb-4 bg-light">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-1">Auto-Cancel & Refund Job</h6>
          <small className="text-muted">
            Runs automatically every hour. Cancels overdue unattended appointments and refunds paid ones.
          </small>
        </div>
        <button className="btn btn-outline-danger btn-sm" onClick={handleTestJob} disabled={testingJob}>
          {testingJob ? "Running..." : "Run Now (Test)"}
        </button>
      </div>
    </div>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <Link to="/admin/doctors" className="text-decoration-none text-dark">
              <div className="card shadow-sm p-3 text-center h-100">
                <h5>Manage Doctors</h5>
                <p className="text-muted">Add, edit or remove doctors</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/admin/patients" className="text-decoration-none text-dark">
              <div className="card shadow-sm p-3 text-center h-100">
                <h5>View Patients</h5>
                <p className="text-muted">See all registered patients</p>
              </div>
            </Link>
          </div>
          <div className="col-md-4">
            <Link to="/admin/appointments" className="text-decoration-none text-dark">
              <div className="card shadow-sm p-3 text-center h-100">
                <h5>All Appointments</h5>
                <p className="text-muted">Monitor every appointment</p>
              </div>
            </Link>
          </div>
        </div>

        {analytics && (
          <>
            <h4 className="mb-3 mt-5">Analytics</h4>

            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="card shadow-sm p-3 text-center bg-light">
                  <h6 className="text-muted">Medicine Revenue (Paid)</h6>
                  <h3 className="text-success">₹{analytics.medicineRevenue}</h3>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow-sm p-3 text-center bg-light">
                  <h6 className="text-muted">Bed Occupancy</h6>
                  <h3>
                    {analytics.roomOccupancy.occupiedBeds} / {analytics.roomOccupancy.totalBeds}
                  </h3>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow-sm p-3 text-center bg-light">
                  <h6 className="text-muted">Available Beds</h6>
                  <h3 className="text-primary">{analytics.roomOccupancy.availableBeds}</h3>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="card shadow-sm p-3">
                  <h6 className="mb-3">Appointments — Last 7 Days</h6>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.appointmentsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#0d6efd" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm p-3">
                  <h6 className="mb-3">Appointments by Status</h6>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.appointmentsByStatus}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analytics.appointmentsByStatus.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm p-3">
                  <h6 className="mb-3">Doctors by Specialization</h6>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.doctorsBySpecialization} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#198754" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm p-3">
                  <h6 className="mb-3">Patient Gender Distribution</h6>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.genderDistribution}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analytics.genderDistribution.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;