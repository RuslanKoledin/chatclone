import React, {Dispatch, useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../redux/Store";
import {AuthReducerState, UpdateUserRequestDTO} from "../../redux/auth/AuthModel";
import {TOKEN} from "../../config/Config";
import {currentUser, updateUser} from "../../redux/auth/AuthAction";
import WestIcon from '@mui/icons-material/West';
import {Avatar, IconButton, TextField, Tooltip} from "@mui/material";
import CreateIcon from '@mui/icons-material/Create';
import CheckIcon from '@mui/icons-material/Check';
import styles from './Profile.module.scss';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const STATUS_OPTIONS = [
    { value: 'ONLINE', label: 'В сети', color: '#22c55e' },
    { value: 'AWAY', label: 'Нет на месте', color: '#f59e0b' },
    { value: 'DO_NOT_DISTURB', label: 'Не беспокоить', color: '#ef4444' },
];


interface ProfileProps {
    onCloseProfile: () => void;
    initials: string;
}

const Profile = (props: ProfileProps) => {

    const [isEditName, setIsEditName] = useState<boolean>(false);
    const [fullName, setFullName] = useState<string | null>(null);
    const dispatch: Dispatch<any> = useDispatch();
    const auth: AuthReducerState = useSelector((state: RootState) => state.auth);
    const token: string | null = localStorage.getItem(TOKEN);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (auth.reqUser) {
            setFullName(auth.reqUser.fullName);
        }
    }, [auth.reqUser]);

    useEffect(() => {
        if (token && auth.updateUser) {
            dispatch(currentUser(token));
        }
    }, [auth.updateUser, token, dispatch]);

    const onEditName = () => {
        setIsEditName(true);
    };

    const onUpdateUser = () => {
        if (fullName && token) {
            const data: UpdateUserRequestDTO = {
                fullName: fullName,
            };
            setFullName(fullName);
            dispatch(updateUser(data, token));
            setIsEditName(false);
        }
    };

    const onUpdateStatus = (status: string) => {
        if (token) {
            const data: UpdateUserRequestDTO = {
                fullName: auth.reqUser?.fullName ?? '',
                userStatus: status,
            };
            dispatch(updateUser(data, token));
        }
    };

    const onCancelUpdate = () => {
        if (auth.reqUser) {
            setFullName(auth.reqUser?.fullName);
        }
        setIsEditName(false);
    };

    const onChangeFullName = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setFullName(e.target.value);
    };

    const onPhotoClick = () => {
        fileInputRef.current?.click();
    };

    const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const data: UpdateUserRequestDTO = {
                fullName: auth.reqUser?.fullName ?? '',
                profilePhoto: base64,
            };
            dispatch(updateUser(data, token));
        };
        reader.readAsDataURL(file);
        // reset so same file can be re-selected
        e.target.value = '';
    };

    return (
        <div className={styles.outerContainer}>
            <div className={styles.headingContainer}>
                <IconButton onClick={props.onCloseProfile}>
                    <WestIcon fontSize='medium'/>
                </IconButton>
                <h2>Профиль</h2>
            </div>
            <div className={styles.avatarContainer}>
                <div className={styles.avatarWrapper} onClick={onPhotoClick}>
                    <Avatar
                        src={auth.reqUser?.profilePhoto ?? undefined}
                        sx={{width: '12vw', height: '12vw', fontSize: '5vw'}}
                    >
                        {!auth.reqUser?.profilePhoto && props.initials}
                    </Avatar>
                    <div className={styles.cameraOverlay}>
                        <CameraAltIcon sx={{fontSize: '1.4vw', color: '#fff'}}/>
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{display: 'none'}}
                    onChange={onPhotoChange}
                />
            </div>
            <div className={styles.nameContainer}>
                {!isEditName &&
                    <div className={styles.innerNameStaticContainer}>
                        <p className={styles.nameDistance}>{auth.reqUser?.fullName}</p>
                        <IconButton sx={{mr: '0.75rem'}} onClick={onEditName}>
                            <CreateIcon/>
                        </IconButton>
                    </div>}
                {isEditName &&
                    <div className={styles.innerNameDynamicContainer}>
                        <TextField
                            id="fullName"
                            type="text"
                            label="Введите имя"
                            variant="outlined"
                            onChange={onChangeFullName}
                            value={fullName}
                            sx={{ml: '0.75rem', width: '70%'}}/>
                        <div>
                            <IconButton onClick={onCancelUpdate}>
                                <CloseIcon/>
                            </IconButton>
                            <IconButton sx={{mr: '0.75rem'}} onClick={onUpdateUser}>
                                <CheckIcon/>
                            </IconButton>
                        </div>
                    </div>}
            </div>
            <div className={styles.infoContainer}>
                <p className={styles.infoText}>Это имя будет отображаться в ваших сообщениях</p>
            </div>
            <div className={styles.statusContainer}>
                <p className={styles.statusLabel}>Статус</p>
                <div className={styles.statusOptions}>
                    {STATUS_OPTIONS.map(opt => {
                        const isActive = (auth.reqUser?.userStatus ?? 'ONLINE') === opt.value;
                        return (
                            <Tooltip key={opt.value} title={opt.label} placement="top">
                                <button
                                    className={`${styles.statusBtn} ${isActive ? styles.statusBtnActive : ''}`}
                                    style={{ borderColor: opt.color, backgroundColor: isActive ? opt.color : undefined }}
                                    onClick={() => onUpdateStatus(opt.value)}
                                >
                                    <span className={styles.statusDot} style={{ backgroundColor: opt.color }} />
                                    {opt.label}
                                </button>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Profile;