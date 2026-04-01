import {logger} from "../../utils/logger";
import {BASE_API_URL} from "../../config/Config";
import * as actionTypes from './ChatActionType';
import {UUID} from "node:crypto";
import {ChatDTO, GroupChatRequestDTO} from "./ChatModel";
import {AUTHORIZATION_PREFIX} from "../Constants";
import {AppDispatch} from "../Store";
import {ApiResponseDTO} from "../auth/AuthModel";

const CHAT_PATH = 'api/chats';

export const createChat = (userId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/single`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify(userId),
        });

        const resData: ChatDTO = await res.json();
        logger.log('Created single chat: ', resData);
        dispatch({type: actionTypes.CREATE_CHAT, payload: resData});
    } catch (error: any) {
        logger.error('Creating single chat failed: ', error);
    }
};

export const createGroupChat = (data: GroupChatRequestDTO, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/group`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify(data),
        });

        const resData: ChatDTO = await res.json();
        logger.log('Created group chat: ', resData);
        dispatch({type: actionTypes.CREATE_GROUP, payload: resData});
    } catch (error: any) {
        logger.error('Creating group chat failed: ', error);
    }
};

export const getUserChats = (token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO[] = await res.json();
        logger.log('Getting user chats: ', resData);
        dispatch({type: actionTypes.GET_ALL_CHATS, payload: resData});
    } catch (error: any) {
        logger.error('Getting user chats failed: ', error);
    }
};

export const deleteChat = (id: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ApiResponseDTO = await res.json();
        logger.log('Deleted chat: ', resData);
        dispatch({type: actionTypes.DELETE_CHAT, payload: resData});
    } catch (error: any) {
        logger.error('Deleting chat failed: ', error);
    }
};

export const addUserToGroupChat = (chatId: UUID, userId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/add/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO = await res.json();
        logger.log('Added user to group chat: ', resData);
        dispatch({type: actionTypes.ADD_MEMBER_TO_GROUP, payload: resData});
    } catch (error: any) {
        logger.error('Adding user to group chat failed: ', error);
    }
};

export const removeUserFromGroupChat = (chatId: UUID, userId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/remove/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO = await res.json();
        logger.log('Removed user from group chat: ', resData);
        dispatch({type: actionTypes.ADD_MEMBER_TO_GROUP, payload: resData});
    } catch (error: any) {
        logger.error('Removing user from group chat failed: ', error);
    }
};

export const markChatAsRead = (chatId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/markAsRead`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO = await res.json();
        logger.log('Marked chat as read: ', resData);
        dispatch({type: actionTypes.MARK_CHAT_AS_READ, payload: resData});
    } catch (error: any) {
        logger.error('Marking chat as read failed, ', error);
    }
};

// Закрепление сообщения в чате
export const pinMessage = (chatId: UUID, messageId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/pin/${messageId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO = await res.json();
        logger.log('Pinned message: ', resData);
        dispatch({type: actionTypes.PIN_MESSAGE, payload: resData});
    } catch (error: any) {
        logger.error('Pinning message failed: ', error);
    }
};

// Обновление аватара группы
export const updateGroupAvatar = (chatId: UUID, groupAvatar: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/avatar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify({ groupAvatar }),
        });

        const resData: ChatDTO = await res.json();
        dispatch({type: actionTypes.UPDATE_GROUP_AVATAR, payload: resData});
    } catch (error: any) {
        console.error('Updating group avatar failed: ', error);
    }
};

// Открепление сообщения в чате
export const unpinMessage = (chatId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/unpin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO = await res.json();
        logger.log('Unpinned message: ', resData);
        dispatch({type: actionTypes.UNPIN_MESSAGE, payload: resData});
    } catch (error: any) {
        logger.error('Unpinning message failed: ', error);
    }
};