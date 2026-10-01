import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    aadhaarNumber: "",
    age: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password strength checks (visual feedback, backend still validates too)
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend quick checks before hitting API
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
      toast.error("Aadhaar number must be exactly 12 digits");
      return;
    }
    if (!Object.values(passwordChecks).every(Boolean)) {
      toast.error("Password does not meet all requirements");
      return;
    }

    setLoading(true);
    try {
      await register({ ...formData, role: "patient" });
      toast.success("Account created successfully!");
      navigate("/patient/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center py-5" style={{ minHeight: "90vh" }}>
      <div className="card shadow-sm p-4" style={{ maxWidth: "480px", width: "100%" }}>
        <h3 className="text-center mb-4">Patient Signup</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {formData.password && (
              <div className="mt-2 small">
                <div className={passwordChecks.length ? "text-success" : "text-danger"}>
                  {passwordChecks.length ? "✓" : "✗"} At least 8 characters
                </div>
                <div className={passwordChecks.uppercase ? "text-success" : "text-danger"}>
                  {passwordChecks.uppercase ? "✓" : "✗"} One uppercase letter
                </div>
                <div className={passwordChecks.lowercase ? "text-success" : "text-danger"}>
                  {passwordChecks.lowercase ? "✓" : "✗"} One lowercase letter
                </div>
                <div className={passwordChecks.number ? "text-success" : "text-danger"}>
                  {passwordChecks.number ? "✓" : "✗"} One number
                </div>
                <div className={passwordChecks.special ? "text-success" : "text-danger"}>
                  {passwordChecks.special ? "✓" : "✗"} One special character
                </div>
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="form-control"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Aadhaar Number <span className="text-muted">(optional)</span>
            </label>
            <input
              type="text"
              name="aadhaarNumber"
              className="form-control"
              placeholder="12-digit Aadhaar number"
              value={formData.aadhaarNumber}
              onChange={handleChange}
              maxLength={12}
            />
            <small className="text-muted">Used for identity verification during hospital visits</small>
          </div>

          <div className="row">
            <div className="col mb-3">
              <label className="form-label">Age</label>
              <input type="number" name="age" className="form-control" value={formData.age} onChange={handleChange} />
            </div>
            <div className="col mb-3">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center mt-3 mb-0">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;