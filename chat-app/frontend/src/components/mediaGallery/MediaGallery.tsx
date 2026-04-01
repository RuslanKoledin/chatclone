import React, { useState } from 'react';
import { ChatDTO } from '../../redux/chat/ChatModel';
import { AttachmentDTO } from '../../redux/message/MessageModel';
import { IconButton, Dialog } from '@mui/material';
import WestIcon from '@mui/icons-material/West';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { BASE_API_URL } from '../../config/Config';
import styles from './MediaGallery.module.scss';

interface MediaGalleryProps {
    chat: ChatDTO;
    onClose: () => void;
}

const MediaGallery = ({ chat, onClose }: MediaGalleryProps) => {
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const allAttachments: AttachmentDTO[] = chat.messages
        .flatMap(m => m.attachments ?? [])
        .filter(a => a.url);

    const images = allAttachments.filter(a => a.contentType?.startsWith('image/'));
    const files = allAttachments.filter(a => !a.contentType?.startsWith('image/') && !a.contentType?.startsWith('audio/'));
    const audios = allAttachments.filter(a => a.contentType?.startsWith('audio/'));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <IconButton onClick={onClose} size="small">
                    <WestIcon fontSize="medium" />
                </IconButton>
                <h2 className={styles.title}>Медиафайлы</h2>
            </div>

            {images.length > 0 && (
                <section className={styles.section}>
                    <p className={styles.sectionLabel}>Фото ({images.length})</p>
                    <div className={styles.imageGrid}>
                        {images.map(img => (
                            <img
                                key={img.id}
                                src={`${BASE_API_URL}${img.url}`}
                                alt={img.fileName}
                                className={styles.gridImage}
                                onClick={() => setLightboxUrl(`${BASE_API_URL}${img.url}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {audios.length > 0 && (
                <section className={styles.section}>
                    <p className={styles.sectionLabel}>Аудио ({audios.length})</p>
                    {audios.map(a => (
                        <div key={a.id} className={styles.audioRow}>
                            <span className={styles.fileName}>{a.fileName}</span>
                            <audio controls className={styles.audio}>
                                <source src={`${BASE_API_URL}${a.url}`} type={a.contentType} />
                            </audio>
                        </div>
                    ))}
                </section>
            )}

            {files.length > 0 && (
                <section className={styles.section}>
                    <p className={styles.sectionLabel}>Файлы ({files.length})</p>
                    {files.map(f => (
                        <a
                            key={f.id}
                            href={`${BASE_API_URL}${f.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.fileRow}
                        >
                            <AttachFileIcon sx={{ fontSize: '1.1rem', flexShrink: 0 }} />
                            <span className={styles.fileName}>{f.fileName}</span>
                            <span className={styles.fileSize}>({(f.fileSize / 1024).toFixed(1)} KB)</span>
                        </a>
                    ))}
                </section>
            )}

            {allAttachments.length === 0 && (
                <p className={styles.empty}>В этом чате нет медиафайлов</p>
            )}

            {/* Лайтбокс */}
            <Dialog
                open={!!lightboxUrl}
                onClose={() => setLightboxUrl(null)}
                maxWidth={false}
                PaperProps={{ sx: { background: 'rgba(0,0,0,0.92)', boxShadow: 'none', position: 'relative' } }}
            >
                <IconButton
                    onClick={() => setLightboxUrl(null)}
                    sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 1 }}
                >
                    <CloseIcon />
                </IconButton>
                {lightboxUrl && (
                    <IconButton
                        component="a"
                        href={lightboxUrl}
                        download
                        sx={{ position: 'absolute', top: 8, right: 52, color: '#fff', zIndex: 1 }}
                    >
                        <DownloadIcon />
                    </IconButton>
                )}
                {lightboxUrl && (
                    <img
                        src={lightboxUrl}
                        alt="просмотр"
                        style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
                    />
                )}
            </Dialog>
        </div>
    );
};

export default MediaGallery;
