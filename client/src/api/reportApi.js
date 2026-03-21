import api from "./axiosInstance";

export const getReport = (params) => api.get("/reporting", { params });
