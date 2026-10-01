import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";

const Profile = () => {
  const { user, setUserManually } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data);
      setFormData({
        name: res.data.name || "",
        phone: res.data.phone || "",
        age: res.data.age || "",
        gender: res.data.gender || "",
        address: res.data.address || "",
        specialization: res.data.specialization || "",
        experience: res.data.experience || "",
        fees: res.data.fees || "",
        availableTime: res.data.availableTime || "",
      });
    } catch (error) {
      toast.error("Failed to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/me", formData);
      setProfile(res.data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    setPwLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="container mt-4"><p>Loading...</p></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <h3 className="mb-4">My Profile</h3>

        <div className="card shadow-sm p-4 mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap">
            <div>
              <h5 className="mb-1">{profile.name}</h5>
              <p className="text-muted mb-1">{profile.email}</p>
              <span className="badge bg-primary text-capitalize">{profile.role}</span>
            </div>
            <div className="text-end">
              <p className="mb-0 text-muted small">Hospital ID</p>
              <h5 className="mb-0">{profile.hospitalId || "N/A"}</h5>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-7">
            <div className="card shadow-sm p-4">
              <h5 className="mb-3">Edit Profile Details</h5>
              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email (cannot be changed)</label>
                  <input type="email" className="form-control" value={profile.email} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} maxLength={10} />
                </div>

                {profile.role === "patient" && (
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
                )}

                {profile.role === "patient" && (
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} />
                  </div>
                )}

                {profile.role === "doctor" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Specialization</label>
                      <input type="text" name="specialization" className="form-control" value={formData.specialization} onChange={handleChange} />
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label className="form-label">Experience (yrs)</label>
                        <input type="number" name="experience" className="form-control" value={formData.experience} onChange={handleChange} />
                      </div>
                      <div className="col mb-3">
                        <label className="form-label">Fees (₹)</label>
                        <input type="number" name="fees" className="form-control" value={formData.fees} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Available Time</label>
                      <input type="text" name="availableTime" className="form-control" value={formData.availableTime} onChange={handleChange} placeholder="e.g. 10:00 AM - 4:00 PM" />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>

          <div className="col-md-5">
            <div className="card shadow-sm p-4">
              <h5 className="mb-3">Change Password</h5>
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className="form-control"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="form-control"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                  />
                </div>
                <button type="submit" className="btn btn-warning" disabled={pwLoading}>
                  {pwLoading ? "Updating..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;