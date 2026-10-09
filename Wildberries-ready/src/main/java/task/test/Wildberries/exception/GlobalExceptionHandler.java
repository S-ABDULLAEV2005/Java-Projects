package task.test.Wildberries.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerMapping;
import task.test.Wildberries.dto.ErrorResponse;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException exception,
            HttpServletRequest request) {

        log.warn(
                "Invalid argument: method={} route={}",
                request.getMethod(),
                routePattern(request)
        );

        return response(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request) {

        log.warn(
                "Resource not found: method={} route={}",
                request.getMethod(),
                routePattern(request)
        );

        return response(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler(DatabaseOperationException.class)
    public ResponseEntity<ErrorResponse> handleDatabaseOperation(
            DatabaseOperationException exception,
            HttpServletRequest request) {

        log.error(
                "Database operation failed: method={} route={}",
                request.getMethod(),
                routePattern(request),
                exception
        );

        // Keep your existing response status.
        return response(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler({
            DuplicateEmailException.class,
            DuplicateUsernameException.class
    })
    public ResponseEntity<ErrorResponse> handleDuplicate(
            RuntimeException exception,
            HttpServletRequest request) {

        log.warn(
                "Duplicate registration data: method={} route={} type={}",
                request.getMethod(),
                routePattern(request),
                exception.getClass().getSimpleName()
        );

        return response(
                HttpStatus.CONFLICT,
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            AuthenticationException exception,
            HttpServletRequest request) {

        log.warn(
                "Authentication rejected: method={} route={} type={}",
                request.getMethod(),
                routePattern(request),
                exception.getClass().getSimpleName()
        );

        return response(
                HttpStatus.UNAUTHORIZED,
                "Authentication failed",
                request
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException exception,
            HttpServletRequest request) {

        log.warn(
                "Access denied: method={} route={}",
                request.getMethod(),
                routePattern(request)
        );

        return response(
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action",
                request
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleLargeUpload(
            MaxUploadSizeExceededException exception,
            HttpServletRequest request) {

        log.warn(
                "Image upload rejected: method={} route={} reason=size_limit",
                request.getMethod(),
                routePattern(request)
        );

        return response(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Choose an image no larger than 3 MB",
                request
        );
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingUpload(
            MissingServletRequestPartException exception,
            HttpServletRequest request) {

        log.warn(
                "Multipart request rejected: method={} route={} reason=missing_part",
                request.getMethod(),
                routePattern(request)
        );

        String message =
                "file".equals(exception.getRequestPartName())
                        ? "Choose a file to upload"
                        : "A required request part is missing";

        return response(
                HttpStatus.BAD_REQUEST,
                message,
                request
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(
            ResponseStatusException exception,
            HttpServletRequest request) {

        int status = exception.getStatusCode().value();
        HttpStatus knownStatus = HttpStatus.resolve(status);

        String error = knownStatus == null
                ? "HTTP Error"
                : knownStatus.getReasonPhrase();

        String message = exception.getReason() == null
                ? error
                : exception.getReason();

        if (status >= 500) {
            log.error(
                    "Request failed: method={} route={} status={}",
                    request.getMethod(),
                    routePattern(request),
                    status,
                    exception
            );

            // Internal details remain in the logs.
            message = "The request could not be completed";
        } else {
            log.warn(
                    "Request rejected: method={} route={} status={}",
                    request.getMethod(),
                    routePattern(request),
                    status
            );
        }

        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                status,
                error,
                message,
                request.getRequestURI()
        );

        return ResponseEntity
                .status(exception.getStatusCode())
                .headers(exception.getHeaders())
                .body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(
            Exception exception,
            HttpServletRequest request) {

        log.error(
                "Unexpected application failure: method={} route={}",
                request.getMethod(),
                routePattern(request),
                exception
        );

        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again.",
                request
        );
    }

    private ResponseEntity<ErrorResponse> response(
            HttpStatus status,
            String message,
            HttpServletRequest request) {

        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI()
        );

        return ResponseEntity.status(status).body(body);
    }

    private String routePattern(HttpServletRequest request) {
        Object pattern = request.getAttribute(
                HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE
        );

        return pattern == null
                ? "<unmapped>"
                : pattern.toString();
    }
}