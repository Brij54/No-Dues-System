package com.example.no_due_v10.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import com.example.no_due_v10.entity.*;

@Repository()
public interface PaymentRepository extends JpaRepository<Payment, String> {

    // repo_method_id: repo_find_payment_by_id | Fetch payment by its String primary key
    @Query(value = "SELECT p FROM Payment p WHERE p.id = :id", nativeQuery = false)
    Optional<Payment> findByIdWithStudent(String id);

    // repo_method_id: repo_find_payments_by_student_id | Retrieve all payments associated with a specific student
    List<Payment> findByStudentId(String studentId);

    // repo_method_id: repo_find_payment_by_transaction_id | Fetch payment by Razorpay transaction/order ID
    Optional<Payment> findByTransactionId(String transactionId);

    /**
     * summary_query_id: repo_total_paid_amount_by_student
     * Returns [studentId, totalPaidAmount] for all SUCCESS payments.
     * Used by SummaryService to compute the 'Paid Amount' column without N+1 queries.
     */
    @Query("SELECT p.student.id, COALESCE(SUM(p.amountPaid), 0.0) " +
           "FROM Payment p " +
           "WHERE UPPER(p.paymentStatus) = 'SUCCESS' " +
           "GROUP BY p.student.id")
    List<Object[]> findTotalPaidAmountByStudent();
}

