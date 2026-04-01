import styles from './Homepage.module.scss';
import React, {useEffect, useState, useRef, useCallback} from "react";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "../redux/Store";
import {TOKEN, WS_URL, BASE_API_URL} from "../config/Config";
import EditGroupChat from "./editChat/EditGroupChat";
import Profile from "./profile/Profile";
import {Avatar, Divider, IconButton, InputAdornment, Menu, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Checkbox} from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ColorAvatar from "./common/ColorAvatar";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import {useTheme} from "../theme/ThemeContext";
import {currentUser, logoutUser} from "../redux/auth/AuthAction";
import SearchIcon from '@mui/icons-material/Search';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import {getUserChats, markChatAsRead, pinMessage, unpinMessage} from "../redux/chat/ChatAction";
import {ChatDTO} from "../redux/chat/ChatModel";
import ChatCard from "./chatCard/ChatCard";
import {getInitialsFromName} from "./utils/Utils";
import ClearIcon from '@mui/icons-material/Clear';
import WelcomePage from "./welcomePage/WelcomePage";
import MessagePage from "./messagePage/MessagePage";
import {MessageDTO, WebSocketMessageDTO, TypingEventDTO, DeliveryReceiptDTO} from "../redux/message/MessageModel";
import {createMessage, loadOlderMessages, editMessage, deleteMessageForMe, deleteMessageForAll, forwardMessage, uploadFiles, addReaction, removeReaction} from "../redux/message/MessageAction";
import {getChatName} from "./utils/Utils";
import SockJS from 'sockjs-client';
import {Client, over, Subscription} from "stompjs";
import {AUTHORIZATION_PREFIX} from "../redux/Constants";
import CreateGroupChat from "./editChat/CreateGroupChat";
import CreateSingleChat from "./editChat/CreateSingleChat";
import GlobalSearch from "./globalSearch/GlobalSearch";
import {getRemainingSessionMs, isSessionExpired} from "../utils/session";
import {
    requestNotificationPermission,
    showBrowserNotification,
    playNotificationSound,
    updatePageTitle,
    getNotificationSettings,
    saveNotificationSettings
} from "../utils/notifications";
import {logger} from "../utils/logger";
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import Switch from '@mui/material/Switch';

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
    const [isShowGlobalSearch, setIsShowGlobalSearch] = useState<boolean>(false);
    const [anchor, setAnchor] = useState(null);
    const [initials, setInitials] = useState<string>("");
    const [query, setQuery] = useState<string>("");
    const [focused, setFocused] = useState<boolean>(false);
    const [currentChat, setCurrentChat] = useState<ChatDTO | null>(null);
    const [messages, setMessages] = useState<MessageDTO[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isAppActive, setIsAppActive] = useState<boolean>(true);
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const [typingTimeouts, setTypingTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
    const [forwardDialogOpen, setForwardDialogOpen] = useState<boolean>(false);
    const [messageToForward, setMessageToForward] = useState<MessageDTO | null>(null);
    const [selectedChatsForForward, setSelectedChatsForForward] = useState<string[]>([]);
    const [notifDialogOpen, setNotifDialogOpen] = useState<boolean>(false);
    const [notifSettings, setNotifSettings] = useState(getNotificationSettings());
    // eslint-disable-next-line no-restricted-globals
    const isMenuOpen = Boolean(anchor);

    // === useRef для стабильных ссылок (не вызывают ре-рендер) ===
    const stompClientRef = useRef<Client | null>(null);
    const currentChatRef = useRef<ChatDTO | null>(null);
    const tokenRef = useRef<string | null>(token);
    const subscriptionRef = useRef<Subscription | null>(null);

    // Синхронизируем ref с state
    useEffect(() => { currentChatRef.current = currentChat; }, [currentChat]);
    useEffect(() => { tokenRef.current = token; }, [token]);

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
    }, [chatState.createdChat, chatState.createdGroup, dispatch, token, chatState.deletedChat, chatState.editedGroup, chatState.markedAsReadChat]);

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

    // Загружаем историю ТОЛЬКО при смене чата — напрямую в local state, минуя redux
    useEffect(() => {
        if (!currentChat?.id || !token) {
            setMessages([]);
            return;
        }
        const loadMessages = async () => {
            try {
                const res = await fetch(`${BASE_API_URL}/api/messages/chat/${currentChat.id}?page=0&size=50`, {
                    headers: { 'Content-Type': 'application/json', Authorization: `${AUTHORIZATION_PREFIX}${token}` }
                });
                const data: MessageDTO[] = await res.json();
                setMessages(data);
            } catch (e) {
                logger.error('Loading messages failed:', e);
            }
        };
        loadMessages();
    }, [currentChat?.id]);

    // === Обработчик входящих WS сообщений (стабильная ссылка через useCallback) ===
    const onMessageReceive = useCallback((payload: any) => {
        try {
            const data = JSON.parse(payload.body);
            logger.log('WebSocket message received:', data);

            const chat = currentChatRef.current;
            const tk = tokenRef.current;

            // === Typing событие ===
            if (data.isTyping !== undefined) {
                const typingEvent: TypingEventDTO = data;
                handleTypingEvent(typingEvent);
                return;
            }

            // === Read receipt — НЕ перезагружаем messages, только обновляем список чатов ===
            if (data.type === 'READ_RECEIPT') {
                if (tk) {
                    dispatch(getUserChats(tk));
                }
                return;
            }

            // === Чат удалён ===
            if (data.type === 'CHAT_DELETED') {
                if (chat?.id && data.chatId === chat.id.toString()) {
                    setCurrentChat(null);
                }
                if (tk) {
                    dispatch(getUserChats(tk));
                }
                return;
            }

            // === Delivery receipt — НЕ перезагружаем messages ===
            if (data.type === 'DELIVERY_RECEIPT') {
                return;
            }

            // === Обычное сообщение ===
            const wsMessage: WebSocketMessageDTO = data;
            const senderId = wsMessage.user?.id?.toString();
            const reqUserId = authState.reqUser?.id?.toString();
            const isOwnMessage = senderId === reqUserId;
            const msgChatId = wsMessage.chat?.id?.toString();
            const isChatOpen = chat && msgChatId === chat.id.toString();

            if (isChatOpen) {
                const message: MessageDTO = {
                    id: wsMessage.id,
                    content: wsMessage.content,
                    timeStamp: wsMessage.timeStamp,
                    user: wsMessage.user,
                    readBy: [],
                    deliveredTo: []
                };
                // Единственный источник правды — local state
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }

            // Обновляем список чатов в сайдбаре
            if (tk) {
                dispatch(getUserChats(tk));
            }

            // Уведомления — только для чужих сообщений не в открытом чате
            if (!isOwnMessage && !isChatOpen) {
                const settings = getNotificationSettings();
                if (settings.soundEnabled) {
                    playNotificationSound();
                }
                if (settings.browserNotificationsEnabled && data.user && data.content) {
                    const senderName = data.user.fullName || 'Новое сообщение';
                    const messagePreview = data.content.length > 50
                        ? data.content.substring(0, 50) + '...' : data.content;
                    showBrowserNotification(senderName, messagePreview);
                }
                updatePageTitle(1);
            }
        } catch (e) {
            logger.error('Error parsing WebSocket message:', e);
        }
    }, [authState.reqUser?.id, dispatch]);

    // === WebSocket подключение + подписка — ОДИН РАЗ ===
    useEffect(() => {
        if (!token || !authState.reqUser?.id) return;

        const headers = {
            Authorization: `${AUTHORIZATION_PREFIX}${token}`
        };

        const socket: WebSocket = new SockJS(WS_URL);
        const client: Client = over(socket);
        // Отключаем debug-логи stompjs
        client.debug = () => {};

        client.connect(headers, () => {
            logger.log("WebSocket connected successfully!");
            stompClientRef.current = client;
            setIsConnected(true);

            // Подписываемся на свой топик
            const sub = client.subscribe(
                "/topic/" + authState.reqUser!.id.toString(),
                onMessageReceive
            );
            subscriptionRef.current = sub;

            // Delivery receipt для всех чатов при подключении
            if (chatState.chats) {
                chatState.chats.forEach((chat: ChatDTO) => {
                    const deliveryReceipt: DeliveryReceiptDTO = {
                        chatId: chat.id.toString(),
                        userId: authState.reqUser!.id.toString(),
                        type: 'DELIVERY_RECEIPT'
                    };
                    client.send("/app/delivered", {}, JSON.stringify(deliveryReceipt));
                });
            }
        }, (error: any) => {
            logger.error("WebSocket connection error", error);
        });

        // Запрашиваем разрешение на уведомления
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
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect(() => {});
                stompClientRef.current = null;
            }
            setIsConnected(false);
        };
    }, [token, authState.reqUser?.id]);

    // Обновляем заголовок вкладки с суммарным числом непрочитанных
    useEffect(() => {
        if (isAppActive) return;
        const totalUnread = chatState.chats.reduce((sum, chat) => {
            const read = chat.messages.filter(msg =>
                msg.user.id === authState.reqUser?.id || msg.readBy.includes(authState.reqUser!.id)).length;
            return sum + (chat.messages.length - read);
        }, 0);
        updatePageTitle(totalUnread);
    }, [chatState.chats, isAppActive, authState.reqUser]);

    // При возвращении на вкладку — только обновляем список чатов в сайдбаре
    useEffect(() => {
        if (isAppActive && token) {
            dispatch(getUserChats(token));
        }
    }, [isAppActive]);

    const handleTypingEvent = (event: TypingEventDTO) => {
        if (event.userId === authState.reqUser?.id?.toString()) return;

        setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (event.isTyping) {
                newMap.set(event.chatId, event.userName);

                const oldTimeout = typingTimeouts.get(event.chatId);
                if (oldTimeout) clearTimeout(oldTimeout);

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
        const client = stompClientRef.current;
        if (client && client.connected && currentChat && authState.reqUser) {
            const typingEvent: TypingEventDTO = {
                chatId: currentChat.id.toString(),
                userId: authState.reqUser.id.toString(),
                userName: authState.reqUser.fullName || 'Пользователь',
                isTyping
            };
            client.send("/app/typing", {}, JSON.stringify(typingEvent));
        }
    };

    const sendReadReceipt = (chatId: string) => {
        const client = stompClientRef.current;
        if (client && client.connected && authState.reqUser) {
            const readReceipt = {
                chatId: chatId,
                readerId: authState.reqUser.id.toString(),
                type: 'READ_RECEIPT'
            };
            client.send("/app/read", {}, JSON.stringify(readReceipt));
        }
    };

    const sendDeliveryReceipt = (chatId: string) => {
        const client = stompClientRef.current;
        if (client && client.connected && authState.reqUser) {
            const deliveryReceipt: DeliveryReceiptDTO = {
                chatId: chatId,
                userId: authState.reqUser.id.toString(),
                type: 'DELIVERY_RECEIPT'
            };
            client.send("/app/delivered", {}, JSON.stringify(deliveryReceipt));
        }
    };

    const onLoadOlderMessages = () => {
        if (currentChat?.id && token && messageState.hasMoreMessages && !messageState.isLoadingOlder) {
            const nextPage = messageState.currentPage + 1;
            dispatch(loadOlderMessages(currentChat.id, nextPage, token));
        }
    };

    const onSendMessage = async (replyToId?: string) => {
        const client = stompClientRef.current;
        if (currentChat?.id && token && client && client.connected) {
            const msgContent = newMessage;
            setNewMessage("");
            const result: any = await dispatch(createMessage({
                chatId: currentChat.id,
                content: msgContent,
                replyToId: replyToId as any
            }, token));
            if (result) {
                const webSocketMessage: WebSocketMessageDTO = {...result, chat: currentChat};
                client.send("/app/messages", {}, JSON.stringify(webSocketMessage));
            }
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

    const handleNotifToggle = (key: 'soundEnabled' | 'browserNotificationsEnabled') => {
        const updated = { ...notifSettings, [key]: !notifSettings[key] };
        setNotifSettings(updated);
        saveNotificationSettings(updated);
        if (key === 'browserNotificationsEnabled' && updated.browserNotificationsEnabled) {
            requestNotificationPermission();
        }
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
                        {isShowGlobalSearch &&
                            <GlobalSearch
                                onClose={() => setIsShowGlobalSearch(false)}
                                onSelectChat={(chat) => { setCurrentChat(chat); }}
                            />}
                        {!isShowCreateSingleChat && !isShowEditGroupChat && !isShowCreateGroupChat && !isShowProfile && !isShowGlobalSearch &&
                            <div className={styles.sideBarInnerContainer}>
                                <div className={styles.navContainer}>
                                    <div onClick={onOpenProfile} className={styles.userInfoContainer}>
                                        <ChatBubbleIcon sx={{ fontSize: 24, color: '#00875A' }} />
                                        <span className={styles.navBrandText}>MyChat</span>
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
                                            <IconButton onClick={() => setIsShowGlobalSearch(true)} title="Глобальный поиск">
                                                <ManageSearchIcon/>
                                            </IconButton>
                                            <IconButton onClick={onCreateSingleChat}>
                                                <ChatIcon/>
                                            </IconButton>
                                            <IconButton onClick={onOpenMenu}>
                                                <MoreVertIcon/>
                                            </IconButton>
                                            <Menu
                                                id="basic-menu"
                                                anchorEl={anchor}
                                                open={isMenuOpen}
                                                onClose={onCloseMenu}
                                                MenuListProps={{'aria-labelledby': 'basic-button'}}>
                                                <MenuItem onClick={onOpenProfile}>Профиль</MenuItem>
                                                <MenuItem onClick={onCreateGroupChat}>Создать группу</MenuItem>
                                                <MenuItem onClick={() => { onCloseMenu(); setNotifDialogOpen(true); }}>
                                                    {notifSettings.soundEnabled && notifSettings.browserNotificationsEnabled
                                                        ? <NotificationsIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                                        : <NotificationsOffIcon sx={{ mr: 1, fontSize: '1.2rem' }} />}
                                                    Уведомления
                                                </MenuItem>
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

            {/* Диалог настроек уведомлений */}
            <Dialog open={notifDialogOpen} onClose={() => setNotifDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Настройки уведомлений</DialogTitle>
                <DialogContent>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14 }}>Звук уведомлений</span>
                            <Switch
                                checked={notifSettings.soundEnabled}
                                onChange={() => handleNotifToggle('soundEnabled')}
                                color="success"
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14 }}>Браузерные уведомления</span>
                            <Switch
                                checked={notifSettings.browserNotificationsEnabled}
                                onChange={() => handleNotifToggle('browserNotificationsEnabled')}
                                color="success"
                            />
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNotifDialogOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Homepage;
