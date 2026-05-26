package com.example.no_due_v10.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import com.example.no_due_v10.entity.*;

@Repository()
public interface StudentRepository extends JpaRepository<Student, String> {

    // repo_method_id: repo_find_student_by_id | Fetch student by their String primary key
    @Query(value = "SELECT s FROM Student s WHERE s.id = :id", nativeQuery = false)
    Optional<Student> findStudentById(String id);
}
