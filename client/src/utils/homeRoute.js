// Har role ka home page (Login, Navbar aur ProtectedRoute teeno yahi use karte hain)
export const getHomeLink = (user) => {
  if (!user) return "/login";
  switch (user.role) {
    case "admin":
      return "/admin/dashboard";
    case "doctor":
      return "/doctor/appointments";
    case "receptionist":
      return "/receptionist/dashboard";
    case "patient":
      return "/patient/dashboard";
    case "staff":
      if (user.staffType === "bed_coordinator") return "/staff/bed-coordinator";
      if (user.staffType === "pharmacist") return "/staff/pharmacy";
      if (user.staffType === "lab_technician") return "/staff/lab";
      return "/staff/dashboard";
    default:
      return "/";
  }
};