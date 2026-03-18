import {TOKEN} from "../../config/Config";
import {useDispatch, useSelector} from "react-redux";
import {LoginRequestDTO} from "../../redux/auth/AuthModel";
import {useNavigate} from "react-router-dom";
import React, {Dispatch, useEffect, useState} from "react";
import {currentUser, loginUser, clearAuthError} from "../../redux/auth/AuthAction";
import {RootState} from "../../redux/Store";
import {
    Button,
    TextField,
    InputAdornment,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from "@mui/material";
import {VisibilityOff, Visibility} from "@mui/icons-material";
import styles from "./Register.module.scss";
import mchatLogo from "../../assets/mchat-logo.png";

const SignIn = () => {
    const [signInData, setSignInData] = useState<LoginRequestDTO>({username: "", password: ""});
    const [showPassword, setShowPassword] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch: Dispatch<any> = useDispatch();
    const token: string | null = localStorage.getItem(TOKEN);
    const {reqUser, loading, error} = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (token) {
            dispatch(currentUser(token));
        }
    }, [token, dispatch]);

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
        const trimmedUsername = signInData.username.trim();
        if (!trimmedUsername || !signInData.password) return;
        dispatch(loginUser({...signInData, username: trimmedUsername}));
    };

    const onChangeUsername = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setSignInData({...signInData, username: e.target.value});
        if (error) dispatch(clearAuthError());
    };

    const onChangePassword = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setSignInData({...signInData, password: e.target.value});
        if (error) dispatch(clearAuthError());
    };

    const isFormValid = signInData.username.trim() !== "" && signInData.password !== "";

    return (
        <div className={styles.outerContainer}>
            <div className={styles.innerContainer}>

                {/* Логотип */}
                <div className={styles.logo}>
                    <img src={mchatLogo} alt="Mchat" className={styles.logoImg} />
                    <span className={styles.logoWord}>Chat</span>
                </div>

                {/* Заголовок */}
                <h1 className={styles.heading}>Вход</h1>
                <p className={styles.subtitle}>Введите логин и пароль от Windows</p>

                {error && (
                    <div className={styles.errorMessage}>{error}</div>
                )}

                <form onSubmit={onSubmit}>
                    <TextField
                        className={styles.textInput}
                        fullWidth
                        id="username"
                        type="text"
                        placeholder="Учетная запись (a_asanov)"
                        variant="outlined"
                        onChange={onChangeUsername}
                        value={signInData.username}
                        disabled={loading}
                    />

                    <TextField
                        className={styles.textInput}
                        fullWidth
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Пароль"
                        variant="outlined"
                        onChange={onChangePassword}
                        value={signInData.password}
                        disabled={loading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size="small"
                                        disabled={loading}
                                        sx={{ color: '#999' }}
                                    >
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        type="submit"
                        disabled={!isFormValid || loading}
                        className={styles.submitBtn}
                        sx={{
                            backgroundColor: '#2EB67D',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '15px',
                            textTransform: 'none',
                            borderRadius: '10px',
                            padding: '14px 24px',
                            boxShadow: 'none',
                            marginTop: '20px',
                            '&:hover': { backgroundColor: '#239e67', boxShadow: 'none' },
                            '&:disabled': { backgroundColor: '#E5E7EB', color: '#9CA3AF' },
                        }}
                    >
                        {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Войти'}
                    </Button>

                    <div className={styles.forgotPassword}>
                        <Button
                            variant="text"
                            size="small"
                            onClick={() => setForgotPasswordOpen(true)}
                            sx={{
                                color: '#999',
                                textTransform: 'none',
                                fontSize: '13px',
                                '&:hover': { backgroundColor: 'transparent', color: '#555' },
                            }}
                        >
                            Забыли пароль?
                        </Button>
                    </div>
                </form>
            </div>

            <Dialog
                open={forgotPasswordOpen}
                onClose={() => setForgotPasswordOpen(false)}
                PaperProps={{ sx: { borderRadius: '12px', padding: '8px' } }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Восстановление пароля</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Для восстановления пароля обратитесь к системному администратору ОПО.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setForgotPasswordOpen(false)}
                        sx={{ color: '#18191C', fontWeight: 600, textTransform: 'none' }}
                    >
                        Понятно
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SignIn;
