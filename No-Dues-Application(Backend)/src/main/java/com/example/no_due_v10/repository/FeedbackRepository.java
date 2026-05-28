package com.example.no_due_v10.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.no_due_v10.entity.Feedback;
import java.util.Optional;

@Repository()
public interface FeedbackRepository extends JpaRepository<Feedback, String> {
    Optional<Feedback> findByStudentId(String studentId);
    boolean existsByStudentId(String studentId);
}
