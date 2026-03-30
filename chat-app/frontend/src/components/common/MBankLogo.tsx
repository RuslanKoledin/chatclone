import React from 'react';

interface MBankLogoProps {
    size?: number;
    showText?: boolean;
    textSize?: number;
    textColor?: string;
    variant?: 'light' | 'dark';
}

const MBankLogo: React.FC<MBankLogoProps> = ({ size = 48 }) => {
    const radius = Math.round(size * 0.28);
    const fontSize = Math.round(size * 0.38);

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: '#00875A',
                boxShadow: '0 2px 8px rgba(0,135,90,0.35)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: fontSize,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.5px',
                userSelect: 'none',
            }}
        >
            My
        </div>
    );
};

export default MBankLogo;
