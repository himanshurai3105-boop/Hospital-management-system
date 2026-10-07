import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { getHomeLink } from "../utils/homeRoute";
import AuthLayout from "../components/AuthLayout";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(formData.email.trim(), formData.password);
      toast.success("Login successful!");
      navigate(getHomeLink(user));
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to manage your appointments and reports."
      footer={<>Don't have an account? <Link to="/signup">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email" name="email" className="form-control" autoComplete="username"
            value={formData.email} onChange={handleChange} required
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Password</label>
          <div className="pw-wrap">
            <input
              type={showPw ? "text" : "password"} name="password" className="form-control"
              autoComplete="current-password" value={formData.password} onChange={handleChange} required
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;