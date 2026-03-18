import styles from './Register.module.scss'
import MBankLogo from "../common/MBankLogo";
import {useNavigate} from "react-router-dom";
import React, {Dispatch, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {TOKEN} from "../../config/Config";
import {RootState} from "../../redux/Store";
import {SignUpRequestDTO} from "../../redux/auth/AuthModel";
import {currentUser, register, clearAuthError} from "../../redux/auth/AuthAction";
import {Button, TextField, InputAdornment, IconButton, CircularProgress} from "@mui/material";
import {Visibility, VisibilityOff, Person, Lock, Badge} from "@mui/icons-material";

const SignUp = () => {
    const [createAccountData, setCreateAccountData] = useState<SignUpRequestDTO>({
        fullName: "",
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const navigate = useNavigate();
    const dispatch: Dispatch<any> = useDispatch();
    const token: string | null = localStorage.getItem(TOKEN);
    const {reqUser, loading, error} = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (token && !reqUser) {
            dispatch(currentUser(token));
        }
    }, [token, reqUser, dispatch]);

    useEffect(() => {
        if (reqUser) {
            navigate("/");
        }
    }, [reqUser, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const onSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);

        const trimmedFullName = createAccountData.fullName.trim();
        const trimmedEmail = createAccountData.email.trim();

        if (!trimmedFullName || !trimmedEmail || !createAccountData.password) {
            setLocalError("Заполните все поля");
            return;
        }
        if (createAccountData.password.length < 6) {
            setLocalError("Пароль должен быть не менее 6 символов");
            return;
        }
        dispatch(register({
            ...createAccountData,
            fullName: trimmedFullName,
            email: trimmedEmail
        }));
    };

    const onChangeFullName = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setCreateAccountData({...createAccountData, fullName: e.target.value});
        if (localError) setLocalError(null);
        if (error) dispatch(clearAuthError());
    };

    const onChangeUsername = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setCreateAccountData({...createAccountData, email: e.target.value});
        if (localError) setLocalError(null);
        if (error) dispatch(clearAuthError());
    }

    const onChangePassword = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setCreateAccountData({...createAccountData, password: e.target.value});
        if (localError) setLocalError(null);
        if (error) dispatch(clearAuthError());
    };

    const onNavigateToSignIn = () => {
        navigate("/signin");
    }

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const isFormValid = createAccountData.fullName.trim() !== "" &&
        createAccountData.email.trim() !== "" &&
        createAccountData.password.length >= 6;
    const isButtonDisabled = !isFormValid || loading;
    const displayError = localError || error;

    return (
        <div className={styles.outerContainer}>
            <div className={styles.innerContainer}>
                <div className={styles.logo}>
                    <div className={styles.logoEmblem}>
                        <MBankLogo size={64} />
                    </div>
                    <h1 className={styles.logoText}>
                        M<span className={styles.logoAccent}>Bank</span> Chat
                    </h1>
                    <p className={styles.subtitle}>Создание аккаунта</p>
                </div>

                {displayError && (
                    <div className={styles.errorMessage}>
                        {displayError}
                    </div>
                )}

                <form onSubmit={onSubmit}>
                    <div className={styles.inputGroup}>
                        <p className={styles.text}>ФИО</p>
                        <TextField
                            className={styles.textInput}
                            id="fullName"
                            type="text"
                            placeholder="Иванов Иван Иванович"
                            variant="outlined"
                            onChange={onChangeFullName}
                            value={createAccountData.fullName}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Badge sx={{ color: '#999' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.text}>Логин</p>
                        <TextField
                            className={styles.textInput}
                            id="username"
                            type="text"
                            placeholder="Например: r_koledin"
                            variant="outlined"
                            onChange={onChangeUsername}
                            value={createAccountData.email}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person sx={{ color: '#999' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.text}>Пароль</p>
                        <TextField
                            className={styles.textInput}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Минимум 6 символов"
                            variant="outlined"
                            onChange={onChangePassword}
                            value={createAccountData.password}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: '#999' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleTogglePassword}
                                            edge="end"
                                            size="small"
                                            disabled={loading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>
                    <div className={styles.button}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            type="submit"
                            disabled={isButtonDisabled}
                            sx={{
                                backgroundColor: '#00875A',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '15px',
                                textTransform: 'none',
                                borderRadius: '10px',
                                padding: '14px 24px',
                                boxShadow: 'none',
                                letterSpacing: 0,
                                '&:hover': {
                                    backgroundColor: '#006644',
                                    boxShadow: '0 6px 20px rgba(0, 135, 90, 0.35)',
                                },
                                '&:disabled': {
                                    backgroundColor: '#E5E7EB',
                                    color: '#9CA3AF',
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: '#18191C' }} />
                            ) : (
                                'Зарегистрироваться'
                            )}
                        </Button>
                    </div>
                </form>

                <div className={styles.divider}>
                    <span>или</span>
                </div>

                <div className={styles.bottomContainer}>
                    <p>Уже есть аккаунт?</p>
                    <Button
                        variant='text'
                        onClick={onNavigateToSignIn}
                        disabled={loading}
                        sx={{
                            color: '#18191C',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            },
                        }}
                    >
                        Войти
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
