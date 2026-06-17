package com.example.no_due_v10.exception;

/**
 * Thrown when a requested entity (Student, Due, Department, User, Payment)
 * cannot be found in the database.
 *
 * Mapped to HTTP 404 NOT_FOUND by GlobalExceptionHandler.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
