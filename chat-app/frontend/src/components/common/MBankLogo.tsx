import React from 'react';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';

interface MBankLogoProps {
    size?: number;
    showText?: boolean;
    textSize?: number;
    textColor?: string;
    variant?: 'light' | 'dark';
}

const MBankLogo: React.FC<MBankLogoProps> = ({ size = 48 }) => {
    const radius = Math.round(size * 0.28);
    const iconSize = Math.round(size * 0.55);

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
                backgroundColor: '#00875A',
                boxShadow: '0 2px 8px rgba(0,135,90,0.35)',
            }}
        >
            <ChatBubbleIcon style={{ fontSize: iconSize, color: '#FFFFFF' }} />
        </div>
    );
};

export default MBankLogo;
