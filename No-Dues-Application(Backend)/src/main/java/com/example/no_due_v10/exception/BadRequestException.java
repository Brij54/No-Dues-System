package com.example.no_due_v10.exception;

/**
 * Thrown when the client sends invalid input, missing required fields,
 * or data that violates business rules (e.g. payment amount mismatch).
 *
 * Mapped to HTTP 400 BAD_REQUEST by GlobalExceptionHandler.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
