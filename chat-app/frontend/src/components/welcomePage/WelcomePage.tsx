import ForumIcon from "@mui/icons-material/Forum";
import React from "react";
import {UserDTO} from "../../redux/auth/AuthModel";
import styles from './WelcomePage.module.scss';

interface WelcomePageProps {
    reqUser: UserDTO | null;
}

const WelcomePage = (props: WelcomePageProps) => {
    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.innerWelcomeContainer}>
                <ForumIcon sx={{
                    width: '8rem',
                    height: '8rem',
                    color: '#00875A',
                }}/>
                <h1>Добро пожаловать, {props.reqUser?.fullName}!</h1>
                <p>Выберите чат или начните новую беседу</p>
            </div>
        </div>
    );
};

export default WelcomePage;