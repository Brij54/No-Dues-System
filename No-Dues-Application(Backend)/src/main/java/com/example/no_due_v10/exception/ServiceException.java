package com.example.no_due_v10.exception;

/**
 * Thrown when an external service call fails (e.g. Keycloak API,
 * email delivery) or an unexpected internal error occurs.
 *
 * Mapped to HTTP 500 INTERNAL_SERVER_ERROR by GlobalExceptionHandler.
 */
public class ServiceException extends RuntimeException {

    public ServiceException(String message) {
        super(message);
    }

    public ServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
