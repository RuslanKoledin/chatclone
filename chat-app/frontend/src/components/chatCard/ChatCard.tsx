import {Avatar, Badge, Menu, MenuItem} from "@mui/material";
import React, {useState} from "react";
import {getChatName, getInitialsFromName, transformDateToString} from "../utils/Utils";
import styles from './ChatCard.module.scss';
import {ChatDTO} from "../../redux/chat/ChatModel";
import {useSelector, useDispatch} from "react-redux";
import {RootState, AppDispatch} from "../../redux/Store";
import {MessageDTO} from "../../redux/message/MessageModel";
import PushPinIcon from '@mui/icons-material/PushPin';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import {pinChat, unpinChat, muteChat, unmuteChat} from "../../redux/auth/AuthAction";
import {TOKEN} from "../../config/Config";

interface ChatCardProps {
    chat: ChatDTO;
    isActive?: boolean;
}

const ChatCard = (props: ChatCardProps) => {

    const authState = useSelector((state: RootState) => state.auth);
    const dispatch: AppDispatch = useDispatch();
    const token = localStorage.getItem(TOKEN);
    const [contextMenu, setContextMenu] = useState<{mouseX: number; mouseY: number} | null>(null);

    const isPinned = authState.reqUser?.pinnedChatIds?.includes(props.chat.id.toString()) || false;
    const isMuted = authState.reqUser?.mutedChatIds?.includes(props.chat.id.toString()) || false;

    // Online status for 1-on-1 chats
    const getChatPartner = () => {
        if (props.chat.isGroup) return null;
        const users = props.chat.users || [];
        return users.find(u => u.id !== authState.reqUser?.id) || null;
    };
    const partner = getChatPartner();
    const isOnline = partner?.isOnline || false;

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu(
            contextMenu === null
                ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 }
                : null,
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleTogglePin = (event: React.MouseEvent) => {
        event.stopPropagation();
        handleCloseContextMenu();
        if (token) {
            if (isPinned) {
                dispatch(unpinChat(props.chat.id.toString(), token));
            } else {
                dispatch(pinChat(props.chat.id.toString(), token));
            }
        }
    };

    const handleToggleMute = (event: React.MouseEvent) => {
        event.stopPropagation();
        handleCloseContextMenu();
        if (token) {
            if (isMuted) {
                dispatch(unmuteChat(props.chat.id.toString(), token));
            } else {
                dispatch(muteChat(props.chat.id.toString(), token));
            }
        }
    };

    const name: string = getChatName(props.chat, authState.reqUser);
    const initials: string = getInitialsFromName(name);
    const sortedMessages: MessageDTO[] = props.chat.messages.sort((a, b) => +new Date(a.timeStamp) - +new Date(b.timeStamp));
    const lastMessage: MessageDTO | undefined = sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1] : undefined;
    const lastMessageContent: string = lastMessage ? lastMessage.content.length > 25 ? lastMessage.content.slice(0, 25) + "..." : lastMessage.content : "";
    const lastMessageName: string = lastMessage ? lastMessage.user.fullName === authState.reqUser?.fullName ? "Вы" : lastMessage.user.fullName : "";
    const lastMessageString: string = lastMessage ? lastMessageName + ": " + lastMessageContent : "";
    const lastDate: string = lastMessage ? transformDateToString(new Date(lastMessage.timeStamp)) : "";
    const numberOfReadMessages: number = props.chat.messages.filter(msg =>
        msg.user.id === authState.reqUser?.id || msg.readBy.includes(authState.reqUser!.id)).length;
    const numberOfUnreadMessages: number = props.chat.messages.length - numberOfReadMessages;

    return (
        <div
            className={`${styles.chatCardOuterContainer} ${props.isActive ? styles.chatCardOuterContainerActive : ''}`}
            onContextMenu={handleContextMenu}
        >
            <div className={styles.chatCardAvatarContainer}>
                <Avatar sx={{
                    width: '2.5rem',
                    height: '2.5rem',
                    fontSize: '1rem',
                    bgcolor: props.isActive ? '#10B981' : '#E5E7EB',
                    color: props.isActive ? '#FFFFFF' : '#374151',
                }}>
                    {initials}
                </Avatar>
                {isOnline && <span className={styles.onlineIndicator}></span>}
            </div>
            <div className={styles.chatCardContentContainer}>
                <div className={styles.chatCardContentInnerContainer}>
                    <div className={styles.chatNameRow}>
                        {isPinned && <PushPinIcon sx={{ fontSize: '0.85rem', color: '#10B981', mr: 0.3 }} />}
                        {isMuted && <VolumeOffIcon sx={{ fontSize: '0.85rem', color: '#9CA3AF', mr: 0.3 }} />}
                        <p className={styles.chatCardLargeTextContainer}>{name}</p>
                    </div>
                    <span className={styles.chatCardTimeContainer}>{lastDate}</span>
                </div>
                <div className={styles.chatCardContentInnerContainer}>
                    <p className={styles.chatCardSmallTextContainer}>{lastMessageString}</p>
                    {numberOfUnreadMessages > 0 && (
                        <span className={styles.unreadBadge}>{numberOfUnreadMessages}</span>
                    )}
                </div>
            </div>

            {/* Context menu */}
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
                <MenuItem onClick={handleTogglePin}>
                    <PushPinIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                    {isPinned ? 'Открепить' : 'Закрепить'}
                </MenuItem>
                <MenuItem onClick={handleToggleMute}>
                    {isMuted ? (
                        <>
                            <VolumeUpIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            Включить уведомления
                        </>
                    ) : (
                        <>
                            <VolumeOffIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            Отключить уведомления
                        </>
                    )}
                </MenuItem>
            </Menu>
        </div>
    );
};

export default ChatCard;
