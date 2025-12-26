<?php
/**
 * ANT-OTT-PLAYER
 * Modern Professional Video Player
 */

// COEP/COOP для FFmpeg.wasm
header("Cross-Origin-Opener-Policy: same-origin");
header("Cross-Origin-Embedder-Policy: require-corp");
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANT-OTT-PLAYER</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">

    <!-- Стили -->
    <link rel="stylesheet" href="assets/css/antigravity-theme.css">
    <link rel="stylesheet" href="assets/css/youtube-player.css">
    <link rel="stylesheet" href="assets/css/fps-optimization.css">
    <link rel="stylesheet" href="assets/css/player.css">

    <!-- Библиотеки -->
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="lib/ffmpeg.min.js"></script>
</head>
<body>

    <!-- Анимированный фон Antigravity -->
    <div class="antigravity-background">
        <div class="ag-orb ag-orb-1"></div>
        <div class="ag-orb ag-orb-2"></div>
    </div>

    <!-- Основной контейнер -->
    <div class="ag-main-container">
        
        <!-- Заголовок и управление -->
        <div class="ag-card ag-mb-3">
            <div class="ag-card-header">
                <h1 class="ag-heading-1" style="background: linear-gradient(135deg, #4285f4, #ea4335); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    ANT-OTT-PLAYER
                </h1>
            </div>
            
            <!-- Ввод URL -->
            <div style="margin-bottom: 16px;">
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <input type="text" id="urlInput" 
                        placeholder="Введите URL видео (HLS/DASH/MP4/WebM)..."
                        value="http://ant-tv.ddns.net/vod/hls/lun4/KINOTK/Odin.doma.1990.BDRip-AVC/master.m3u8"
                        style="flex: 1; min-width: 300px; padding: 12px 16px; border: 1px solid var(--ag-border-light); border-radius: var(--ag-radius-xl); font-size: 14px; font-family: var(--ag-font-primary);">
                    <button class="ag-button ag-button-primary" id="loadUrlBtn">
                        <span class="material-icons-round" style="font-size: 20px;">play_arrow</span>
                        Загрузить
                    </button>
                    <button class="ag-button ag-button-secondary" id="loadLocalBtn">
                        <span class="material-icons-round" style="font-size: 20px;">folder_open</span>
                        Локальный
                    </button>
                    <input type="file" id="localFileInput" accept="video/*" style="display: none;">
                </div>
            </div>
            
            <!-- Кнопки инструментов -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="ag-button ag-button-secondary" id="toggleStatsBtn">
                    <span class="material-icons-round" style="font-size: 20px;">analytics</span>
                    Статистика
                </button>
            </div>
        </div>

        <!-- Видеоплеер -->
        <div class="ag-card" style="padding: 0; overflow: hidden;">
            <div class="video-player-container" id="videoPlayerContainer">
                <video id="mainVideo" class="video-element" playsinline crossorigin="anonymous"></video>
            </div>
        </div>
        
    </div>

    <!-- Скрипты модулей -->
    <script src="assets/js/player-core.js"></script>
    <script src="modules/codec/codec-engine.js"></script>
    <script src="modules/audio/player-audio.js"></script>
    <script src="modules/subtitles/player-subtitles.js"></script>
    <script src="modules/ui/player-ui.js"></script>
    <script src="modules/stats/player-stats.js"></script>
    <script src="modules/ffmpeg/player-ffmpeg.js"></script>

    <!-- Основной скрипт -->
    <script>
        // Инициализация плеера
        const player = new ProVideoPlayer({
            videoElement: 'mainVideo',
            container: 'videoPlayerContainer',
            autoplay: false,
            onReady: () => console.log('[App] Плеер готов'),
            onError: (error) => console.error('[App] Ошибка:', error)
        });

        // Модули
        const codecEngine = new CodecEngine(player);
        const audio = new PlayerAudio(player);
        const subtitles = new PlayerSubtitles(player);
        const ui = new PlayerUI(player);
        const stats = new PlayerStats(player);
        const ffmpeg = new PlayerFFmpeg(player, {
            corePath: './lib/ffmpeg-core.js',
            onLog: (msg) => console.log('[FFmpeg]', msg)
        });

        player.codecEngine = codecEngine;
        player.audio = audio;
        player.subtitles = subtitles;
        player.ui = ui;
        player.stats = stats;
        player.ffmpeg = ffmpeg;

        // События
        document.getElementById('loadUrlBtn').addEventListener('click', () => {
            const url = document.getElementById('urlInput').value.trim();
            if (!url) {
                alert('Введите URL видео');
                return;
            }

            let sourceUrl = url;
            if (url.startsWith('http://') || url.startsWith('https://')) {
                if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
                    sourceUrl = './proxy.php?url=' + encodeURIComponent(url);
                }
            }

            player.loadSource(sourceUrl);
            const filename = url.split('/').pop().split('?')[0];
            ui.setTitle(filename || 'Видеоплеер');
        });

        document.getElementById('loadLocalBtn').addEventListener('click', () => {
            document.getElementById('localFileInput').click();
        });

        document.getElementById('localFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                player.loadSource(url);
                ui.setTitle(file.name);
            }
        });

        document.getElementById('toggleStatsBtn').addEventListener('click', () => {
            stats.toggle();
        });

        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loadUrlBtn').click();
            }
        });

        // Авто-загрузка
        setTimeout(() => {
            document.getElementById('loadUrlBtn').click();
        }, 500);

        // Публичное API
        window.VideoPlayerAPI = {
            player, ui, stats, ffmpeg, audio, codecEngine,
            play: () => player.play(),
            pause: () => player.pause(),
            seek: (time) => player.seek(time),
            setVolume: (vol) => player.setVolume(vol),
            setQuality: (idx) => player.setQuality(idx),
            loadSource: (url, type) => player.loadSource(url, type),
            getState: () => player.getState()
        };

        console.log('[App] ANT-OTT-PLAYER v3.0');
        console.log('[App] API: window.VideoPlayerAPI');
    </script>

</body>
</html>
