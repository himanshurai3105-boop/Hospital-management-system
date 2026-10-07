import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomeLink } from "../utils/homeRoute";

const ProtectedRoute = ({ children, allowedRoles, allowedStaffTypes }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // Galat role/staff type ho to apne sahi home par bhejo
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeLink(user)} replace />;
  }
  if (allowedStaffTypes && user.role === "staff" && !allowedStaffTypes.includes(user.staffType)) {
    return <Navigate to={getHomeLink(user)} replace />;
  }

  return children;
};

export default ProtectedRoute;