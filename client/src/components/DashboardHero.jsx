const DashboardHero = ({ icon, title, subtitle, children }) => (
  <div className="hero mb-4 d-flex align-items-center gap-3">
    {icon && <div className="hero__icon floating-3d-icon">{icon}</div>}
    <div className="flex-grow-1">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  </div>
);

export default DashboardHero;