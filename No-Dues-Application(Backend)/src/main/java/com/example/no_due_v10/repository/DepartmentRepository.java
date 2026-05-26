package com.example.no_due_v10.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
import org.springframework.stereotype.Repository;
import com.example.no_due_v10.entity.*;

@Repository()
public interface DepartmentRepository extends JpaRepository<Department, String> {
}
