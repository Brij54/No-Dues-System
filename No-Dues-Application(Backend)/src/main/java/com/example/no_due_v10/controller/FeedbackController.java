package com.example.no_due_v10.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.no_due_v10.service.FeedbackService;
import com.example.no_due_v10.entity.Feedback;
import com.example.no_due_v10.dto.FeedbackRequest;
import java.security.Principal;
import java.util.Map;

@RestController()
@RequestMapping(value = "/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @GetMapping()
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getFeedback(Principal principal) {
        return feedbackService.getFeedbackForStudent(principal)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping(value = "/status")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String, Boolean>> checkStatus(Principal principal) {
        boolean submitted = feedbackService.hasSubmittedFeedback(principal);
        return ResponseEntity.ok(Map.of("submitted", submitted));
    }

    @PostMapping()
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackRequest request, Principal principal) {
        try {
            Feedback feedback = feedbackService.submitFeedback(request, principal);
            return ResponseEntity.ok(feedback);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }
}
