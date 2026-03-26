package com.chat.app.exception;

import java.time.LocalDateTime;

public record ErrorDetails(String error, String message, LocalDateTime timeStamp) {
}
