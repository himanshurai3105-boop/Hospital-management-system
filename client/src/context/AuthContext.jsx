import { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (error) {
        // Token tabhi hatao jab server ne sach mein reject kiya (401/403).
        // Network ya server ki temporary dikkat par logout nahi karna.
        const status = error.response?.status;
        if (status === 401 || status === 403) localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data);
    return res.data;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await api.post("/auth/register", formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  // Profile update ke baad ya kabhi bhi taaza user lene ke liye
  const refreshUser = useCallback(async () => {
    const res = await api.get("/auth/me");
    setUser(res.data);
    return res.data;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};