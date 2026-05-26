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
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDate;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity()
@Builder()
@Data()
@NoArgsConstructor()
@AllArgsConstructor()
@Getter()
@Setter()
@Table(name = "dues")
public class Due {

    @Id()
    @GeneratedValue()
    @UuidGenerator()
    private String id;

    private String description;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private Double paidAmount = 0.0;

    @Column(nullable = false)
    private String status;

    @CreationTimestamp()
    private LocalDate createdAt;

    @UpdateTimestamp()
    private LocalDate updatedAt;

    private LocalDate clearedAt;

    @ManyToOne()
    @JsonIgnoreProperties({"users", "dues"})
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne()
    @JsonIgnoreProperties({"dues", "payments"})
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne()
    @JsonIgnoreProperties({"dues", "department"})
    @JoinColumn(name = "user_id")
    private User user;
}
