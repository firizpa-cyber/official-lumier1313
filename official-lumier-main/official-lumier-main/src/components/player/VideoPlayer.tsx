import React, { useEffect, useRef } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
    streamUrl: string;
    poster?: string;
    title?: string;
}

declare global {
    interface Window {
        Hls: any;
        ProVideoPlayer: any;
        PlayerUI: any;
    }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, poster, title }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerInstance = useRef<any>(null);

    useEffect(() => {
        const loadScript = (id: string, url: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                // Проверяем если скрипт уже загружен
                if (document.getElementById(id)) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.id = id;
                script.src = url;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load ${url}`));
                document.head.appendChild(script);
            });
        };

        const loadStylesheet = (id: string, url: string): void => {
            if (document.getElementById(id)) return;

            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
        };

        const initPlayer = async () => {
            try {
                // Загружаем HLS.js LATEST из CDN
                await loadScript('hls-js', 'https://cdn.jsdelivr.net/npm/hls.js@latest');
                console.log('[VideoPlayer] ✅ HLS.js loaded from CDN');

                // Загружаем Material Icons
                loadStylesheet('material-icons', 'https://fonts.googleapis.com/icon?family=Material+Icons+Round');

                // Загружаем CSS стили
                loadStylesheet('player-modern-css', '/assets/css/player-modern.css');
                loadStylesheet('antigravity-theme-css', '/assets/css/antigravity-theme.css');

                // Загружаем player scripts
                await loadScript('player-core-js', '/assets/js/player-core.js');
                await loadScript('player-ui-js', '/assets/js/player-ui.js');

                console.log('[VideoPlayer] ✅ All scripts loaded');

                if (videoRef.current && containerRef.current && window.ProVideoPlayer && window.PlayerUI) {
                    // Cleanup previous instance
                    if (playerInstance.current) {
                        try {
                            playerInstance.current.destroy();
                        } catch (e) {
                            console.warn('[VideoPlayer] Error destroying previous player:', e);
                        }
                    }

                    // Create new player instance
                    playerInstance.current = new window.ProVideoPlayer({
                        videoElement: videoRef.current,
                        container: containerRef.current,
                        autoplay: false,  // Отключаем автоплей для совместимости
                        onError: (error: any) => {
                            console.error('[VideoPlayer] Player error:', error);
                        }
                    });

                    // Create UI
                    const ui = new window.PlayerUI(playerInstance.current);

                    if (title && ui.setTitle) {
                        ui.setTitle(title);
                    }

                    // Load video source НАПРЯМУЮ без proxy
                    console.log('[VideoPlayer] Loading source:', streamUrl);
                    playerInstance.current.loadSource(streamUrl);

                    console.log('[VideoPlayer] ✅ Player initialized successfully');
                }
            } catch (error) {
                console.error('[VideoPlayer] Initialization error:', error);
            }
        };

        // Инициализация с небольшой задержкой для надежности
        const timeout = setTimeout(() => {
            initPlayer();
        }, 100);

        return () => {
            clearTimeout(timeout);
            if (playerInstance.current) {
                try {
                    playerInstance.current.destroy();
                    playerInstance.current = null;
                } catch (e) {
                    console.warn('[VideoPlayer] Cleanup error:', e);
                }
            }
        };
    }, [streamUrl, title]);

    return (
        <div className="player-module-wrapper">
            <div
                id="videoPlayerContainer"
                ref={containerRef}
                className="video-player-container modern-player-container-override"
                style={{
                    width: '100%',
                    maxWidth: '100%',
                    margin: '0 auto',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#000'
                }}
            >
                <video
                    id="mainVideo"
                    ref={videoRef}
                    poster={poster}
                    playsInline
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                    }}
                ></video>
            </div>
        </div>
    );
};

export default VideoPlayer;
