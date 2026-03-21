import api from "./axiosInstance";

// Admin
export const getCourses = (params) => api.get("/courses", { params });
export const getCourse = (id) => api.get(`/courses/${id}`);
export const createCourse = (data) => api.post("/courses", data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
export const publishCourse = (id) => api.patch(`/courses/${id}/publish`);
export const uploadCover = (id, file) => {
  const fd = new FormData();
  fd.append("cover", file);
  return api.post(`/courses/${id}/cover`, fd);
};
export const getShareLink = (id) => api.get(`/courses/${id}/share-link`);
export const addAttendees = (id, emails) =>
  api.post(`/courses/${id}/attendees`, { emails });
export const getAttendees = (id) => api.get(`/courses/${id}/attendees`);
export const contactAttendees = (id, data) =>
  api.post(`/courses/${id}/contact`, data);

// Public
export const getPublicCourses = (params) =>
  api.get("/public/courses", { params });
export const getPublicCourse = (id) => api.get(`/public/courses/${id}`);
export const enrollCourse = (id) => api.post(`/public/courses/${id}/enroll`);
export const incrementView = (id) => api.post(`/public/courses/${id}/view`);
export const getPublicStats = () => api.get("/public/stats");

// Reviews
export const getReviews = (courseId) => api.get(`/courses/${courseId}/reviews`);
export const addReview = (courseId, data) =>
  api.post(`/courses/${courseId}/reviews`, data);
export const updateReview = (courseId, id, data) =>
  api.put(`/courses/${courseId}/reviews/${id}`, data);

// Purchase
export const purchaseCourse = (courseId) =>
  api.post(`/courses/${courseId}/purchase`);
export const checkPurchase = (courseId) =>
  api.get(`/courses/${courseId}/purchase`);
