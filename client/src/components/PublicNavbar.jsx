import { Link } from "react-router-dom";

const PublicNavbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-blur px-4 py-3 sticky-top shadow-sm">
      <Link className="navbar-brand fw-bold fs-4" to="/">
        🏥 CityCare Hospital
      </Link>
      <div className="ms-auto d-flex gap-2">
        <Link className="btn btn-outline-light btn-sm px-3" to="/login">
          Login
        </Link>
        <Link className="btn btn-light btn-sm px-3 fw-semibold" to="/signup">
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default PublicNavbar;