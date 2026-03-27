import styles from './Homepage.module.scss';
import React, {useEffect, useState} from "react";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "../redux/Store";
import {TOKEN, WS_URL} from "../config/Config";
import EditGroupChat from "./editChat/EditGroupChat";
import Profile from "./profile/Profile";
import {Avatar, Divider, IconButton, InputAdornment, Menu, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Checkbox} from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import MBankLogo from "./common/MBankLogo";
import ColorAvatar from "./common/ColorAvatar";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import {useTheme} from "../theme/ThemeContext";
import {currentUser, logoutUser} from "../redux/auth/AuthAction";
import SearchIcon from '@mui/icons-material/Search';
import {getUserChats, markChatAsRead, pinMessage, unpinMessage} from "../redux/chat/ChatAction";
import {ChatDTO} from "../redux/chat/ChatModel";
import ChatCard from "./chatCard/ChatCard";
import {getInitialsFromName} from "./utils/Utils";
import ClearIcon from '@mui/icons-material/Clear';
import WelcomePage from "./welcomePage/WelcomePage";
import MessagePage from "./messagePage/MessagePage";
import {MessageDTO, WebSocketMessageDTO, TypingEventDTO, DeliveryReceiptDTO} from "../redux/message/MessageModel";
import {createMessage, getAllMessages, loadOlderMessages, editMessage, deleteMessageForMe, deleteMessageForAll, forwardMessage, uploadFiles, addReaction, removeReaction} from "../redux/message/MessageAction";
import * as messageActionTypes from "../redux/message/MessageActionType";
import {getChatName} from "./utils/Utils";
import SockJS from 'sockjs-client';
import {Client, over, Subscription} from "stompjs";
import {AUTHORIZATION_PREFIX} from "../redux/Constants";
import CreateGroupChat from "./editChat/CreateGroupChat";
import CreateSingleChat from "./editChat/CreateSingleChat";
import {getRemainingSessionMs, isSessionExpired} from "../utils/session";
import {
    requestNotificationPermission,
    showBrowserNotification,
    playNotificationSound,
    isTabFocused,
    updatePageTitle,
    getNotificationSettings
} from "../utils/notifications";
import {logger} from "../utils/logger";

