import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/Store';
import { ChatDTO } from '../../redux/chat/ChatModel';
import { InputAdornment, IconButton, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import WestIcon from '@mui/icons-material/West';
import ColorAvatar from '../common/ColorAvatar';
import { getChatName, getInitialsFromName } from '../utils/Utils';
import styles from './GlobalSearch.module.scss';

interface GlobalSearchProps {
    onClose: () => void;
    onSelectChat: (chat: ChatDTO) => void;
}

const GlobalSearch = ({ onClose, onSelectChat }: GlobalSearchProps) => {
    const [query, setQuery] = useState('');
    const authState = useSelector((state: RootState) => state.auth);
    const chatState = useSelector((state: RootState) => state.chat);

    const results = useMemo(() => {
        if (query.trim().length < 1) return [];
        const q = query.toLowerCase();

        const chatResults: { chat: ChatDTO; matchType: 'name' | 'message'; preview?: string }[] = [];
        const seen = new Set<string>();

        chatState.chats.forEach(chat => {
            const chatName = getChatName(chat, authState.reqUser).toLowerCase();

            // Совпадение по названию чата
            if (chatName.includes(q) && !seen.has(chat.id.toString())) {
                seen.add(chat.id.toString());
                chatResults.push({ chat, matchType: 'name' });
            }

            // Совпадение по содержимому сообщений
            chat.messages.forEach(msg => {
                if (msg.content?.toLowerCase().includes(q) && !seen.has(`${chat.id}-${msg.id}`)) {
                    seen.add(`${chat.id}-${msg.id}`);
                    chatResults.push({
                        chat,
                        matchType: 'message',
                        preview: msg.content.length > 60 ? msg.content.slice(0, 60) + '...' : msg.content,
                    });
                }
            });
        });

        return chatResults.slice(0, 30);
    }, [query, chatState.chats, authState.reqUser]);

    const highlight = (text: string) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.split(regex).map((part, i) =>
            regex.test(part) ? <mark key={i} className={styles.highlight}>{part}</mark> : part
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <IconButton onClick={onClose} size="small">
                    <WestIcon fontSize="medium" />
                </IconButton>
                <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    placeholder="Поиск по чатам и сообщениям..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: '1.1rem' }} />
                            </InputAdornment>
                        ),
                        endAdornment: query.length > 0 && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setQuery('')}>
                                    <CloseIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </div>

            <div className={styles.results}>
                {query.trim().length > 0 && results.length === 0 && (
                    <p className={styles.empty}>Ничего не найдено</p>
                )}
                {results.map((r, i) => {
                    const name = getChatName(r.chat, authState.reqUser);
                    return (
                        <div key={i} className={styles.resultItem} onClick={() => { onSelectChat(r.chat); onClose(); }}>
                            <ColorAvatar name={name} size={40} />
                            <div className={styles.resultText}>
                                <span className={styles.resultName}>{highlight(name)}</span>
                                {r.matchType === 'message' && r.preview && (
                                    <span className={styles.resultPreview}>{highlight(r.preview)}</span>
                                )}
                                {r.matchType === 'name' && (
                                    <span className={styles.resultTag}>Чат</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GlobalSearch;
