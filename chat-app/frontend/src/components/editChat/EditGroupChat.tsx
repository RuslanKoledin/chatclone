import React, {useEffect, useRef, useState} from "react";
import {AppDispatch, RootState} from "../../redux/Store";
import {useDispatch, useSelector} from "react-redux";
import {TOKEN} from "../../config/Config";
import {UserDTO} from "../../redux/auth/AuthModel";
import {searchUser} from "../../redux/auth/AuthAction";
import {IconButton, InputAdornment, TextField} from "@mui/material";
import WestIcon from "@mui/icons-material/West";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import styles from './EditGroupChat.module.scss';
import GroupMember from "./GroupMember";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import {ChatDTO} from "../../redux/chat/ChatModel";
import {addUserToGroupChat, removeUserFromGroupChat, updateGroupAvatar} from "../../redux/chat/ChatAction";
import ColorAvatar from "../common/ColorAvatar";

interface CreateGroupProps {
    setIsShowEditGroupChat: (showCreateGroup: boolean) => void;
    currentChat: ChatDTO | null;
}

const EditGroupChat = (props: CreateGroupProps) => {

    const authState = useSelector((state: RootState) => state.auth);
    const [userQuery, setUserQuery] = useState<string>("");
    const [focused, setFocused] = useState<boolean>(false);
    const dispatch: AppDispatch = useDispatch();
    const token = localStorage.getItem(TOKEN);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (token && userQuery.length > 0) {
            dispatch(searchUser(userQuery, token));
        }
    }, [userQuery, token]);

    const onRemoveMember = (user: UserDTO) => {
        if (token && props.currentChat) {
            dispatch(removeUserFromGroupChat(props.currentChat.id, user.id, token));
        }
    };

    const onAddMember = (user: UserDTO) => {
        if (token && props.currentChat) {
            dispatch(addUserToGroupChat(props.currentChat.id, user.id, token));
        }
    };

    const handleBack = () => {
        props.setIsShowEditGroupChat(false);
    };

    const handleAvatarClick = () => avatarInputRef.current?.click();

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !props.currentChat) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            dispatch(updateGroupAvatar(props.currentChat!.id, reader.result as string, token));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const onChangeQuery = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setUserQuery(e.target.value);
    };

    const onClearQuery = () => {
        setUserQuery("");
    }

    const getSearchEndAdornment = () => {
        return userQuery.length > 0 &&
            <InputAdornment position='end'>
                <IconButton onClick={onClearQuery}>
                    <ClearIcon/>
                </IconButton>
            </InputAdornment>
    };

    return (
        <div className={styles.outerEditGroupChatContainer}>
            <div className={styles.editGroupChatNavContainer}>
                <IconButton onClick={handleBack}>
                    <WestIcon fontSize='medium'/>
                </IconButton>
                <h2>Редактировать группу</h2>
            </div>

            {/* Аватар группы */}
            <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
                    <ColorAvatar
                        name={props.currentChat?.chatName ?? ''}
                        size={72}
                        src={props.currentChat?.groupAvatar ?? undefined}
                    />
                    <div className={styles.cameraOverlay}>
                        <CameraAltIcon sx={{ fontSize: '1.2rem', color: '#fff' }} />
                    </div>
                </div>
                <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                />
            </div>

            <div>
                <div className={styles.editGroupChatTextContainer}>
                    <p className={styles.editGroupChatText}>Участники</p>
                </div>
                <div className={styles.editGroupChatUserContainer}>
                    {props.currentChat?.users.map(user =>
                        <GroupMember member={user} onRemoveMember={onRemoveMember} key={user.id}/>)
                    }
                </div>
                <div className={styles.editGroupChatTextContainer}>
                    <p className={styles.editGroupChatText}>Добавить участника</p>
                </div>
                <div className={styles.editGroupChatTextField}>
                    <TextField
                        id='searchUser'
                        type='text'
                        label='Поиск пользователя...'
                        size='small'
                        fullWidth
                        value={userQuery}
                        onChange={onChangeQuery}
                        sx={{}}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SearchIcon/>
                                </InputAdornment>
                            ),
                            endAdornment: getSearchEndAdornment(),
                        }}
                        InputLabelProps={{
                            shrink: focused || userQuery.length > 0,
                            style: {marginLeft: focused || userQuery.length > 0 ? 0 : 30}
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}/>
                </div>
            </div>
            <div className={styles.editGroupChatUserContainer}>
                {userQuery.length > 0 && authState.searchUser?.filter(user => {
                    const existingUser = props.currentChat?.users.find(existingUser => existingUser.id === user.id);
                    return existingUser === undefined;
                })
                    .map(user => <GroupMember member={user} onAddMember={onAddMember} key={user.id}/>)}
            </div>
        </div>
    );
};

export default EditGroupChat;