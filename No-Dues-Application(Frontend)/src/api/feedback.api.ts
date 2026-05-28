import api from './axios';
import { API } from './endpoints';

export interface FeedbackSubmission {
  mobile: string;
  program: string;
  futureEmail: string;
  futureAddress: string;
  academicContent: string;
  interactionFaculty: string;
  fairnessEvaluation: string;
  mentorshipHandholding: string;
  libraryFacilities: string;
  labResearchFacilities: string;
  itWifiFacilities: string;
  hostelFacilities: string;
  recreationalFacilities: string;
  extraCurricular: string;
  sportsFacilities: string;
  interactionAdministration: string;
  campusEnvironment: string;
  overallCampus: string;
  foodCourtCatering: string;
  healthCareFacilities: string;
  placementFacilities: string;
  governance: string;
  handlePandemic: string;
  counsellingServices: string;
  suggestions?: string;
}

export interface FeedbackRecord extends FeedbackSubmission {
  id: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  email: string;
  submittedAt: string;
}

export const feedbackApi = {
  get: () => api.get<FeedbackRecord | null>(API.FEEDBACK.BASE),
  checkStatus: () => api.get<{ submitted: boolean }>(API.FEEDBACK.STATUS),
  submit: (data: FeedbackSubmission) => api.post<FeedbackRecord>(API.FEEDBACK.BASE, data),
};
