import api from "./axiosInstance";

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const refresh = () => api.post("/auth/refresh");
export const getMe = () => api.get("/auth/me");
export const getSecurityQuestion = (email) =>
  api.post("/auth/forgot-password/question", { email });
export const resetPasswordWithAnswer = (data) =>
  api.post("/auth/forgot-password/reset", data);
