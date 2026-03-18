import {Avatar, IconButton, InputAdornment, Menu, MenuItem, TextField} from "@mui/material";
import {getChatName, getInitialsFromName} from "../utils/Utils";
import React, {useEffect, useRef, useState} from "react";
import {ChatDTO} from "../../redux/chat/ChatModel";
import {UserDTO} from "../../redux/auth/AuthModel";
import styles from './MesaggePage.module.scss';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import {MessageDTO} from "../../redux/message/MessageModel";
import MessageCard from "../messageCard/MessageCard";
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from "@mui/icons-material/Clear";
import {AppDispatch} from "../../redux/Store";
import {useDispatch} from "react-redux";
import {deleteChat} from "../../redux/chat/ChatAction";
import {TOKEN} from "../../config/Config";
import EmojiPicker from "emoji-picker-react";
import MoodIcon from '@mui/icons-material/Mood';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PushPinIcon from '@mui/icons-material/PushPin';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {EmojiClickData} from "emoji-picker-react/dist/types/exposedTypes";
import TypingIndicator from "../typingIndicator/TypingIndicator";

interface MessagePageProps {
    chat: ChatDTO;
    reqUser: UserDTO | null;
    messages: MessageDTO[];
    newMessage: string;
    setNewMessage: (newMessage: string) => void;
    onSendMessage: (replyToId?: string) => void;
    setIsShowEditGroupChat: (isShowEditGroupChat: boolean) => void;
    setCurrentChat: (chat: ChatDTO | null) => void;
    typingUserName: string | null;
    onTyping: (isTyping: boolean) => void;
    onEditMessage: (messageId: string, newContent: string) => void;
    onDeleteForMe: (messageId: string) => void;
    onDeleteForAll: (messageId: string) => void;
    onForward: (message: MessageDTO) => void;
    onUploadFiles: (files: FileList) => void;
    onPinMessage: (messageId: string) => void;
    onUnpinMessage: () => void;
    onAddReaction: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, emoji: string) => void;
}

