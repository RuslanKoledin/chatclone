import React from 'react';
import mchatLogo from '../../assets/mchat-logo.png';

interface MBankLogoProps {
    size?: number;
    showText?: boolean;  // не используется, оставлен для совместимости
    textSize?: number;
    textColor?: string;
    variant?: 'light' | 'dark';
}

const MBankLogo: React.FC<MBankLogoProps> = ({ size = 48 }) => {
    const radius = Math.round(size * 0.24); // ~24% — как у WhatsApp

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                background: '#FFFFFF',
            }}
        >
            <img
                src={mchatLogo}
                alt="MyChat"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                }}
            />
        </div>
    );
};

export default MBankLogo;
