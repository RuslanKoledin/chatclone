import React from "react";
import {UserDTO} from "../../redux/auth/AuthModel";
import styles from './WelcomePage.module.scss';
import MBankLogo from "../common/MBankLogo";

interface WelcomePageProps {
    reqUser: UserDTO | null;
}

const WelcomePage = (props: WelcomePageProps) => {
    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.innerWelcomeContainer}>
                <MBankLogo size={80} />
                <h1>Добро пожаловать, {props.reqUser?.fullName}!</h1>
                <p>Выберите чат или начните новую беседу</p>
            </div>
        </div>
    );
};

export default WelcomePage;
