package com.example.no_due_v10.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {
    private String mobile;
    private String program;
    private String futureEmail;
    private String futureAddress;
    private String academicContent;
    private String interactionFaculty;
    private String fairnessEvaluation;
    private String mentorshipHandholding;
    private String libraryFacilities;
    private String labResearchFacilities;
    private String itWifiFacilities;
    private String hostelFacilities;
    private String recreationalFacilities;
    private String extraCurricular;
    private String sportsFacilities;
    private String interactionAdministration;
    private String campusEnvironment;
    private String overallCampus;
    private String foodCourtCatering;
    private String healthCareFacilities;
    private String placementFacilities;
    private String governance;
    private String handlePandemic;
    private String counsellingServices;
    private String suggestions;
}
