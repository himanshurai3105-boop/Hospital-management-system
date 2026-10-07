import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomeLink } from "../utils/homeRoute";

const PublicNavbar = () => {
  const { user, loading } = useAuth();

  return (
    <nav className="navbar navbar-dark navbar-blur px-3 px-md-4 py-2 py-md-3 sticky-top shadow-sm flex-nowrap">
      <Link className="navbar-brand fw-bold fs-5 m-0 text-truncate" to="/">
        🏥 CityCare<span className="d-none d-sm-inline"> Hospital</span>
      </Link>
      <div className="ms-auto d-flex gap-2 flex-shrink-0">
        {loading ? null : user ? (
          <Link className="btn btn-light btn-sm px-3 fw-semibold" to={getHomeLink(user)}>
            My Dashboard
          </Link>
        ) : (
          <>
            <Link className="btn btn-outline-light btn-sm px-3" to="/login">Login</Link>
            <Link className="btn btn-light btn-sm px-3 fw-semibold" to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;