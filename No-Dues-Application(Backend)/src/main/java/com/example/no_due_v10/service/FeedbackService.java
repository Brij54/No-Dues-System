package com.example.no_due_v10.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.no_due_v10.repository.FeedbackRepository;
import com.example.no_due_v10.repository.StudentRepository;
import com.example.no_due_v10.entity.Feedback;
import com.example.no_due_v10.entity.Student;
import com.example.no_due_v10.dto.FeedbackRequest;
import java.security.Principal;
import java.util.Optional;

@Service()
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private KeycloakAuthService keycloakAuthService;

    public Optional<Feedback> getFeedbackForStudent(Principal principal) {
        String studentId = keycloakAuthService.getUserId(principal);
        return feedbackRepository.findByStudentId(studentId);
    }

    public boolean hasSubmittedFeedback(Principal principal) {
        String studentId = keycloakAuthService.getUserId(principal);
        return feedbackRepository.existsByStudentId(studentId);
    }

    public Feedback submitFeedback(FeedbackRequest request, Principal principal) {
        String studentId = keycloakAuthService.getUserId(principal);
        
        if (feedbackRepository.existsByStudentId(studentId)) {
            throw new RuntimeException("Feedback already submitted");
        }

        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found for ID: " + studentId));

        validateFeedbackRequest(request);

        Feedback feedback = Feedback.builder()
            .studentId(student.getId())
            .rollNumber(student.getRollNumber())
            .studentName(student.getName())
            .email(student.getEmail())
            .mobile(request.getMobile())
            .program(request.getProgram())
            .futureEmail(request.getFutureEmail())
            .futureAddress(request.getFutureAddress())
            .academicContent(request.getAcademicContent())
            .interactionFaculty(request.getInteractionFaculty())
            .fairnessEvaluation(request.getFairnessEvaluation())
            .mentorshipHandholding(request.getMentorshipHandholding())
            .libraryFacilities(request.getLibraryFacilities())
            .labResearchFacilities(request.getLabResearchFacilities())
            .itWifiFacilities(request.getItWifiFacilities())
            .hostelFacilities(request.getHostelFacilities())
            .recreationalFacilities(request.getRecreationalFacilities())
            .extraCurricular(request.getExtraCurricular())
            .sportsFacilities(request.getSportsFacilities())
            .interactionAdministration(request.getInteractionAdministration())
            .campusEnvironment(request.getCampusEnvironment())
            .overallCampus(request.getOverallCampus())
            .foodCourtCatering(request.getFoodCourtCatering())
            .healthCareFacilities(request.getHealthCareFacilities())
            .placementFacilities(request.getPlacementFacilities())
            .governance(request.getGovernance())
            .handlePandemic(request.getHandlePandemic())
            .counsellingServices(request.getCounsellingServices())
            .suggestions(request.getSuggestions())
            .build();

        return feedbackRepository.save(feedback);
    }

    private void validateFeedbackRequest(FeedbackRequest request) {
        if (request.getMobile() == null || request.getMobile().trim().isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        if (!request.getMobile().matches("\\d{10}")) {
            throw new IllegalArgumentException("Mobile number must be exactly 10 digits");
        }
        if (request.getProgram() == null || request.getProgram().trim().isEmpty()) {
            throw new IllegalArgumentException("Program is required");
        }
        if (request.getFutureEmail() == null || request.getFutureEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Future communication email is required");
        }
        if (!request.getFutureEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            throw new IllegalArgumentException("Invalid future communication email format");
        }
        if (request.getFutureAddress() == null || request.getFutureAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Future communication address is required");
        }
        
        if (isEmpty(request.getAcademicContent()) ||
            isEmpty(request.getInteractionFaculty()) ||
            isEmpty(request.getFairnessEvaluation()) ||
            isEmpty(request.getMentorshipHandholding()) ||
            isEmpty(request.getLibraryFacilities()) ||
            isEmpty(request.getLabResearchFacilities()) ||
            isEmpty(request.getItWifiFacilities()) ||
            isEmpty(request.getHostelFacilities()) ||
            isEmpty(request.getRecreationalFacilities()) ||
            isEmpty(request.getExtraCurricular()) ||
            isEmpty(request.getSportsFacilities()) ||
            isEmpty(request.getInteractionAdministration()) ||
            isEmpty(request.getCampusEnvironment()) ||
            isEmpty(request.getOverallCampus()) ||
            isEmpty(request.getFoodCourtCatering()) ||
            isEmpty(request.getHealthCareFacilities()) ||
            isEmpty(request.getPlacementFacilities()) ||
            isEmpty(request.getGovernance()) ||
            isEmpty(request.getHandlePandemic()) ||
            isEmpty(request.getCounsellingServices())) {
            throw new IllegalArgumentException("All feedback ratings are required");
        }
    }

    private boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }
}