const MessagePage = (props: MessagePageProps) => {
    const TYPING_STOP_DELAY_MS = 3000;
    const TYPING_PING_INTERVAL_MS = 2000;

    const [messageQuery, setMessageQuery] = useState<string>("");
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [isSearch, setIsSearch] = useState<boolean>(false);
    const [anchor, setAnchor] = useState(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
    const [replyToMessage, setReplyToMessage] = useState<MessageDTO | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const lastMessageRef = useRef<null | HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef<boolean>(false);
    const lastTypingSignalAtRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dragCounterRef = useRef<number>(0);
    const dispatch: AppDispatch = useDispatch();
    const open = Boolean(anchor);
    const token: string | null = localStorage.getItem(TOKEN);

    useEffect(() => {
        scrollToBottom();
    }, [props]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTypingRef.current) {
                props.onTyping(false);
            }
        };
    }, []);

    const sendTypingStartIfNeeded = () => {
        const now = Date.now();
        const shouldSendStart = !isTypingRef.current ||
            (now - lastTypingSignalAtRef.current) >= TYPING_PING_INTERVAL_MS;

        if (shouldSendStart) {
            props.onTyping(true);
            lastTypingSignalAtRef.current = now;
        }
        isTypingRef.current = true;
    };

    const scheduleTypingStop = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            if (isTypingRef.current) {
                props.onTyping(false);
                isTypingRef.current = false;
            }
        }, TYPING_STOP_DELAY_MS);
    };

    const scrollToBottom = () => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({behavior: "smooth"});
        }
    };

    // Получаем собеседника для личного чата
    const getChatPartner = (): UserDTO | null => {
        if (props.chat.isGroup) return null;
        const users = props.chat.users || [];
        return users.find(u => u.id !== props.reqUser?.id) || null;
    };

    // Форматируем время последнего визита
    const formatLastSeen = (lastSeen: string | undefined): string => {
        if (!lastSeen) return '';
        const date = new Date(lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'только что';
        if (diffMin < 60) return `${diffMin} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;
        if (diffDays < 7) return `${diffDays} дн. назад`;

        return date.toLocaleDateString('ru-RU');
    };

    // Получаем статус для отображения
    const getStatusText = (): string | null => {
        const partner = getChatPartner();
        if (!partner) return null; // Групповой чат

        if (partner.isOnline) return 'онлайн';
        if (partner.lastSeen) return `был(а) ${formatLastSeen(partner.lastSeen)}`;
        return null;
    };

    const onOpenMenu = (e: any) => {
        setAnchor(e.currentTarget);
    };

    const onCloseMenu = () => {
        setAnchor(null);
    };

    const onEditGroupChat = () => {
        onCloseMenu();
        props.setIsShowEditGroupChat(true);
    };

    const onDeleteChat = () => {
        onCloseMenu();
        if (token) {
            dispatch(deleteChat(props.chat.id, token));
            props.setCurrentChat(null);
        }
    };

    const onChangeNewMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsEmojiPickerOpen(false);
        props.setNewMessage(e.target.value);
        sendTypingStartIfNeeded();
        scheduleTypingStop();
    };

    const onChangeMessageQuery = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessageQuery(e.target.value.toLowerCase());
    };

    const onChangeSearch = () => {
        setIsSearch(!isSearch);
    };

    const onClearQuery = () => {
        setMessageQuery("");
        setIsSearch(false);
    };

    const getSearchEndAdornment = () => {
        return <InputAdornment position='end'>
            <IconButton onClick={onClearQuery}>
                <ClearIcon/>
            </IconButton>
        </InputAdornment>
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            // Очищаем таймаут typing при отправке
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTypingRef.current) {
                props.onTyping(false);
                isTypingRef.current = false;
            }
            handleSendMessage();
            return;
        }

        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            sendTypingStartIfNeeded();
            scheduleTypingStop();
        }
    };

    const handleSendMessage = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (isTypingRef.current) {
            props.onTyping(false);
            isTypingRef.current = false;
        }

        if (selectedFiles && selectedFiles.length > 0) {
            props.onUploadFiles(selectedFiles);
            setSelectedFiles(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } else {
            props.onSendMessage(replyToMessage?.id?.toString());
        }
        setReplyToMessage(null);
    };

    const handleReply = (message: MessageDTO) => {
        setReplyToMessage(message);
    };

    const cancelReply = () => {
        setReplyToMessage(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(e.target.files);
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const cancelFileSelection = () => {
        setSelectedFiles(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Drag & Drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        dragCounterRef.current = 0;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handlePinMessage = (messageId: string) => {
        // Если это сообщение уже закреплено, открепляем
        if (props.chat.pinnedMessage?.id?.toString() === messageId) {
            props.onUnpinMessage();
        } else {
            props.onPinMessage(messageId);
        }
    };

    const onOpenEmojiPicker = () => {
        setIsEmojiPickerOpen(true);
    };

    const onCloseEmojiPicker = () => {
        setIsEmojiPickerOpen(false);
    };

    const onEmojiClick = (e: EmojiClickData) => {
        setIsEmojiPickerOpen(false);
        props.setNewMessage(props.newMessage + e.emoji);
        sendTypingStartIfNeeded();
        scheduleTypingStop();
    };

    let lastDay = -1;
    let lastMonth = -1;
    let lastYear = -1;

    const getMessageCard = (message: MessageDTO) => {
        const date: Date = new Date(message.timeStamp);
        const isNewDate = lastDay !== date.getDate() || lastMonth !== date.getMonth() || lastYear !== date.getFullYear();
        if (isNewDate) {
            lastDay = date.getDate();
            lastMonth = date.getMonth();
            lastYear = date.getFullYear();
        }
        const isPinned = props.chat.pinnedMessage?.id?.toString() === message.id?.toString();
        return <MessageCard
                    message={message}
                    reqUser={props.reqUser}
                    key={message.id}
                    isNewDate={isNewDate}
                    isGroup={props.chat.isGroup}
                    totalChatUsers={props.chat.users?.length || 2}
                    onEditMessage={props.onEditMessage}
                    onDeleteForMe={props.onDeleteForMe}
                    onDeleteForAll={props.onDeleteForAll}
                    onReply={handleReply}
                    onForward={props.onForward}
                    onPin={handlePinMessage}
                    isPinned={isPinned}
                    onAddReaction={props.onAddReaction}
                    onRemoveReaction={props.onRemoveReaction}
                    searchQuery={messageQuery}
                />
    };

    const getHeaderStatusText = (): string | null => {
        if (props.typingUserName) {
            return `${props.typingUserName} печатает...`;
        }
        return getStatusText();
    };

    return (
        <div
            className={styles.outerMessagePageContainer}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Drop zone overlay */}
            {isDragOver && (
                <div className={styles.dropZoneOverlay}>
                    <div className={styles.dropZoneContent}>
                        <CloudUploadIcon sx={{ fontSize: '4rem', color: '#00875A' }} />
                        <p className={styles.dropZoneText}>Перетащите файлы сюда</p>
                        <span className={styles.dropZoneSubtext}>Отпустите, чтобы прикрепить</span>
                    </div>
                </div>
            )}

            {/*Message Page Header*/}
            <div className={styles.messagePageHeaderContainer}>
                <div className={styles.messagePageInnerHeaderContainer}>
                    <div className={styles.messagePageHeaderNameContainer}>
                        <div className={styles.avatarWrapper}>
                            <Avatar sx={{
                                width: '2.5rem',
                                height: '2.5rem',
                                fontSize: '1rem',
                                mr: '0.75rem'
                            }}>
                                {getInitialsFromName(getChatName(props.chat, props.reqUser))}
                            </Avatar>
                            {getChatPartner()?.isOnline && (
                                <span className={styles.onlineIndicator}></span>
                            )}
                        </div>
                        <div className={styles.chatInfoContainer}>
                            <p className={styles.chatName}>{getChatName(props.chat, props.reqUser)}</p>
                            {getHeaderStatusText() && (
                                <span className={styles.statusText}>{getHeaderStatusText()}</span>
                            )}
                        </div>
                    </div>
                    <div className={styles.messagePageHeaderNameContainer}>
                        {!isSearch &&
                            <IconButton onClick={onChangeSearch}>
                                <SearchIcon/>
                            </IconButton>}
                        {isSearch &&
                            <TextField
                                id='searchMessages'
                                type='text'
                                label='Search for messages ...'
                                size='small'
                                fullWidth
                                value={messageQuery}
                                onChange={onChangeMessageQuery}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <SearchIcon/>
                                        </InputAdornment>
                                    ),
                                    endAdornment: getSearchEndAdornment(),
                                }}
                                InputLabelProps={{
                                    shrink: isFocused || messageQuery.length > 0,
                                    style: {marginLeft: isFocused || messageQuery.length > 0 ? 0 : 30}
                                }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}/>}
                        <IconButton onClick={onOpenMenu}>
                            <MoreVertIcon/>
                        </IconButton>
                        <Menu
                            id="basic-menu"
                            anchorEl={anchor}
                            open={open}
                            onClose={onCloseMenu}
                            MenuListProps={{'aria-labelledby': 'basic-button'}}>
                            {props.chat.isGroup && <MenuItem onClick={onEditGroupChat}>Edit Group Chat</MenuItem>}
                            <MenuItem onClick={onDeleteChat}>
                                {props.chat.isGroup ? 'Delete Group Chat' : 'Delete Chat'}
                            </MenuItem>
                        </Menu>
                    </div>
                </div>
            </div>

            {/* Закреплённое сообщение */}
            {props.chat.pinnedMessage && (
                <div className={styles.pinnedMessageContainer}>
                    <PushPinIcon sx={{ fontSize: '1rem', mr: 1, color: '#00875A' }} />
                    <div className={styles.pinnedMessageContent}>
                        <span className={styles.pinnedMessageLabel}>Закреплённое сообщение</span>
                        <span className={styles.pinnedMessageText}>
                            {props.chat.pinnedMessage.content.length > 60
                                ? props.chat.pinnedMessage.content.substring(0, 60) + '...'
                                : props.chat.pinnedMessage.content}
                        </span>
                    </div>
                    <IconButton size="small" onClick={props.onUnpinMessage}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </div>
            )}

            {/*Message Page Content*/}
            <div className={styles.messageContentContainer} onClick={onCloseEmojiPicker}>
                {messageQuery.length > 0 &&
                    props.messages.filter(x => x.content.toLowerCase().includes(messageQuery))
                        .map(message => getMessageCard(message))}
                {messageQuery.length === 0 &&
                    props.messages.map(message => getMessageCard(message))}
                {props.typingUserName && (
                    <TypingIndicator userName={props.typingUserName} />
                )}
                <div ref={lastMessageRef}></div>
            </div>

            {/*Message Page Footer*/}
            <div className={styles.footerContainer}>
                {/* Скрытый input для файлов */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    style={{ display: 'none' }}
                />

                {/* Панель ответа */}
                {replyToMessage && (
                    <div className={styles.replyPreviewContainer}>
                        <div className={styles.replyPreviewLine}></div>
                        <div className={styles.replyPreviewContent}>
                            <span className={styles.replyPreviewUserName}>
                                Ответ для {replyToMessage.user.fullName}
                            </span>
                            <span className={styles.replyPreviewText}>
                                {replyToMessage.content.length > 50
                                    ? replyToMessage.content.substring(0, 50) + '...'
                                    : replyToMessage.content}
                            </span>
                        </div>
                        <IconButton onClick={cancelReply} size="small">
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </div>
                )}

                {/* Панель предпросмотра выбранных файлов */}
                {selectedFiles && selectedFiles.length > 0 && (
                    <div className={styles.filesPreviewContainer}>
                        <div className={styles.filesPreviewContent}>
                            <AttachFileIcon sx={{ fontSize: '1rem', mr: 0.5, color: '#00875A' }} />
                            <span className={styles.filesPreviewText}>
                                {selectedFiles.length === 1
                                    ? selectedFiles[0].name
                                    : `${selectedFiles.length} файл(ов) выбрано`}
                            </span>
                        </div>
                        <IconButton onClick={cancelFileSelection} size="small">
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </div>
                )}

                <div className={styles.inputRowContainer}>
                    {isEmojiPickerOpen ?
                        <div className={styles.emojiOuterContainer}>
                            <div className={styles.emojiContainer}>
                                <EmojiPicker onEmojiClick={onEmojiClick} searchDisabled={true} skinTonesDisabled={true}/>
                            </div>
                        </div> :
                        <div className={styles.emojiButton}>
                            <IconButton onClick={onOpenEmojiPicker}>
                                <MoodIcon/>
                            </IconButton>
                        </div>}

                    {/* Кнопка прикрепления файлов */}
                    <div className={styles.attachButton}>
                        <IconButton onClick={handleAttachClick}>
                            <AttachFileIcon/>
                        </IconButton>
                    </div>

                    <div className={styles.innerFooterContainer}>
                        <TextField
                            id='newMessage'
                            type='text'
                            label={selectedFiles && selectedFiles.length > 0 ? 'Добавить подпись...' : 'Enter new message ...'}
                            size='small'
                            onKeyDown={onKeyDown}
                            fullWidth
                            value={props.newMessage}
                            onChange={onChangeNewMessage}
                            onBlur={() => {
                                if (typingTimeoutRef.current) {
                                    clearTimeout(typingTimeoutRef.current);
                                }
                                if (isTypingRef.current) {
                                    props.onTyping(false);
                                    isTypingRef.current = false;
                                }
                            }}
                            sx={{backgroundColor: 'white'}}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        <IconButton onClick={handleSendMessage}>
                                            <SendIcon/>
                                        </IconButton>
                                    </InputAdornment>),
                            }}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagePage;
