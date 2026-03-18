import {MessageDTO, ReactionDTO} from "../../redux/message/MessageModel";
import {UserDTO} from "../../redux/auth/AuthModel";
import styles from './MessageCard.module.scss';
import {Chip, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Popover} from "@mui/material";
import React, {useState} from "react";
import {getDateFormat} from "../utils/Utils";
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ReplyIcon from '@mui/icons-material/Reply';
import ForwardIcon from '@mui/icons-material/Forward';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PushPinIcon from '@mui/icons-material/PushPin';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import {BASE_API_URL} from "../../config/Config";

// Популярные эмодзи для быстрого выбора
const QUICK_REACTIONS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '👎'];

interface MessageCardProps {
    message: MessageDTO;
    reqUser: UserDTO | null;
    isNewDate: boolean;
    isGroup: boolean;
    totalChatUsers: number;
    onEditMessage?: (messageId: string, newContent: string) => void;
    onDeleteForMe?: (messageId: string) => void;
    onDeleteForAll?: (messageId: string) => void;
    onReply?: (message: MessageDTO) => void;
    onForward?: (message: MessageDTO) => void;
    onPin?: (messageId: string) => void;
    isPinned?: boolean;
    onAddReaction?: (messageId: string, emoji: string) => void;
    onRemoveReaction?: (messageId: string, emoji: string) => void;
    searchQuery?: string;
}

// Статусы сообщения:
// - sent: отправлено (одна серая галочка) ✓
// - delivered: доставлено всем (две серые галочки) ✓✓
// - read: прочитано всеми (две зелёные галочки) ✓✓

type MessageStatus = 'sent' | 'delivered' | 'read';

