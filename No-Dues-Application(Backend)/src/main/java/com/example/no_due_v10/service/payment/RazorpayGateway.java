package com.example.no_due_v10.service.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service("razorpayGateway")
public class RazorpayGateway implements PaymentProcessor {

    @Value("${razorpay.key}")
    private String keyId;

    @Value("${razorpay.secret}")
    private String keySecret;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    private RazorpayClient getClient() throws Exception {
        return new RazorpayClient(keyId, keySecret);
    }

    @Override
    public String createOrder(Double amount, String internalOrderId) throws Exception {
        RazorpayClient razorpayClient = getClient();
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", (int) (amount * 100)); // amount in the smallest currency unit (paise)
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", internalOrderId);

        Order order = razorpayClient.orders.create(orderRequest);
        return order.get("id");
    }

    @Override
    public void processWebhook(String payload, String signature) throws Exception {
        boolean isValid = Utils.verifyWebhookSignature(payload, signature, webhookSecret);
        if (!isValid) {
            throw new Exception("Invalid signature");
        }
        // Verification success, controller logic will parse payload
    }

    @Override
    public String getStatus(String gatewayOrderId) throws Exception {
        RazorpayClient razorpayClient = getClient();
        Order order = razorpayClient.orders.fetch(gatewayOrderId);
        return order.get("status");
    }
}
