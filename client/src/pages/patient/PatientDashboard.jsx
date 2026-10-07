import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Tilt from "../../components/Tilt";

const TILES = [
  { to: "/patient/book-appointment?type=daily", icon: "🎫", title: "Daily Booking", text: "Same-day queue with a token", color: "blue" },
  { to: "/patient/book-appointment?type=special", icon: "📅", title: "Special Appointment", text: "Pick a specialist and a time", color: "purple" },
  { to: "/patient/my-queue", icon: "⏱️", title: "Live Queue", text: "Your position, right now", color: "teal" },
  { to: "/patient/history", icon: "🗂️", title: "Appointment History", text: "Past and upcoming visits", color: "slate" },
  { to: "/patient/reports", icon: "📝", title: "Reports", text: "Doctor and lab reports", color: "orange" },
  { to: "/patient/medicine-history", icon: "💊", title: "Medicines", text: "What was prescribed and collected", color: "green" },
  { to: "/patient/checkups", icon: "🧪", title: "Checkups", text: "Scheduled tests and results", color: "pink" },
  { to: "/patient/book-room", icon: "🛏️", title: "Rooms", text: "Book a room or bed", color: "red" },
];

const PatientDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <div className="hero mb-4">
          <h2>Welcome, {user?.name}</h2>
          <p>Book visits, follow your queue and see your reports, all in one place.</p>
        </div>

        <div className="row g-3 g-md-4">
          {TILES.map((t) => (
            <div className="col-6 col-lg-3" key={t.to}>
              <Tilt>
                <Link to={t.to} className={`tile tile--${t.color}`}>
                  <span className="tile__icon">{t.icon}</span>
                  <h6 className="tile__title">{t.title}</h6>
                  <p className="tile__text">{t.text}</p>
                </Link>
              </Tilt>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PatientDashboard;