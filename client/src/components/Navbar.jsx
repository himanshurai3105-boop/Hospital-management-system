import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomeLink } from "../utils/homeRoute";

// Har role ka menu: seedha link ya group (children ke saath)
const MENUS = {
  patient: [
    { label: "Dashboard", to: "/patient/dashboard" },
    { label: "Book Appointment", to: "/patient/book-appointment" },
    { label: "Live Queue", to: "/patient/my-queue" },
    { label: "History", to: "/patient/history" },
    {
      label: "Health Records",
      children: [
        { label: "My Reports", to: "/patient/reports" },
        { label: "Medicine History", to: "/patient/medicine-history" },
        { label: "My Checkups", to: "/patient/checkups" },
      ],
    },
    {
      label: "Rooms",
      children: [
        { label: "Book Room", to: "/patient/book-room" },
        { label: "My Rooms", to: "/patient/my-rooms" },
      ],
    },
    {
      label: "Feedback",
      children: [
        { label: "Give Feedback", to: "/patient/give-feedback" },
        { label: "My Reviews", to: "/patient/my-feedback" },
      ],
    },
  ],
  doctor: [
    { label: "Today's Appointments", to: "/doctor/appointments" },
    {
      label: "Patients",
      children: [
        { label: "My Patients", to: "/doctor/patients" },
        { label: "Patient History", to: "/doctor/patient-history" },
      ],
    },
    {
      label: "Reports",
      children: [
        { label: "Add Report", to: "/doctor/add-report" },
        { label: "My Reports", to: "/doctor/reports" },
        { label: "Schedule Checkup", to: "/doctor/schedule-checkup" },
        { label: "Checkups", to: "/doctor/checkups" },
      ],
    },
    {
      label: "Rooms",
      children: [
        { label: "Request Room", to: "/doctor/request-room" },
        { label: "My Room Requests", to: "/doctor/my-room-requests" },
      ],
    },
    {
      label: "My Work",
      children: [
        { label: "My Salary", to: "/doctor/salary" },
        { label: "My Shift", to: "/doctor/my-shift" },
      ],
    },
  ],
  admin: [
    { label: "Dashboard", to: "/admin/dashboard" },
    {
      label: "People",
      children: [
        { label: "Doctors", to: "/admin/doctors" },
        { label: "Doctor Insights", to: "/admin/doctor-insights" },
        { label: "Patients", to: "/admin/patients" },
        { label: "Receptionists", to: "/admin/receptionists" },
        { label: "Staff", to: "/admin/staff" },
      ],
    },
    { label: "Appointments", to: "/admin/appointments" },
    {
      label: "Hospital",
      children: [
        { label: "Rooms", to: "/admin/rooms" },
        { label: "Equipment", to: "/admin/equipment" },
        { label: "Medicines", to: "/admin/medicines" },
        { label: "Lab Tests", to: "/admin/lab-tests" },
      ],
    },
    {
      label: "Finance & Settings",
      children: [
        { label: "Payroll", to: "/admin/payroll" },
        { label: "Shift Settings", to: "/admin/shift-settings" },
      ],
    },
  ],
};

const linkCls = ({ isActive }) => `nav-link-btn${isActive ? " active" : ""}`;
const subCls = ({ isActive }) => `nav-sub${isActive ? " active" : ""}`;

const NavGroup = ({ item, openKey, setOpenKey }) => {
  const { pathname } = useLocation();
  const isOpen = openKey === item.label;
  const active = item.children.some((c) => pathname.startsWith(c.to));

  return (
    <div className={`nav-group${isOpen ? " is-open" : ""}`}>
      <button
        type="button"
        className={`nav-link-btn${active ? " active" : ""}`}
        aria-expanded={isOpen}
        onClick={() => setOpenKey(isOpen ? null : item.label)}
      >
        <span>{item.label}</span>
        <span className="caret">▾</span>
      </button>
      <div className="nav-group-menu">
        {item.children.map((c) => (
          <NavLink key={c.to} to={c.to} className={subCls}>
            {c.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [openKey, setOpenKey] = useState(null);
  const ref = useRef(null);

  // Page badalte hi menu band
  useEffect(() => {
    setOpen(false);
    setOpenKey(null);
  }, [pathname]);

  // Bahar click / tap par dropdown band
  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenKey(null);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, []);

  const home = getHomeLink(user);
  const items = MENUS[user?.role] || (user ? [{ label: "Dashboard", to: home }] : []);

  return (
    <nav className="app-nav" ref={ref}>
      <div className="app-nav__inner">
        <Link className="app-nav__brand" to={home}>
          🏥 Hospital MS
        </Link>

        <button
          type="button"
          className={`app-nav__toggle${open ? " is-open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <div className={`app-nav__menu${open ? " is-open" : ""}`}>
          <div className="app-nav__links">
            {items.map((item) =>
              item.children ? (
                <NavGroup key={item.label} item={item} openKey={openKey} setOpenKey={setOpenKey} />
              ) : (
                <NavLink key={item.to} to={item.to} className={linkCls}>
                  {item.label}
                </NavLink>
              )
            )}
          </div>

          <div className="app-nav__user">
            {user ? (
              <>
                <NavLink to="/profile" className={linkCls}>My Profile</NavLink>
                <button className="btn btn-light btn-sm" onClick={logout}>Logout</button>
              </>
            ) : (
              <Link className="btn btn-light btn-sm" to="/login">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;