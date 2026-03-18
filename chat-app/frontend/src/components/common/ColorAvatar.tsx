import React from 'react';
import { Avatar } from '@mui/material';

// Палитра цветов для аватаров — приятные, не слишком яркие
const AVATAR_COLORS = [
    '#00875A', // MBank green
    '#0284C7', // blue
    '#7C3AED', // purple
    '#DC2626', // red
    '#D97706', // amber
    '#0891B2', // cyan
    '#059669', // emerald
    '#9333EA', // violet
    '#EA580C', // orange
    '#0D9488', // teal
    '#4F46E5', // indigo
    '#BE185D', // pink
];

// Стабильный цвет по строке имени
function getAvatarColor(name: string): string {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

interface ColorAvatarProps {
    name: string;
    size?: number;
    fontSize?: number;
    sx?: object;
    src?: string;
}

const ColorAvatar: React.FC<ColorAvatarProps> = ({ name, size = 40, fontSize, sx = {}, src }) => {
    const color = getAvatarColor(name);
    const initials = getInitials(name);
    const calculatedFontSize = fontSize ?? Math.round(size * 0.38);

    return (
        <Avatar
            src={src ?? undefined}
            sx={{
                width: size,
                height: size,
                backgroundColor: color,
                color: '#FFFFFF',
                fontSize: calculatedFontSize,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.02em',
                flexShrink: 0,
                ...sx,
            }}
        >
            {!src && initials}
        </Avatar>
    );
};

export { getAvatarColor, getInitials };
export default ColorAvatar;
