package com.example.no_due_v10.service.payment;

import com.example.no_due_v10.entity.Payment;
import com.example.no_due_v10.entity.Student;
import com.example.no_due_v10.repository.PaymentRepository;
import com.example.no_due_v10.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PaymentGatewayService {

    @Autowired
    private PaymentGatewayFactory paymentGatewayFactory;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private com.example.no_due_v10.service.PaymentService paymentService;

    @Transactional
    public Payment initiatePayment(String studentId, Double amount, String gateway) throws Exception {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Payment payment = Payment.builder()
                .student(student)
                .amountPaid(amount)
                .paymentStatus("CREATED")
                .paymentTime(LocalDateTime.now())
                .paymentGateway(gateway)
                .build();

        payment = paymentRepository.save(payment);

        PaymentProcessor processor = paymentGatewayFactory.getPaymentProcessor(gateway);
        String gatewayOrderId = processor.createOrder(amount, payment.getId());

        payment.setTransactionId(gatewayOrderId);
        return paymentRepository.save(payment);
    }

    @Transactional
    public void syncPaymentStatus(Payment payment) {
        if ("SUCCESS".equals(payment.getPaymentStatus())) {
            return;
        }
        try {
            PaymentProcessor processor = paymentGatewayFactory.getPaymentProcessor(payment.getPaymentGateway());
            String status = processor.getStatus(payment.getTransactionId());
            if ("paid".equalsIgnoreCase(status)) {
                paymentService.processSuccessfulPayment(payment, payment.getTransactionId(), "razorpay");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
