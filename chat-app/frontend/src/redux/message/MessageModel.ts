import {UUID} from "node:crypto";
import {UserDTO} from "../auth/AuthModel";
import {ChatDTO} from "../chat/ChatModel";

export interface ReplyInfoDTO {
    id: UUID;
    content: string;
    userName: string;
}

export interface AttachmentDTO {
    id: UUID;
    fileName: string;
    contentType: string;
    fileSize: number;
    url: string;
}

export interface ReactionDTO {
    id: UUID;
    emoji: string;
    userId: UUID;
    userName: string;
}

export interface MessageDTO {
    id: UUID;
    content: string;
    timeStamp: string;
    user: UserDTO;
    readBy: UUID[];
    deliveredTo?: UUID[];
    editedAt?: string;
    isDeleted?: boolean;
    replyTo?: ReplyInfoDTO;
    forwardedFromName?: string;
    attachments?: AttachmentDTO[];
    reactions?: ReactionDTO[];
}

export interface WebSocketMessageDTO {
    id: UUID;
    content: string;
    timeStamp: string;
    user: UserDTO;
    chat: ChatDTO;
}

export interface SendMessageRequestDTO {
    chatId: UUID;
    content: string;
    replyToId?: UUID;
}

export type MessageReducerState = {
    messages: MessageDTO[];
    newMessage: MessageDTO | null;
    searchResults: MessageDTO[];
    isSearching: boolean;
    hasMoreMessages: boolean;
    currentPage: number;
    isLoadingOlder: boolean;
}

// Typing indicator event model
export interface TypingEventDTO {
    chatId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
}

// Delivery receipt event model
export interface DeliveryReceiptDTO {
    chatId: string;
    userId: string;
    type: string; // "DELIVERY_RECEIPT"
}