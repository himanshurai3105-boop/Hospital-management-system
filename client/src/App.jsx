import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import AppointmentHistory from "./pages/patient/AppointmentHistory";
import TodayAppointments from "./pages/doctor/TodayAppointments";
import AdminDashboard from "./pages/admin/AdminDashboard";

import ManageDoctors from "./pages/admin/ManageDoctors";
import ManagePatients from "./pages/admin/ManagePatients";
import ManageAppointments from "./pages/admin/ManageAppointments";
import Home from "./pages/Home";

import BookRoom from "./pages/patient/BookRoom";
import MyRoomBookings from "./pages/patient/MyRoomBookings";
import ManageRooms from "./pages/admin/ManageRooms";

import AddReport from "./pages/doctor/AddReport";
import MyReportsGiven from "./pages/doctor/MyReportsGiven";
import MyReports from "./pages/patient/MyReports";

import ManageMedicines from "./pages/admin/ManageMedicines";
import Pharmacy from "./pages/patient/Pharmacy";
import MyOrders from "./pages/patient/MyOrders";
import MyPatients from "./pages/doctor/MyPatients";
import PatientProfile from "./pages/doctor/PatientProfile";

import ManageEquipment from "./pages/admin/ManageEquipment";
import ScheduleCheckup from "./pages/doctor/ScheduleCheckup";
import DoctorMyCheckups from "./pages/doctor/MyCheckups";
import PatientMyCheckups from "./pages/patient/MyCheckups";

import GiveFeedback from "./pages/patient/GiveFeedback";
import MyFeedback from "./pages/patient/MyFeedback";

import Profile from "./pages/Profile";
import ReceiptView from "./pages/patient/ReceiptView";
import Payroll from "./pages/admin/Payroll";
import MySalary from "./pages/doctor/MySalary";

import ShiftSettings from "./pages/admin/ShiftSettings";
import MyShift from "./pages/doctor/MyShift";

import PatientFullRecord from "./pages/admin/PatientFullRecord";
import ManageReceptionists from "./pages/admin/ManageReceptionists";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";

import ManageStaff from "./pages/admin/ManageStaff";
import StaffDashboard from "./pages/staff/StaffDashboard";

import RequestRoom from "./pages/doctor/RequestRoom";
import MyRoomRequests from "./pages/doctor/MyRoomRequests";
import BedCoordinatorDashboard from "./pages/staff/BedCoordinatorDashboard";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/book-appointment"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/history"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <AppointmentHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <TodayAppointments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageDoctors />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManagePatients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageAppointments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/book-room"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <BookRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/my-rooms"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <MyRoomBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageRooms />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/add-report"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <AddReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/reports"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <MyReportsGiven />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/reports"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <MyReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/medicines"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageMedicines />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/pharmacy"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Pharmacy />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/orders"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <MyPatients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/patients/:patientId"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/equipment"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageEquipment />
              </ProtectedRoute>
            }
          />

           <Route
             path="/doctor/schedule-checkup"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <ScheduleCheckup />
               </ProtectedRoute>
              }
          />

          <Route
            path="/doctor/checkups"
            element={
               <ProtectedRoute allowedRoles={["doctor"]}>
                 <DoctorMyCheckups />
               </ProtectedRoute>
              }
          />

            <Route
              path="/patient/checkups"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientMyCheckups />
                </ProtectedRoute>
              }
            />

            <Route
                path="/patient/give-feedback"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <GiveFeedback />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/patient/my-feedback"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <MyFeedback />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                  path="/patient/receipt/:id"
                  element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                      <ReceiptView />
                    </ProtectedRoute>
                  }
                />
                <Route
                    path="/admin/payroll"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Payroll />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/doctor/salary"
                    element={
                      <ProtectedRoute allowedRoles={["doctor"]}>
                        <MySalary />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                path="/admin/shift-settings"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ShiftSettings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/doctor/my-shift"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <MyShift />
                  </ProtectedRoute>
                }
              />

              <Route
              path="/admin/patients/:id/record"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PatientFullRecord />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/receptionists"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ManageReceptionists />
                </ProtectedRoute>
              }
            />

            <Route
              path="/receptionist/dashboard"
              element={
                <ProtectedRoute allowedRoles={["receptionist"]}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />

                <Route
                      path="/admin/staff"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <ManageStaff />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/staff/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["staff"]}>
                          <StaffDashboard />
                        </ProtectedRoute>
                      }
                    />

                 <Route
                    path="/doctor/request-room"
                    element={
                      <ProtectedRoute allowedRoles={["doctor"]}>
                        <RequestRoom />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/doctor/my-room-requests"
                    element={
                      <ProtectedRoute allowedRoles={["doctor"]}>
                        <MyRoomRequests />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/staff/bed-coordinator"
                    element={
                      <ProtectedRoute allowedRoles={["staff"]}>
                        <BedCoordinatorDashboard />
                      </ProtectedRoute>
                    }
                  />
                    </Routes>
                    <ToastContainer position="top-right" autoClose={2000} />
                  </BrowserRouter>
                </AuthProvider>
              );
            }

            

export default App;