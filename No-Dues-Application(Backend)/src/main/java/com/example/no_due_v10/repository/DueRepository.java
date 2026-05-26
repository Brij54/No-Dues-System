package com.example.no_due_v10.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.no_due_v10.entity.*;

@Repository()
public interface DueRepository extends JpaRepository<Due, String> {

    // repo_method_id: repo_find_dues_by_student_id | Retrieves all Due records associated with a specific student by student ID.
    List<Due> findByStudentId(String studentId);

    // repo_method_id: repo_find_pending_dues_by_student_id | Finds all Due records for a given student with a specific status (e.g., PENDING).
    List<Due> findByStudentIdAndStatus(String studentId, String status);

    List<Due> findByDepartmentId(String departmentId);



    // repo_method_id: repo_sum_pending_amount_by_student_id | Sum the amount of all Due records for a student filtered by status (e.g., PENDING).
    @Query(value = "SELECT COALESCE(SUM(d.amount - d.paidAmount), 0.0) FROM Due d WHERE d.student.id = :studentId AND d.status = :status", nativeQuery = false)
    Double sumAmountByStudentIdAndStatus(@Param("studentId") String studentId, @Param("status") String status);

    // repo_method_id: repo_sum_all_pending_amount_by_student_id | Sum the amount of all non-cleared Due records for a student.
    // Excludes CLEARED and all NO_DUES variants using case-insensitive match so that "Dues-Pending", "PENDING",
    // "DUES_PENDING" etc. are all counted as pending.
    @Query("SELECT COALESCE(SUM(d.amount - d.paidAmount), 0.0) FROM Due d WHERE d.student.id = :studentId AND LOWER(d.status) NOT IN ('cleared', 'no-dues', 'no_dues', 'no dues')")
    Double sumAllPendingAmountByStudentId(@Param("studentId") String studentId);
}
