"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api, { getToken, setToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setReady(true); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    setToken(r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  // Registration now sends an OTP; the user is NOT created yet.
  const register = async (name, email, password, adminSecretCode = "") => {
    // adminSecretCode is optional. It is validated ONLY on the server against
    // ADMIN_SECRET_CODE — the secret never lives in the frontend.
    const payload = { name, email, password };
    if (adminSecretCode) payload.adminSecretCode = adminSecretCode;
    const r = await api.post("/auth/register", payload);
    return r.data; // { success, email, expiresInMs }
  };

  const verifyOtp = async (email, otp) => {
    const r = await api.post("/auth/verify-otp", { email, otp });
    return r.data; // { success, user }
  };

  const resendOtp = async (email) => {
    const r = await api.post("/auth/resend-otp", { email });
    return r.data;
  };

  const forgotPassword = async (email) => {
    const r = await api.post("/auth/forgot-password", { email });
    return r.data;
  };

  const resetPassword = async (email, token, password) => {
    const r = await api.post("/auth/reset-password", { email, token, password });
    return r.data;
  };

  const updateAvatar = async (avatar) => {
    const r = await api.patch("/auth/avatar", { avatar });
    setUser(r.data.user);
    return r.data.user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const r = await api.post("/auth/change-password", { currentPassword, newPassword });
    return r.data;
  };

  const getAddresses = async () => {
    const r = await api.get("/auth/addresses");
    return r.data.addresses;
  };
  const addAddress = async (a) => (await api.post("/auth/addresses", a)).data.addresses;
  const updateAddress = async (id, a) => (await api.patch(`/auth/addresses/${id}`, a)).data.addresses;
  const deleteAddress = async (id) => (await api.delete(`/auth/addresses/${id}`)).data.addresses;

  const update = async (patch) => {
    const r = await api.patch("/auth/me", patch);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => { setToken(null); setUser(null); };

  return (
    <AuthContext.Provider
      value={{ user, ready, login, register, verifyOtp, resendOtp, forgotPassword, resetPassword, update, logout, updateAvatar, changePassword, getAddresses, addAddress, updateAddress, deleteAddress }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);