// Сервис уведомлений для чата
import {logger} from "./logger";

// Запрос разрешения на уведомления
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        logger.log('Браузер не поддерживает уведомления');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Показать браузерное уведомление
export const showBrowserNotification = (title: string, body: string, onClick?: () => void) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'chat-message', // Группировка уведомлений
        renotify: true,
    });

    if (onClick) {
        notification.onclick = () => {
            window.focus();
            notification.close();
            onClick();
        };
    }

    // Автоматически закрыть через 5 секунд
    setTimeout(() => notification.close(), 5000);
};

// Звуковое уведомление
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

// Воспроизвести звук уведомления (используем Web Audio API для создания простого звука)
export const playNotificationSound = () => {
    try {
        const context = getAudioContext();

        // Создаём простой звук "ping"
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        // Настройки звука
        oscillator.frequency.setValueAtTime(800, context.currentTime); // Частота (Гц)
        oscillator.type = 'sine';

        // Громкость с затуханием
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

        // Воспроизвести
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
    } catch (error) {
        logger.warn('Не удалось воспроизвести звук:', error);
    }
};

// Проверка, находится ли вкладка в фокусе
export const isTabFocused = (): boolean => {
    return document.visibilityState === 'visible' && document.hasFocus();
};

// Обновить title страницы с количеством непрочитанных
export const updatePageTitle = (unreadCount: number) => {
    const baseTitle = 'MBank Chat';
    if (unreadCount > 0) {
        document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
        document.title = baseTitle;
    }
};

// Настройки уведомлений (храним в localStorage)
interface NotificationSettings {
    soundEnabled: boolean;
    browserNotificationsEnabled: boolean;
}

const NOTIFICATION_SETTINGS_KEY = 'chat_notification_settings';

export const getNotificationSettings = (): NotificationSettings => {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return {
        soundEnabled: true,
        browserNotificationsEnabled: true,
    };
};

export const saveNotificationSettings = (settings: NotificationSettings) => {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};
