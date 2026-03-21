import api from "./axiosInstance";

export const getQuizzes = (courseId) => api.get(`/courses/${courseId}/quizzes`);
export const createQuiz = (courseId, data) =>
  api.post(`/courses/${courseId}/quizzes`, data);
export const getQuiz = (courseId, id) =>
  api.get(`/courses/${courseId}/quizzes/${id}`);
export const updateQuiz = (courseId, id, data) =>
  api.put(`/courses/${courseId}/quizzes/${id}`, data);
export const deleteQuiz = (courseId, id) =>
  api.delete(`/courses/${courseId}/quizzes/${id}`);
export const addQuestion = (courseId, quizId, data) =>
  api.post(`/courses/${courseId}/quizzes/${quizId}/questions`, data);
export const updateQuestion = (courseId, quizId, id, data) =>
  api.put(`/courses/${courseId}/quizzes/${quizId}/questions/${id}`, data);
export const deleteQuestion = (courseId, quizId, id) =>
  api.delete(`/courses/${courseId}/quizzes/${quizId}/questions/${id}`);
export const setRewards = (courseId, quizId, rewards) =>
  api.put(`/courses/${courseId}/quizzes/${quizId}/rewards`, { rewards });
