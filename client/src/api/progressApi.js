import api from "./axiosInstance";

export const updateLessonProgress = (lessonId, data) =>
  api.patch(`/progress/lessons/${lessonId}`, data);
export const submitQuizAttempt = (quizId, data) =>
  api.post(`/progress/quizzes/${quizId}/attempt`, data);
export const getCourseProgress = (courseId) =>
  api.get(`/progress/courses/${courseId}`);
export const completeCourse = (courseId) =>
  api.patch(`/progress/courses/${courseId}/complete`);
