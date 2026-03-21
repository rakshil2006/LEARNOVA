import api from "./axiosInstance";

export const getRecommendations = () => api.get("/learner/recommendations");
