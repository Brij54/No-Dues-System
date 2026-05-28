package com.example.no_due_v10.entity;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity()
@Builder()
@Data()
@NoArgsConstructor()
@AllArgsConstructor()
@Getter()
@Setter()
@Table(name = "feedbacks")
public class Feedback {

    @Id()
    @GeneratedValue()
    @UuidGenerator()
    private String id;

    @Column(nullable = false, unique = true)
    private String studentId;

    @Column(nullable = false)
    private String rollNumber;

    @Column(nullable = false)
    private String studentName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String mobile;

    @Column(nullable = false)
    private String program;

    @Column(nullable = false)
    private String futureEmail;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String futureAddress;

    // Feedback Ratings (20 fields)
    @Column(nullable = false)
    private String academicContent;

    @Column(nullable = false)
    private String interactionFaculty;

    @Column(nullable = false)
    private String fairnessEvaluation;

    @Column(nullable = false)
    private String mentorshipHandholding;

    @Column(nullable = false)
    private String libraryFacilities;

    @Column(nullable = false)
    private String labResearchFacilities;

    @Column(nullable = false)
    private String itWifiFacilities;

    @Column(nullable = false)
    private String hostelFacilities;

    @Column(nullable = false)
    private String recreationalFacilities;

    @Column(nullable = false)
    private String extraCurricular;

    @Column(nullable = false)
    private String sportsFacilities;

    @Column(nullable = false)
    private String interactionAdministration;

    @Column(nullable = false)
    private String campusEnvironment;

    @Column(nullable = false)
    private String overallCampus;

    @Column(nullable = false)
    private String foodCourtCatering;

    @Column(nullable = false)
    private String healthCareFacilities;

    @Column(nullable = false)
    private String placementFacilities;

    @Column(nullable = false)
    private String governance;

    @Column(nullable = false)
    private String handlePandemic;

    @Column(nullable = false)
    private String counsellingServices;

    @Column(columnDefinition = "TEXT")
    private String suggestions;

    @CreationTimestamp()
    private LocalDateTime submittedAt;
}
