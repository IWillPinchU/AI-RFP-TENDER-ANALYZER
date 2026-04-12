package com.dce.rfp.exception;

public class TwoFactorAuthenticationException extends RuntimeException {
  public TwoFactorAuthenticationException(String message) {
    super(message);
  }
}
