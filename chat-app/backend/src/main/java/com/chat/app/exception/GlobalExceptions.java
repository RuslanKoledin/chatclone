package com.chat.app.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.LocalDateTime;
import java.util.Objects;

@Slf4j
@RestControllerAdvice
public class GlobalExceptions {

    @ExceptionHandler(UserException.class)
    public ResponseEntity<ErrorDetails> userExceptionHandler(UserException e, WebRequest request) {
        ErrorDetails error = new ErrorDetails(e.getMessage(), "User error", LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MessageException.class)
    public ResponseEntity<ErrorDetails> messageExceptionHandler(MessageException e, WebRequest request) {
        ErrorDetails error = new ErrorDetails(e.getMessage(), "Message error", LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ChatException.class)
    public ResponseEntity<ErrorDetails> chatExceptionHandler(ChatException e, WebRequest request) {
        ErrorDetails error = new ErrorDetails(e.getMessage(), "Chat error", LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDetails> methodArgumentNotValidExceptionHandler(MethodArgumentNotValidException e, WebRequest request) {
        String err = Objects.requireNonNull(e.getBindingResult().getFieldError()).getDefaultMessage();
        ErrorDetails error = new ErrorDetails("Validation error", err, LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorDetails> noHandlerFoundExceptionHandler(NoHandlerFoundException e, WebRequest request) {
        ErrorDetails error = new ErrorDetails("Endpoint not found", "Not found", LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetails> exceptionHandler(Exception e, WebRequest request) {
        log.error("Unexpected error: {}", e.getMessage(), e);
        ErrorDetails error = new ErrorDetails("Internal server error", "An error occurred", LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
