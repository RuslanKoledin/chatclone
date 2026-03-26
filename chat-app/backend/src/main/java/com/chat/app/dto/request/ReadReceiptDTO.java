package com.chat.app.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReadReceiptDTO {
    private String chatId;
    private String readerId;
    private String type; // "READ_RECEIPT"
}
