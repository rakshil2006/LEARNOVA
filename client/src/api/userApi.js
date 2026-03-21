import api from "./axiosInstance";

export const getUsers = () => api.get("/users");
export const getUser = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const getUserBadges = (id) => api.get(`/users/${id}/badges`);
