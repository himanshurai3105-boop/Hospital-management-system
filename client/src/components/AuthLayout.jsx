import { Link } from "react-router-dom";

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="auth-shell">
    <aside className="auth-aside">
      <Link to="/" className="auth-aside__brand">🏥 CityCare Hospital</Link>

      <div className="auth-stack" aria-hidden="true">
        <div className="auth-chip auth-chip--1">📅 Book a doctor in a few taps</div>
        <div className="auth-chip auth-chip--2">⏱️ Follow your queue live</div>
        <div className="auth-chip auth-chip--3">🧪 Lab reports, online</div>
      </div>

      <h2>Care that fits your day</h2>
      <p>Book visits, track your turn and keep every report in one safe place.</p>
      <ul className="auth-points">
        <li>✅ Daily and specialist appointments</li>
        <li>✅ Prescriptions and lab results</li>
        <li>✅ Works on phone, tablet and laptop</li>
      </ul>
    </aside>

    <main className="auth-main">
      <Link to="/" className="auth-mobile-brand">🏥 CityCare Hospital</Link>
      <div className="auth-card">
        <h3 className="mb-1">{title}</h3>
        {subtitle && <p className="text-muted mb-4">{subtitle}</p>}
        {children}
        <p className="text-center mt-4 mb-0">{footer}</p>
      </div>
    </main>
  </div>
);

export default AuthLayout;