import {logger} from "../../utils/logger";
import {MessageDTO, SendMessageRequestDTO} from "./MessageModel";
import {AppDispatch} from "../Store";
import {BASE_API_URL} from "../../config/Config";
import {AUTHORIZATION_PREFIX} from "../Constants";
import * as actionTypes from './MessageActionType';
import {UUID} from "node:crypto";

const MESSAGE_PATH = 'api/messages';

export const createMessage = (data: SendMessageRequestDTO, token: string) => async (dispatch: AppDispatch): Promise<MessageDTO | null> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify(data),
        });

        const resData: MessageDTO = await res.json();
        logger.log('Send message: ', resData);
        dispatch({type: actionTypes.CREATE_NEW_MESSAGE, payload: resData});
        return resData;
    } catch (error: any) {
        logger.error('Sending message failed', error);
        return null;
    }
};

export const getAllMessages = (chatId: UUID, token: string, page: number = 0, size: number = 50) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/chat/${chatId}?page=${page}&size=${size}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: MessageDTO[] = await res.json();
        logger.log('Getting messages (page', page, '):', resData);
        dispatch({type: actionTypes.GET_ALL_MESSAGES, payload: resData});
        dispatch({type: actionTypes.SET_HAS_MORE_MESSAGES, payload: resData.length >= size});
    } catch (error: any) {
        logger.error('Getting messages failed: ', error);
    }
};

// Подгрузка старых сообщений при скролле вверх
export const loadOlderMessages = (chatId: UUID, page: number, token: string, size: number = 50) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        dispatch({type: actionTypes.LOADING_OLDER_MESSAGES});
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/chat/${chatId}?page=${page}&size=${size}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: MessageDTO[] = await res.json();
        logger.log('Loading older messages (page', page, '):', resData);
        dispatch({type: actionTypes.LOAD_OLDER_MESSAGES, payload: resData});
        dispatch({type: actionTypes.SET_HAS_MORE_MESSAGES, payload: resData.length >= size});
    } catch (error: any) {
        logger.error('Loading older messages failed: ', error);
    }
};

// Редактирование сообщения
export const editMessage = (messageId: UUID, content: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/${messageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify({ content }),
        });

        const resData: MessageDTO = await res.json();
        logger.log('Edit message: ', resData);
        dispatch({type: actionTypes.EDIT_MESSAGE, payload: resData});
    } catch (error: any) {
        logger.error('Editing message failed', error);
    }
};

// Удаление "у меня"
export const deleteMessageForMe = (messageId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/${messageId}/delete-for-me`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        logger.log('Delete message for me: ', messageId);
        dispatch({type: actionTypes.DELETE_MESSAGE_FOR_ME, payload: messageId});
    } catch (error: any) {
        logger.error('Deleting message for me failed', error);
    }
};

// Удаление "у всех"
export const deleteMessageForAll = (messageId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/${messageId}/delete-for-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        const resData: MessageDTO = await res.json();
        logger.log('Delete message for all: ', resData);
        dispatch({type: actionTypes.DELETE_MESSAGE_FOR_ALL, payload: resData});
    } catch (error: any) {
        logger.error('Deleting message for all failed', error);
    }
};

// Пересылка сообщения
export const forwardMessage = (messageId: UUID, targetChatIds: UUID[], token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/forward`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify({ messageId, targetChatIds }),
        });

        const resData: MessageDTO[] = await res.json();
        logger.log('Forward message: ', resData);
        dispatch({type: actionTypes.FORWARD_MESSAGE, payload: resData});
    } catch (error: any) {
        logger.error('Forwarding message failed', error);
    }
};

// Загрузка файлов
export const uploadFiles = (chatId: UUID, files: FileList, content: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('chatId', chatId.toString());
        formData.append('content', content);

        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        const res: Response = await fetch(`${BASE_API_URL}/api/files/upload`, {
            method: 'POST',
            headers: {
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: formData,
        });

        const resData: MessageDTO = await res.json();
        logger.log('Upload files: ', resData);
        dispatch({type: actionTypes.UPLOAD_FILES, payload: resData});
    } catch (error: any) {
        logger.error('Uploading files failed', error);
    }
};

// Поиск сообщений в чате
export const searchMessages = (chatId: UUID, query: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/chat/${chatId}/search?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        const resData: MessageDTO[] = await res.json();
        logger.log('Search messages: ', resData);
        dispatch({type: actionTypes.SEARCH_MESSAGES, payload: resData});
    } catch (error: any) {
        logger.error('Searching messages failed', error);
    }
};

// Очистка результатов поиска
export const clearSearchResults = () => (dispatch: AppDispatch): void => {
    dispatch({type: actionTypes.CLEAR_SEARCH_RESULTS});
};

// Добавить реакцию на сообщение
export const addReaction = (messageId: UUID, emoji: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        const resData: MessageDTO = await res.json();
        logger.log('Add reaction: ', resData);
        dispatch({type: actionTypes.ADD_REACTION, payload: resData});
    } catch (error: any) {
        logger.error('Adding reaction failed', error);
    }
};

// Удалить реакцию с сообщения
export const removeReaction = (messageId: UUID, emoji: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        const resData: MessageDTO = await res.json();
        logger.log('Remove reaction: ', resData);
        dispatch({type: actionTypes.REMOVE_REACTION, payload: resData});
    } catch (error: any) {
        logger.error('Removing reaction failed', error);
    }
};