import {MessageReducerState} from "./MessageModel";
import {Action} from "../CommonModel";
import * as actionTypes from './MessageActionType';

const initialState: MessageReducerState = {
    messages: [],
    newMessage: null,
    searchResults: [],
    isSearching: false,
    hasMoreMessages: true,
    currentPage: 0,
    isLoadingOlder: false,
};

const messageReducer = (state: MessageReducerState = initialState, action: Action): MessageReducerState => {
    switch (action.type) {
        case actionTypes.CREATE_NEW_MESSAGE:
            // Добавляем новое сообщение сразу в массив messages для мгновенного отображения
            return {
                ...state,
                newMessage: action.payload,
                messages: [...state.messages, action.payload]
            };
        case actionTypes.GET_ALL_MESSAGES:
            return {...state, messages: action.payload, currentPage: 0};
        case actionTypes.LOAD_OLDER_MESSAGES:
            // Добавляем старые сообщения В НАЧАЛО массива (они старше)
            return {
                ...state,
                messages: [...action.payload, ...state.messages],
                currentPage: state.currentPage + 1,
                isLoadingOlder: false,
            };
        case actionTypes.LOADING_OLDER_MESSAGES:
            return {...state, isLoadingOlder: true};
        case actionTypes.SET_HAS_MORE_MESSAGES:
            return {...state, hasMoreMessages: action.payload};
        case actionTypes.EDIT_MESSAGE:
            return {
                ...state,
                messages: state.messages.map(msg =>
                    msg.id === action.payload.id ? action.payload : msg
                )
            };
        case actionTypes.DELETE_MESSAGE_FOR_ME:
            return {
                ...state,
                messages: state.messages.filter(msg => msg.id !== action.payload)
            };
        case actionTypes.DELETE_MESSAGE_FOR_ALL:
            return {
                ...state,
                messages: state.messages.map(msg =>
                    msg.id === action.payload.id ? action.payload : msg
                )
            };
        case actionTypes.FORWARD_MESSAGE:
            return {...state, newMessage: action.payload[0] || null};
        case actionTypes.UPLOAD_FILES:
            return {...state, newMessage: action.payload};
        case actionTypes.SEARCH_MESSAGES:
            return {...state, searchResults: action.payload, isSearching: true};
        case actionTypes.CLEAR_SEARCH_RESULTS:
            return {...state, searchResults: [], isSearching: false};
        case actionTypes.ADD_REACTION:
        case actionTypes.REMOVE_REACTION:
            return {
                ...state,
                messages: state.messages.map(msg =>
                    msg.id === action.payload.id ? action.payload : msg
                )
            };
        case actionTypes.RECEIVE_MESSAGE:
            // Добавляем полученное через WebSocket сообщение, если его ещё нет
            const exists = state.messages.some(msg => msg.id === action.payload.id);
            if (exists) {
                return state;
            }
            return {
                ...state,
                messages: [...state.messages, action.payload]
            };
    }
    return state;
};

export default messageReducer;
