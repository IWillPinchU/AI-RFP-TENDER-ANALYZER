package com.dce.rfp.service;

import com.dce.rfp.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendVerificationEmail(User user, String token) {
        String subject = "Verify Your Email Address";
        String verifyUrl = frontendUrl + "/verify-email?token=" + token;

        String body = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #333;'>Welcome, " + user.getFirstName() + "!</h2>"
                + "<p>Thank you for registering. Please verify your email address by clicking the button below:</p>"
                + "<a href='" + verifyUrl + "' style='display: inline-block; padding: 12px 24px; "
                + "background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; "
                + "margin: 16px 0;'>Verify Email</a>"
                + "<p style='color: #666;'>This link will expire in 24 hours.</p>"
                + "<p style='color: #999; font-size: 12px;'>If you didn't create an account, ignore this email.</p>"
                + "</div>";

        sendEmail(user.getEmail(), subject, body);
    }

    @Async
    public void sendPasswordResetEmail(User user, String token) {
        String subject = "Reset Your Password";
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        String body = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #333;'>Password Reset Request</h2>"
                + "<p>Hi " + user.getFirstName() + ", we received a request to reset your password.</p>"
                + "<a href='" + resetUrl + "' style='display: inline-block; padding: 12px 24px; "
                + "background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; "
                + "margin: 16px 0;'>Reset Password</a>"
                + "<p style='color: #666;'>This link will expire in 30 minutes.</p>"
                + "<p style='color: #999; font-size: 12px;'>If you didn't request this, ignore this email.</p>"
                + "</div>";

        sendEmail(user.getEmail(), subject, body);
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}
