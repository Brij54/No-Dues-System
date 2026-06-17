package com.example.no_due_v10.exception;

/**
 * Thrown when an operation conflicts with the current state of a resource
 * (e.g. feedback already submitted, department is inactive).
 *
 * Mapped to HTTP 409 CONFLICT by GlobalExceptionHandler.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
