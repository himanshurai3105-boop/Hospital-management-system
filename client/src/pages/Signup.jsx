import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import AuthLayout from "../components/AuthLayout";

const RULES = [
  ["At least 8 characters", (p) => p.length >= 8],
  ["One uppercase letter", (p) => /[A-Z]/.test(p)],
  ["One lowercase letter", (p) => /[a-z]/.test(p)],
  ["One number", (p) => /[0-9]/.test(p)],
  ["One special character", (p) => /[^A-Za-z0-9]/.test(p)],
];

const Signup = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", age: "", gender: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setFormData({ ...formData, [name]: v });
  };

  const results = RULES.map(([label, test]) => [label, test(formData.password)]);
  const passed = results.filter(([, ok]) => ok).length;
  const barColor = passed <= 2 ? "#dc3545" : passed <= 4 ? "#ffc107" : "#198754";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(formData.phone)) return toast.error("Please enter a valid 10-digit phone number");
    if (formData.age !== "" && !(Number(formData.age) >= 0 && Number(formData.age) <= 120)) {
      return toast.error("Please enter a valid age");
    }
    if (passed < RULES.length || formData.password.length > 72) {
      return toast.error("Password does not meet all requirements");
    }

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone,
        age: formData.age === "" ? undefined : Number(formData.age),
        gender: formData.gender || undefined,
      });
      toast.success("Account created successfully!");
      navigate("/patient/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up as a patient. It takes a minute."
      footer={<>Already have an account? <Link to="/login">Login</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input type="text" name="name" className="form-control" autoComplete="name"
            value={formData.name} onChange={handleChange} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" name="email" className="form-control" autoComplete="email"
            value={formData.email} onChange={handleChange} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="pw-wrap">
            <input type={showPw ? "text" : "password"} name="password" className="form-control"
              autoComplete="new-password" maxLength={72} value={formData.password} onChange={handleChange} required />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          {formData.password && (
            <>
              <div className="pw-meter mt-2">
                <span style={{ width: `${(passed / RULES.length) * 100}%`, background: barColor }} />
              </div>
              <div className="mt-2 small">
                {results.map(([label, ok]) => (
                  <div key={label} className={ok ? "text-success" : "text-danger"}>
                    {ok ? "✓" : "✗"} {label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input type="tel" name="phone" className="form-control" inputMode="numeric" autoComplete="tel-national"
            placeholder="10-digit mobile number" value={formData.phone} onChange={handleChange} maxLength={10} required />
        </div>

        <div className="row g-3 mb-4">
          <div className="col-5">
            <label className="form-label">Age</label>
            <input type="number" name="age" className="form-control" inputMode="numeric" min="0" max="120"
              value={formData.age} onChange={handleChange} />
          </div>
          <div className="col-7">
            <label className="form-label">Gender</label>
            <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Signup;