const Homepage = () => {

    const { theme, toggleTheme } = useTheme();
    const authState = useSelector((state: RootState) => state.auth);
    const chatState = useSelector((state: RootState) => state.chat);
    const messageState = useSelector((state: RootState) => state.message);
    const navigate: NavigateFunction = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const token: string | null = localStorage.getItem(TOKEN);
    const [isShowEditGroupChat, setIsShowEditGroupChat] = useState<boolean>(false);
    const [isShowCreateGroupChat, setIsShowCreateGroupChat] = useState<boolean>(false);
    const [isShowCreateSingleChat, setIsShowCreateSingleChat] = useState<boolean>(false);
    const [isShowProfile, setIsShowProfile] = useState<boolean>(false);
    const [anchor, setAnchor] = useState(null);
    const [initials, setInitials] = useState<string>("");
    const [query, setQuery] = useState<string>("");
    const [focused, setFocused] = useState<boolean>(false);
    const [currentChat, setCurrentChat] = useState<ChatDTO | null>(null);
    const [messages, setMessages] = useState<MessageDTO[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [stompClient, setStompClient] = useState<Client | undefined>();
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isAppActive, setIsAppActive] = useState<boolean>(true);
    const [subscribeTry, setSubscribeTry] = useState<number>(1);
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // chatId -> userName
    const [typingTimeouts, setTypingTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
    const [forwardDialogOpen, setForwardDialogOpen] = useState<boolean>(false);
    const [messageToForward, setMessageToForward] = useState<MessageDTO | null>(null);
    const [selectedChatsForForward, setSelectedChatsForForward] = useState<string[]>([]);
    const [sendDeliveryOnConnect, setSendDeliveryOnConnect] = useState<boolean>(false);
    const open = Boolean(anchor);

    useEffect(() => {
        if (token && !authState.reqUser) {
            dispatch(currentUser(token));
        }
    }, [token, dispatch, authState.reqUser, navigate]);

    useEffect(() => {
        if (!token) {
            return;
        }
        if (isSessionExpired()) {
            dispatch(logoutUser());
            navigate("/signin");
            return;
        }
        const remainingMs = getRemainingSessionMs();
        const timeoutId = setTimeout(() => {
            dispatch(logoutUser());
            navigate("/signin");
        }, remainingMs);
        return () => clearTimeout(timeoutId);
    }, [token, dispatch, navigate]);

    useEffect(() => {
        if (!token || authState.reqUser === null) {
            navigate("/signin");
        }
    }, [token, navigate, authState.reqUser]);

    useEffect(() => {
        if (authState.reqUser && authState.reqUser.fullName) {
            const letters = getInitialsFromName(authState.reqUser.fullName);
            setInitials(letters);
        }
    }, [authState.reqUser?.fullName]);

    useEffect(() => {
        if (token) {
            dispatch(getUserChats(token));
        }
    }, [chatState.createdChat, chatState.createdGroup, dispatch, token, messageState.newMessage, chatState.deletedChat, chatState.editedGroup, chatState.markedAsReadChat]);

    useEffect(() => {
        setCurrentChat(chatState.editedGroup);
    }, [chatState.editedGroup]);

    // Обновляем текущий чат когда обновляется список чатов (для pinnedMessage и т.д.)
    useEffect(() => {
        if (currentChat && chatState.chats) {
            const updatedChat = chatState.chats.find(c => c.id === currentChat.id);
            if (updatedChat) {
                setCurrentChat(updatedChat);
            }
        }
    }, [chatState.chats]);

    useEffect(() => {
        if (currentChat?.id && token) {
            dispatch(getAllMessages(currentChat.id, token));
        }
    }, [currentChat, dispatch, token, messageState.newMessage]);

    useEffect(() => {
        setMessages(messageState.messages);
    }, [messageState.messages]);

    useEffect(() => {
        if (messageState.newMessage && stompClient && currentChat && isConnected) {
            const webSocketMessage: WebSocketMessageDTO = {...messageState.newMessage, chat: currentChat};
            stompClient.send("/app/messages", {}, JSON.stringify(webSocketMessage));
        }
    }, [messageState.newMessage]);

    useEffect(() => {
        logger.log("Attempting to subscribe to ws: ", subscribeTry);
        const reqUser = authState.reqUser;
        if (isConnected && stompClient && stompClient.connected && reqUser && reqUser.id) {
            const subscription: Subscription = stompClient.subscribe("/topic/" + reqUser.id.toString(), onMessageReceive);

            return () => subscription.unsubscribe();
        } else {
            const timeout = setTimeout(() => setSubscribeTry(subscribeTry + 1), 500);
            return () => clearTimeout(timeout);
        }
    }, [subscribeTry, isConnected, stompClient, authState.reqUser, currentChat?.id, token]);

    useEffect(() => {
        connect();
        // Запрашиваем разрешение на уведомления при загрузке
        requestNotificationPermission();

        const updateAppActivity = () => {
            const active = document.visibilityState === 'visible' && document.hasFocus();
            setIsAppActive(active);
            if (active) {
                updatePageTitle(0);
            }
        };
        updateAppActivity();

        document.addEventListener('visibilitychange', updateAppActivity);
        window.addEventListener('focus', updateAppActivity);
        window.addEventListener('blur', updateAppActivity);

        return () => {
            document.removeEventListener('visibilitychange', updateAppActivity);
            window.removeEventListener('focus', updateAppActivity);
            window.removeEventListener('blur', updateAppActivity);
        };
    }, []);

    useEffect(() => {
        if (isAppActive && currentChat?.id && token) {
            dispatch(markChatAsRead(currentChat.id, token));
            sendReadReceipt(currentChat.id.toString());
            dispatch(getAllMessages(currentChat.id, token));
            dispatch(getUserChats(token));
        }
    }, [isAppActive, currentChat?.id, token, isConnected, authState.reqUser?.id]);

    // При подключении к WebSocket — отправляем delivery receipt для всех чатов
    useEffect(() => {
        if (sendDeliveryOnConnect && isConnected && stompClient && chatState.chats) {
            chatState.chats.forEach((chat: ChatDTO) => {
                sendDeliveryReceipt(chat.id.toString());
            });
            setSendDeliveryOnConnect(false);
        }
    }, [sendDeliveryOnConnect, isConnected, stompClient, chatState.chats]);

    const connect = () => {
        const headers = {
            Authorization: `${AUTHORIZATION_PREFIX}${token}`
        };

        const socket: WebSocket = new SockJS(WS_URL);
        const client: Client = over(socket);
        client.connect(headers, onConnect, onError);
        setStompClient(client);
    };

    const onConnect = async () => {
        logger.log("WebSocket connected successfully!");
        setTimeout(() => {
            setIsConnected(true);
            // При подключении — отправляем delivery receipt для всех чатов
            // (сервер пометит все недоставленные сообщения как delivered)
            setSendDeliveryOnConnect(true);
        }, 1000);
    };

    const onError = (error: any) => {
        logger.error("WebSocket connection error", error);
    };

    const onMessageReceive = (payload: any) => {
        try {
            const data = JSON.parse(payload.body);
            logger.log('WebSocket message received:', data);

            // === Typing событие ===
            if (data.isTyping !== undefined) {
                const typingEvent: TypingEventDTO = data;
                handleTypingEvent(typingEvent);
                return;
            }

            // === Read receipt — обновляем галочки на синие ===
            if (data.type === 'READ_RECEIPT') {
                logger.log('Read receipt received:', data);
                if (currentChat?.id && token && data.chatId === currentChat.id.toString()) {
                    dispatch(getAllMessages(currentChat.id, token));
                    dispatch(getUserChats(token));
                }
                return;
            }

            // === Чат удалён ===
            if (data.type === 'CHAT_DELETED') {
                logger.log('Chat deleted event received:', data);
                if (currentChat?.id && data.chatId === currentChat.id.toString()) {
                    // Если удалённый чат открыт — сбрасываем на главную
                    setCurrentChat(null);
                }
                if (token) {
                    dispatch(getUserChats(token));
                }
                return;
            }

            // === Delivery receipt — обновляем галочки на 2 серые ===
            if (data.type === 'DELIVERY_RECEIPT') {
                logger.log('Delivery receipt received:', data);
                if (currentChat?.id && token && data.chatId === currentChat.id.toString()) {
                    dispatch(getAllMessages(currentChat.id, token));
                }
                return;
            }

            // === Обычное сообщение ===
            const wsMessage: WebSocketMessageDTO = data;
            const senderId = wsMessage.user?.id?.toString();
            const reqUserId = authState.reqUser?.id?.toString();
            const isOwnMessage = senderId === reqUserId;
            const msgChatId = wsMessage.chat?.id?.toString();

            // Определяем: открыт ли чат этого сообщения и активна ли вкладка
            const isChatOpen = currentChat && msgChatId === currentChat.id.toString();
            const isWindowActive = document.visibilityState === 'visible' && document.hasFocus();

            if (isChatOpen) {
                // Сообщение в текущем открытом чате
                const message: MessageDTO = {
                    id: wsMessage.id,
                    content: wsMessage.content,
                    timeStamp: wsMessage.timeStamp,
                    user: wsMessage.user,
                    readBy: [],
                    deliveredTo: []
                };
                dispatch({type: messageActionTypes.RECEIVE_MESSAGE, payload: message});

                if (!isOwnMessage && token) {
                    if (isWindowActive) {
                        // Сценарий А: чат открыт + окно активно → сразу READ (синие галочки)
                        dispatch(markChatAsRead(currentChat.id, token));
                        sendReadReceipt(currentChat.id.toString());
                    } else {
                        // Чат открыт, но окно не в фокусе → DELIVERED (2 серые)
                        sendDeliveryReceipt(msgChatId!);
                    }
                }
            } else {
                // Сообщение в другом чате → DELIVERED (2 серые галочки)
                if (!isOwnMessage && msgChatId) {
                    sendDeliveryReceipt(msgChatId);
                }
            }

            // Обновляем список чатов
            if (token) {
                dispatch(getUserChats(token));
            }

            // === Уведомления ===
            if (!isOwnMessage) {
                const settings = getNotificationSettings();
                const chatMuted = authState.reqUser?.mutedChatIds?.includes(msgChatId || '');

                // Звук и уведомление только если:
                // 1) Чат не открыт ИЛИ окно не в фокусе
                // 2) Чат не замьючен
                const shouldNotify = (!isChatOpen || !isWindowActive) && !chatMuted;

                if (shouldNotify) {
                    if (settings.soundEnabled) {
                        playNotificationSound();
                    }
                    if (settings.browserNotificationsEnabled && data.user && data.content) {
                        const senderName = data.user.fullName || 'Новое сообщение';
                        const messagePreview = data.content.length > 50
                            ? data.content.substring(0, 50) + '...'
                            : data.content;
                        showBrowserNotification(senderName, messagePreview);
                    }
                    updatePageTitle(1);
                }
            }
        } catch (e) {
            logger.error('Error parsing WebSocket message:', e);
        }
    };

    const handleTypingEvent = (event: TypingEventDTO) => {
        // Игнорируем свои события (сравниваем как строки)
        if (event.userId === authState.reqUser?.id?.toString()) return;

        setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (event.isTyping) {
                newMap.set(event.chatId, event.userName);

                // Очищаем старый таймаут если есть
                const oldTimeout = typingTimeouts.get(event.chatId);
                if (oldTimeout) clearTimeout(oldTimeout);

                // Устанавливаем таймаут на 3 секунды для автоочистки
                const timeout = setTimeout(() => {
                    setTypingUsers(p => {
                        const m = new Map(p);
                        m.delete(event.chatId);
                        return m;
                    });
                }, 3000);

                setTypingTimeouts(p => {
                    const m = new Map(p);
                    m.set(event.chatId, timeout);
                    return m;
                });
            } else {
                const oldTimeout = typingTimeouts.get(event.chatId);
                if (oldTimeout) clearTimeout(oldTimeout);
                setTypingTimeouts(p => {
                    const m = new Map(p);
                    m.delete(event.chatId);
                    return m;
                });
                newMap.delete(event.chatId);
            }
            return newMap;
        });
    };

    const sendTypingEvent = (isTyping: boolean) => {
        if (stompClient && currentChat && authState.reqUser && isConnected) {
            const typingEvent: TypingEventDTO = {
                chatId: currentChat.id.toString(),
                userId: authState.reqUser.id.toString(),
                userName: authState.reqUser.fullName || 'Пользователь',
                isTyping
            };
            logger.log('Sending typing event:', typingEvent);
            stompClient.send("/app/typing", {}, JSON.stringify(typingEvent));
        }
    };

    // Отправляем событие о прочтении сообщений (→ 2 синие галочки)
    const sendReadReceipt = (chatId: string) => {
        if (stompClient && authState.reqUser && isConnected) {
            const readReceipt = {
                chatId: chatId,
                readerId: authState.reqUser.id.toString(),
                type: 'READ_RECEIPT'
            };
            stompClient.send("/app/read", {}, JSON.stringify(readReceipt));
        }
    };

    // Отправляем событие о доставке (→ 2 серые галочки)
    const sendDeliveryReceipt = (chatId: string) => {
        if (stompClient && authState.reqUser && isConnected) {
            const deliveryReceipt: DeliveryReceiptDTO = {
                chatId: chatId,
                userId: authState.reqUser.id.toString(),
                type: 'DELIVERY_RECEIPT'
            };
            stompClient.send("/app/delivered", {}, JSON.stringify(deliveryReceipt));
        }
    };

    const onLoadOlderMessages = () => {
        if (currentChat?.id && token && messageState.hasMoreMessages && !messageState.isLoadingOlder) {
            const nextPage = messageState.currentPage + 1;
            dispatch(loadOlderMessages(currentChat.id, nextPage, token));
        }
    };

    const onSendMessage = (replyToId?: string) => {
        if (currentChat?.id && token) {
            dispatch(createMessage({
                chatId: currentChat.id,
                content: newMessage,
                replyToId: replyToId as any
            }, token));
            setNewMessage("");
        }
    };

    const onEditMessage = (messageId: string, newContent: string) => {
        if (token) {
            dispatch(editMessage(messageId as any, newContent, token));
        }
    };

    const onDeleteForMe = (messageId: string) => {
        if (token) {
            dispatch(deleteMessageForMe(messageId as any, token));
        }
    };

    const onDeleteForAll = (messageId: string) => {
        if (token) {
            dispatch(deleteMessageForAll(messageId as any, token));
        }
    };

    const onForward = (message: MessageDTO) => {
        setMessageToForward(message);
        setSelectedChatsForForward([]);
        setForwardDialogOpen(true);
    };

    const handleForwardToggleChat = (chatId: string) => {
        setSelectedChatsForForward(prev =>
            prev.includes(chatId)
                ? prev.filter(id => id !== chatId)
                : [...prev, chatId]
        );
    };

    const handleForwardConfirm = () => {
        if (token && messageToForward && selectedChatsForForward.length > 0) {
            dispatch(forwardMessage(
                messageToForward.id as any,
                selectedChatsForForward as any[],
                token
            ));
        }
        setForwardDialogOpen(false);
        setMessageToForward(null);
        setSelectedChatsForForward([]);
    };

    const onUploadFiles = (files: FileList) => {
        if (currentChat?.id && token) {
            dispatch(uploadFiles(currentChat.id, files, newMessage, token));
            setNewMessage("");
        }
    };

    const onPinMessage = (messageId: string) => {
        if (currentChat?.id && token) {
            dispatch(pinMessage(currentChat.id, messageId as any, token));
        }
    };

    const onUnpinMessage = () => {
        if (currentChat?.id && token) {
            dispatch(unpinMessage(currentChat.id, token));
        }
    };

    const onAddReaction = (messageId: string, emoji: string) => {
        if (token) {
            dispatch(addReaction(messageId as any, emoji, token));
        }
    };

    const onRemoveReaction = (messageId: string, emoji: string) => {
        if (token) {
            dispatch(removeReaction(messageId as any, emoji, token));
        }
    };

    const onOpenProfile = () => {
        onCloseMenu();
        setIsShowProfile(true);
    };

    const onCloseProfile = () => {
        setIsShowProfile(false);
    };

    const onOpenMenu = (e: any) => {
        setAnchor(e.currentTarget);
    };

    const onCloseMenu = () => {
        setAnchor(null);
    };

    const onCreateGroupChat = () => {
        onCloseMenu();
        setIsShowCreateGroupChat(true);
    };

    const onCreateSingleChat = () => {
        setIsShowCreateSingleChat(true);
    };

    const onLogout = () => {
        dispatch(logoutUser());
        navigate("/signin");
    };

    const onChangeQuery = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setQuery(e.target.value.toLowerCase());
    };

    const onClearQuery = () => {
        setQuery("");
    };

    const onClickChat = (chat: ChatDTO) => {
        if (token) {
            dispatch(markChatAsRead(chat.id, token));
            // Отправляем WebSocket событие о прочтении
            sendReadReceipt(chat.id.toString());
        }
        setCurrentChat(chat);
    };

    const getSearchEndAdornment = () => {
        return query.length > 0 &&
            <InputAdornment position='end'>
                <IconButton onClick={onClearQuery}>
                    <ClearIcon/>
                </IconButton>
            </InputAdornment>
    };

    return (
        <div>
            <div className={styles.outerContainer}>
                <div className={styles.innerContainer}>
                    <div className={styles.sideBarContainer}>
                        {isShowCreateSingleChat &&
                            <CreateSingleChat setIsShowCreateSingleChat={setIsShowCreateSingleChat}/>}
                        {isShowCreateGroupChat &&
                            <CreateGroupChat setIsShowCreateGroupChat={setIsShowCreateGroupChat}/>}
                        {isShowEditGroupChat &&
                            <EditGroupChat setIsShowEditGroupChat={setIsShowEditGroupChat} currentChat={currentChat}/>}
                        {isShowProfile &&
                            <div className={styles.profileContainer}>
                                <Profile onCloseProfile={onCloseProfile} initials={initials}/>
                            </div>}
                        {!isShowCreateSingleChat && !isShowEditGroupChat && !isShowCreateGroupChat && !isShowProfile &&
                            <div className={styles.sideBarInnerContainer}>
                                <div className={styles.navContainer}>
                                    <div onClick={onOpenProfile} className={styles.userInfoContainer}>
                                        <MBankLogo size={36} />
                                        <span className={styles.navBrandText}>MChat</span>
                                    </div>
                                    <div className={styles.navRightSection}>
                                        <IconButton onClick={toggleTheme} size="small" title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}>
                                            {theme === 'light' ? <DarkModeIcon fontSize="small"/> : <LightModeIcon fontSize="small"/>}
                                        </IconButton>
                                        <div onClick={onOpenProfile} className={styles.navUserInfo}>
                                            <ColorAvatar
                                                name={authState.reqUser?.fullName || ''}
                                                src={authState.reqUser?.profilePhoto ?? undefined}
                                                size={32}
                                                sx={{ cursor: 'pointer' }}
                                            />
                                        </div>
                                        <div>
                                            <IconButton onClick={onCreateSingleChat}>
                                                <ChatIcon/>
                                            </IconButton>
                                            <IconButton onClick={onOpenMenu}>
                                                <MoreVertIcon/>
                                            </IconButton>
                                            <Menu
                                                id="basic-menu"
                                                anchorEl={anchor}
                                                open={open}
                                                onClose={onCloseMenu}
                                                MenuListProps={{'aria-labelledby': 'basic-button'}}>
                                                <MenuItem onClick={onOpenProfile}>Профиль</MenuItem>
                                                <MenuItem onClick={onCreateGroupChat}>Создать группу</MenuItem>
                                                <MenuItem onClick={onLogout}>Выйти</MenuItem>
                                            </Menu>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.searchContainer}>
                                    <TextField
                                        id='search'
                                        type='text'
                                        placeholder='Поиск чатов...'
                                        size='small'
                                        fullWidth
                                        value={query}
                                        onChange={onChangeQuery}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    <SearchIcon sx={{ fontSize: '18px', color: '#9CA3AF' }}/>
                                                </InputAdornment>
                                            ),
                                            endAdornment: getSearchEndAdornment(),
                                        }}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}/>
                                </div>
                                <div className={styles.chatsContainer}>
                                    {query.length > 0 && chatState.chats?.filter(x =>
                                        x.isGroup ? x.chatName.toLowerCase().includes(query) :
                                            x.users[0].id === authState.reqUser?.id ? x.users[1].fullName.toLowerCase().includes(query) :
                                                x.users[0].fullName.toLowerCase().includes(query))
                                        .map((chat: ChatDTO) => (
                                            <div key={chat.id} onClick={() => onClickChat(chat)}>
                                                <ChatCard chat={chat}/>
                                            </div>
                                        ))}
                                    {query.length === 0 && chatState.chats
                                        ?.slice()
                                        .sort((a, b) => {
                                            const pinnedChatIds = authState.reqUser?.pinnedChatIds || [];
                                            const aIsPinned = pinnedChatIds.includes(a.id.toString());
                                            const bIsPinned = pinnedChatIds.includes(b.id.toString());
                                            if (aIsPinned && !bIsPinned) return -1;
                                            if (!aIsPinned && bIsPinned) return 1;
                                            return 0;
                                        })
                                        .map((chat: ChatDTO) => (
                                        <div key={chat.id} onClick={() => onClickChat(chat)}>
                                            <ChatCard chat={chat}/>
                                        </div>
                                    ))}
                                    {(!chatState.chats || chatState.chats.length === 0) && (
                                        <div style={{
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            height: '60%', padding: '40px 24px', textAlign: 'center',
                                        }}>
                                            <div style={{
                                                width: 68, height: 68, borderRadius: '50%',
                                                backgroundColor: '#E6F4EE', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                marginBottom: 18,
                                                boxShadow: '0 2px 10px rgba(0,135,90,0.12)',
                                            }}>
                                                <span style={{ fontSize: 30 }}>💬</span>
                                            </div>
                                            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#111827', letterSpacing: '-0.2px' }}>
                                                Нет чатов
                                            </p>
                                            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
                                                Нажмите на иконку чата чтобы начать новую беседу
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>}
                    </div>
                    <div className={styles.messagesContainer}>
                        {!currentChat && <WelcomePage reqUser={authState.reqUser}/>}
                        {currentChat && <MessagePage
                            chat={currentChat}
                            reqUser={authState.reqUser}
                            messages={messages}
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            onSendMessage={onSendMessage}
                            setIsShowEditGroupChat={setIsShowEditGroupChat}
                            setCurrentChat={setCurrentChat}
                            typingUserName={typingUsers.get(currentChat.id.toString()) || null}
                            onTyping={sendTypingEvent}
                            onEditMessage={onEditMessage}
                            onDeleteForMe={onDeleteForMe}
                            onDeleteForAll={onDeleteForAll}
                            onForward={onForward}
                            onUploadFiles={onUploadFiles}
                            onPinMessage={onPinMessage}
                            onUnpinMessage={onUnpinMessage}
                            onAddReaction={onAddReaction}
                            onRemoveReaction={onRemoveReaction}
                            hasMoreMessages={messageState.hasMoreMessages}
                            onLoadOlderMessages={onLoadOlderMessages}
                            isLoadingOlder={messageState.isLoadingOlder}/>}
                    </div>
                </div>
            </div>

            {/* Диалог выбора чатов для пересылки */}
            <Dialog open={forwardDialogOpen} onClose={() => setForwardDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Переслать сообщение</DialogTitle>
                <DialogContent>
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {chatState.chats?.map((chat: ChatDTO) => (
                            <ListItem key={chat.id} disablePadding>
                                <ListItemButton onClick={() => handleForwardToggleChat(chat.id.toString())}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: '#00875A' }}>
                                            {getInitialsFromName(getChatName(chat, authState.reqUser))}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={getChatName(chat, authState.reqUser)} />
                                    <Checkbox
                                        edge="end"
                                        checked={selectedChatsForForward.includes(chat.id.toString())}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setForwardDialogOpen(false)}>Отмена</Button>
                    <Button
                        onClick={handleForwardConfirm}
                        variant="contained"
                        disabled={selectedChatsForForward.length === 0}
                        sx={{ bgcolor: '#00875A', '&:hover': { bgcolor: '#006644' } }}
                    >
                        Переслать ({selectedChatsForForward.length})
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Homepage;
