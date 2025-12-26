import React, { useEffect, useRef } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
    streamUrl: string;
    poster?: string;
    title?: string;
}

declare global {
    interface Window {
        ProVideoPlayer: any;
        PlayerUI: any;
        Hls: any;
    }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, poster, title }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerInstance = useRef<any>(null);

    const loadScript = (id: string, url: string): Promise<void> => {
        return new Promise((resolve) => {
            if (document.getElementById(id)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    };

    useEffect(() => {
        const initPlayer = async () => {
            // Load HLS.js
            await loadScript('hls-js', 'https://cdn.jsdelivr.net/npm/hls.js@latest');

            // Load Material Icons
            if (!document.getElementById('material-icons')) {
                const link = document.createElement('link');
                link.id = 'material-icons';
                link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }

            // Load professional player scripts
            await loadScript('player-core-js', '/assets/js/player-core.js');
            await loadScript('player-ui-js', '/assets/js/player-ui.js');

            if (videoRef.current && containerRef.current && window.ProVideoPlayer && window.PlayerUI) {
                // Cleanup previous instance if any
                if (playerInstance.current) {
                    playerInstance.current.destroy();
                }

                // Create player
                playerInstance.current = new window.ProVideoPlayer({
                    videoElement: videoRef.current,
                    container: containerRef.current,
                    autoplay: true
                });

                // Create UI
                const ui = new window.PlayerUI(playerInstance.current);
                if (title && ui.setTitle) {
                    ui.setTitle(title);
                }

                // Load source
                playerInstance.current.loadSource(streamUrl);
            }
        };

        initPlayer();

        return () => {
            if (playerInstance.current) {
                playerInstance.current.destroy();
            }
        };
    }, [streamUrl, title]);

    return (
        <div className="player-module-wrapper">
            <link rel="stylesheet" href="/assets/css/player-modern.css" />
            <link rel="stylesheet" href="/assets/css/antigravity-theme.css" />
            <div
                id="videoPlayerContainer"
                ref={containerRef}
                className="video-player-container modern-player-container-override"
            >
                <video
                    id="mainVideo"
                    ref={videoRef}
                    poster={poster}
                    playsInline
                ></video>
            </div>
        </div>
    );
};

export default VideoPlayer;
