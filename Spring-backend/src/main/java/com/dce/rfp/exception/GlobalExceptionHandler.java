package com.dce.rfp.exception;

import com.dce.rfp.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(UserAlreadyExistsException.class)
  public ResponseEntity<ApiResponse> handleUserAlreadyExists(UserAlreadyExistsException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(new ApiResponse(false, ex.getMessage()));
  }

  @ExceptionHandler(UserNotFoundException.class)
  public ResponseEntity<ApiResponse> handleUserNotFound(UserNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(new ApiResponse(false, ex.getMessage()));
  }

  @ExceptionHandler(TokenExpiredException.class)
  public ResponseEntity<ApiResponse> handleTokenExpired(TokenExpiredException ex) {
    return ResponseEntity.status(HttpStatus.GONE)
        .body(new ApiResponse(false, ex.getMessage()));
  }

  @ExceptionHandler(TokenInvalidException.class)
  public ResponseEntity<ApiResponse> handleTokenInvalid(TokenInvalidException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ApiResponse(false, ex.getMessage()));
  }

  @ExceptionHandler(TwoFactorAuthenticationException.class)
  public ResponseEntity<ApiResponse> handleTwoFactor(TwoFactorAuthenticationException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(new ApiResponse(false, ex.getMessage()));
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiResponse> handleBadCredentials(BadCredentialsException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(new ApiResponse(false, "Invalid email or password"));
  }

  @ExceptionHandler(DisabledException.class)
  public ResponseEntity<ApiResponse> handleDisabled(DisabledException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse(false, "Account not verified. Please check your email."));
  }

  // Handles @Valid validation errors
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getAllErrors().forEach(error -> {
      String field = ((FieldError) error).getField();
      String message = error.getDefaultMessage();
      errors.put(field, message);
    });
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
  }

  // AI service down or document not indexed
  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ApiResponse> handleIllegalState(IllegalStateException ex) {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(new ApiResponse(false, ex.getMessage()));
  }

  // Bad request (e.g. comparing doc with itself)
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiResponse> handleIllegalArgument(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ApiResponse(false, ex.getMessage()));
  }

  // Catch-all fallback
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse> handleGeneral(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ApiResponse(false, "An unexpected error occurred: " + ex.getMessage()));
  }
}
