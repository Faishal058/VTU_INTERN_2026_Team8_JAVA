package com.wealthwise.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    private final JavaMailSender mailSender;
    private final AuthService authService;

    // In-memory store for reset tokens (in production, use a database table)
    private final Map<String, String> resetTokens = new ConcurrentHashMap<>();

    @Value("${spring.mail.username}")
    private String fromEmail;

    public PasswordResetService(JavaMailSender mailSender, AuthService authService) {
        this.mailSender = mailSender;
        this.authService = authService;
    }

    public void sendResetLink(String email) {
        String token = UUID.randomUUID().toString();
        resetTokens.put(token, email);

        String resetUrl = "http://localhost:5173/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("WealthWise — Password Reset");
        message.setText(
            "Hello,\n\n" +
            "You requested a password reset for your WealthWise account.\n\n" +
            "Click the link below to reset your password:\n" +
            resetUrl + "\n\n" +
            "This link expires in 1 hour.\n\n" +
            "If you didn't request this, you can safely ignore this email.\n\n" +
            "— WealthWise Team"
        );

        mailSender.send(message);
    }

    public String validateToken(String token) {
        return resetTokens.get(token);
    }

    public void invalidateToken(String token) {
        resetTokens.remove(token);
    }
}
