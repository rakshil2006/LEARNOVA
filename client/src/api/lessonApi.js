import api from "./axiosInstance";

export const getLessons = (courseId) => api.get(`/courses/${courseId}/lessons`);
export const createLesson = (courseId, data) =>
  api.post(`/courses/${courseId}/lessons`, data);
export const updateLesson = (courseId, id, data) =>
  api.put(`/courses/${courseId}/lessons/${id}`, data);
export const deleteLesson = (courseId, id) =>
  api.delete(`/courses/${courseId}/lessons/${id}`);
export const uploadLessonFile = (courseId, id, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/courses/${courseId}/lessons/${id}/file`, fd);
};
export const addAttachment = (courseId, lessonId, data) => {
  if (data.file) {
    const fd = new FormData();
    fd.append("file", data.file);
    fd.append("type", "file");
    fd.append("label", data.label || "");
    return api.post(`/courses/${courseId}/lessons/${lessonId}/attachments`, fd);
  }
  return api.post(`/courses/${courseId}/lessons/${lessonId}/attachments`, {
    type: "link",
    label: data.label,
    url: data.url,
  });
};
export const deleteAttachment = (courseId, lessonId, attachmentId) =>
  api.delete(
    `/courses/${courseId}/lessons/${lessonId}/attachments/${attachmentId}`,
  );
export const reorderLessons = (courseId, lessonIds) =>
  api.patch(`/courses/${courseId}/lessons/reorder`, { lessonIds });