const MessageCard = (props: MessageCardProps) => {

    const [contextMenu, setContextMenu] = useState<{mouseX: number; mouseY: number} | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editContent, setEditContent] = useState(props.message.content);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [reactionPosition, setReactionPosition] = useState<{top: number; left: number} | null>(null);

    const isOwnMessage = props.message.user.id === props.reqUser?.id;
    const date: Date = new Date(props.message.timeStamp);
    const hours = date.getHours() > 9 ? date.getHours().toString() : "0" + date.getHours();
    const minutes = date.getMinutes() > 9 ? date.getMinutes().toString() : "0" + date.getMinutes();

    // Проверяем можно ли редактировать (в течение 24 часов)
    const canEdit = () => {
        if (!isOwnMessage || props.message.isDeleted) return false;
        const messageTime = new Date(props.message.timeStamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 24;
    };

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu(
            contextMenu === null
                ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 }
                : null,
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleEdit = () => {
        handleCloseContextMenu();
        setEditContent(props.message.content);
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (props.onEditMessage && editContent.trim()) {
            props.onEditMessage(props.message.id.toString(), editContent.trim());
        }
        setIsEditDialogOpen(false);
    };

    const handleDeleteForMe = () => {
        handleCloseContextMenu();
        if (props.onDeleteForMe) {
            props.onDeleteForMe(props.message.id.toString());
        }
    };

    const handleDeleteForAll = () => {
        handleCloseContextMenu();
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteForAll = () => {
        if (props.onDeleteForAll) {
            props.onDeleteForAll(props.message.id.toString());
        }
        setIsDeleteDialogOpen(false);
    };

    const handleReply = () => {
        handleCloseContextMenu();
        if (props.onReply) {
            props.onReply(props.message);
        }
    };

    const handleForward = () => {
        handleCloseContextMenu();
        if (props.onForward) {
            props.onForward(props.message);
        }
    };

    const handlePin = () => {
        handleCloseContextMenu();
        if (props.onPin) {
            props.onPin(props.message.id.toString());
        }
    };

    const handleOpenReactionPicker = () => {
        // Сохраняем координаты контекстного меню до его закрытия
        if (contextMenu) {
            setReactionPosition({ top: contextMenu.mouseY, left: contextMenu.mouseX });
        }
        handleCloseContextMenu();
    };

    const handleCloseReactionPicker = () => {
        setReactionPosition(null);
    };

    const handleAddReaction = (emoji: string) => {
        handleCloseReactionPicker();
        if (props.onAddReaction) {
            props.onAddReaction(props.message.id.toString(), emoji);
        }
    };

    const handleToggleReaction = (emoji: string) => {
        // Проверяем, есть ли уже такая реакция от текущего пользователя
        const userReaction = props.message.reactions?.find(
            r => r.emoji === emoji && r.userId === props.reqUser?.id
        );
        if (userReaction && props.onRemoveReaction) {
            props.onRemoveReaction(props.message.id.toString(), emoji);
        } else if (props.onAddReaction) {
            props.onAddReaction(props.message.id.toString(), emoji);
        }
    };

    // Группируем реакции по эмодзи
    const groupedReactions = React.useMemo(() => {
        const groups: { [emoji: string]: ReactionDTO[] } = {};
        props.message.reactions?.forEach(r => {
            if (!groups[r.emoji]) groups[r.emoji] = [];
            groups[r.emoji].push(r);
        });
        return groups;
    }, [props.message.reactions]);

    // Определяем статус сообщения
    // sent = отправлено (1 серая галочка)
    // delivered = доставлено (2 серые галочки) - пока не используем
    // read = прочитано (2 зелёные галочки)
    const getMessageStatus = (): MessageStatus => {
        const readBy = props.message.readBy || [];

        // ID отправителя сообщения (как строка для сравнения)
        const senderIdStr = props.message.user?.id?.toString();

        // Проверяем, есть ли в readBy кто-то кроме отправителя
        // (сравниваем как строки, т.к. UUID может приходить в разном формате)
        const othersRead = readBy.some(id => id?.toString() !== senderIdStr);

        if (othersRead) {
            return 'read';
        }

        return 'sent';
    };

    // Рендерим иконку статуса
    const renderStatusIcon = () => {
        if (!isOwnMessage) return null; // Показываем статус только для своих сообщений

        const status = getMessageStatus();
        const baseStyle = {
            fontSize: '14px',
            marginLeft: '4px',
            verticalAlign: 'middle',
        };

        switch (status) {
            case 'read':
                return <DoneAllIcon style={{ ...baseStyle, color: '#4CAF50' }} />;
            case 'delivered':
                return <DoneAllIcon style={{ ...baseStyle, color: 'rgba(255,255,255,0.8)' }} />;
            case 'sent':
            default:
                return <DoneIcon style={{ ...baseStyle, color: 'rgba(255,255,255,0.8)' }} />;
        }
    };

    // Функция для подсветки найденного текста
    const highlightText = (text: string, query: string | undefined): React.ReactNode => {
        if (!query || query.trim() === '' || !text) {
            return text;
        }

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? (
                <mark key={index} className={styles.highlightedText}>{part}</mark>
            ) : (
                part
            )
        );
    };

    const messageContent = props.message.isDeleted
        ? "Сообщение удалено"
        : props.message.content;

    const label: React.ReactElement = (
        <div className={styles.bubbleContainer}>
            {/* Пересланное сообщение */}
            {props.message.forwardedFromName && (
                <div className={styles.forwardedHeader}>
                    <ForwardIcon sx={{ fontSize: '0.85rem', mr: 0.5 }} />
                    <span>Переслано от {props.message.forwardedFromName}</span>
                </div>
            )}
            {/* Цитируемое сообщение */}
            {props.message.replyTo && (
                <div className={styles.replyContainer}>
                    <div className={styles.replyLine}></div>
                    <div className={styles.replyContent}>
                        <span className={styles.replyUserName}>{props.message.replyTo.userName}</span>
                        <span className={styles.replyText}>{props.message.replyTo.content}</span>
                    </div>
                </div>
            )}
            {props.isGroup && !isOwnMessage && <h4 className={styles.contentContainer}>{props.message.user.fullName}:</h4>}
            {/* Прикреплённые файлы */}
            {props.message.attachments && props.message.attachments.length > 0 && (
                <div className={styles.attachmentsContainer}>
                    {props.message.attachments.map(attachment => {
                        const isImage = attachment.contentType?.startsWith('image/');
                        const isAudio = attachment.contentType?.startsWith('audio/');
                        const fileUrl = `${BASE_API_URL}${attachment.url}`;

                        if (isImage) {
                            return (
                                <a key={attachment.id} href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={fileUrl}
                                        alt={attachment.fileName}
                                        className={styles.attachmentImage}
                                    />
                                </a>
                            );
                        } else if (isAudio) {
                            return (
                                <div key={attachment.id} className={styles.audioContainer}>
                                    <audio controls className={styles.audioPlayer}>
                                        <source src={fileUrl} type={attachment.contentType} />
                                        Ваш браузер не поддерживает аудио
                                    </audio>
                                </div>
                            );
                        } else {
                            return (
                                <a
                                    key={attachment.id}
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.attachmentFile}
                                >
                                    <AttachFileIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                                    <span>{attachment.fileName}</span>
                                    <span className={styles.fileSize}>
                                        ({(attachment.fileSize / 1024).toFixed(1)} KB)
                                    </span>
                                </a>
                            );
                        }
                    })}
                </div>
            )}
            <p className={`${styles.contentContainer} ${props.message.isDeleted ? styles.deletedMessage : ''}`}>
                {props.message.isDeleted ? messageContent : highlightText(messageContent, props.searchQuery)}
            </p>
            <div className={styles.timeStatusContainer}>
                {props.message.editedAt && !props.message.isDeleted && (
                    <span className={styles.editedLabel}>изм.</span>
                )}
                <span className={styles.timeText}>{hours + ":" + minutes}</span>
                {renderStatusIcon()}
            </div>
            {/* Реакции */}
            {Object.keys(groupedReactions).length > 0 && (
                <div className={styles.reactionsContainer}>
                    {Object.entries(groupedReactions).map(([emoji, reactions]) => {
                        const hasUserReaction = reactions.some(r => r.userId === props.reqUser?.id);
                        return (
                            <button
                                key={emoji}
                                className={`${styles.reactionBadge} ${hasUserReaction ? styles.reactionBadgeActive : ''}`}
                                onClick={() => handleToggleReaction(emoji)}
                                title={reactions.map(r => r.userName).join(', ')}
                            >
                                <span className={styles.reactionEmoji}>{emoji}</span>
                                <span className={styles.reactionCount}>{reactions.length}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const dateLabel: React.ReactElement = (
      <p>{getDateFormat(date)}</p>
    );

    return (
        <div className={styles.messageCardInnerContainer}>
            {props.isNewDate && <div className={styles.date}>{<Chip label={dateLabel}
                                                                    sx={{height: 'auto', width: 'auto', backgroundColor: 'rgba(0,135,90,0.1)', color: '#006644'}}/>}</div>}
            <div className={isOwnMessage ? styles.ownMessage : styles.othersMessage}>
                <div onContextMenu={handleContextMenu} style={{cursor: 'context-menu'}}>
                    <Chip label={label}
                          sx={{
                              height: 'auto',
                              width: 'auto',
                              backgroundColor: isOwnMessage ? '#00875A' : '#FFFFFF',
                              color: isOwnMessage ? '#FFFFFF' : '#18191C',
                              ml: '0.75rem',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              '& .MuiChip-label': {
                                  padding: 0,
                              }
                          }}/>
                </div>

                {/* Контекстное меню */}
                <Menu
                    open={contextMenu !== null}
                    onClose={handleCloseContextMenu}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        contextMenu !== null
                            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                            : undefined
                    }
                >
                    {!props.message.isDeleted && (
                        <MenuItem onClick={handleReply}>
                            <ReplyIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            Ответить
                        </MenuItem>
                    )}
                    {!props.message.isDeleted && (
                        <MenuItem onClick={handleForward}>
                            <ForwardIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            Переслать
                        </MenuItem>
                    )}
                    {!props.message.isDeleted && props.onPin && (
                        <MenuItem onClick={handlePin}>
                            <PushPinIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            {props.isPinned ? 'Открепить' : 'Закрепить'}
                        </MenuItem>
                    )}
                    {!props.message.isDeleted && props.onAddReaction && (
                        <MenuItem onClick={() => handleOpenReactionPicker()}>
                            <AddReactionIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            Реакция
                        </MenuItem>
                    )}
                    {canEdit() && (
                        <MenuItem onClick={handleEdit}>Редактировать</MenuItem>
                    )}
                    <MenuItem onClick={handleDeleteForMe}>Удалить у меня</MenuItem>
                    {isOwnMessage && !props.message.isDeleted && (
                        <MenuItem onClick={handleDeleteForAll}>Удалить у всех</MenuItem>
                    )}
                </Menu>

                {/* Диалог редактирования */}
                <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Редактировать сообщение</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            fullWidth
                            multiline
                            rows={3}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsEditDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleSaveEdit} variant="contained" color="primary">
                            Сохранить
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Диалог подтверждения удаления */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>Удалить сообщение?</DialogTitle>
                    <DialogContent>
                        Сообщение будет удалено у всех участников чата.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>Отмена</Button>
                        <Button onClick={confirmDeleteForAll} variant="contained" color="error">
                            Удалить
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Popover для выбора реакции */}
                <Popover
                    open={Boolean(reactionPosition)}
                    anchorReference="anchorPosition"
                    anchorPosition={reactionPosition ?? undefined}
                    onClose={handleCloseReactionPicker}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                >
                    <div className={styles.reactionPicker}>
                        {QUICK_REACTIONS.map(emoji => (
                            <button
                                key={emoji}
                                className={styles.reactionPickerButton}
                                onClick={() => handleAddReaction(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </Popover>
            </div>
        </div>
    );
};

export default MessageCard;