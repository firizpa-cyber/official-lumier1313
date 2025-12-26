/**
 * YouTube-Style UI Module
 * Точная структура и функционал как в YouTube 2024
 */

class PlayerUI {
    constructor(player) {
        this.player = player;
        this.container = player.container;
        this.video = player.video;

        this.elements = {};
        this.hideControlsTimeout = null;
        this.isUpdatingProgress = false;

        this.init();
    }

    init() {
        this.createYouTubeUI();
        this.setupEventListeners();
        this.setupPlayerListeners();
        this.setupAutoHide();
        this.setupKeyboardShortcuts();
    }

    createYouTubeUI() {
        // Основной оверлей
        const overlay = document.createElement('div');
        overlay.className = 'player-controls-overlay';

        // Большая кнопка Play
        const centerControls = document.createElement('div');
        centerControls.className = 'player-center-controls';
        centerControls.innerHTML = `
            <button class="player-big-play-btn" aria-label="Play">
                <span class="material-icons-round">play_arrow</span>
            </button>
        `;

        // Верхняя панель
        const topBar = document.createElement('div');
        topBar.className = 'player-top-bar';
        topBar.innerHTML = `
            <div class="player-title">Видеоплеер</div>
        `;

        // Нижние контролы
        const bottomControls = document.createElement('div');
        bottomControls.className = 'player-bottom-controls';

        // Прогресс-бар
        const progressContainer = document.createElement('div');
        progressContainer.className = 'player-progress-container';
        progressContainer.setAttribute('role', 'slider');
        progressContainer.setAttribute('aria-label', 'Перемотка');
        progressContainer.innerHTML = `
            <div class="player-progress-buffer"></div>
            <div class="player-progress-played"></div>
            <div class="player-progress-scrubber"></div>
            <div class="player-progress-hover"></div>
            <div class="player-progress-tooltip">0:00</div>
        `;

        // Панель кнопок
        const controlsRow = document.createElement('div');
        controlsRow.className = 'player-controls-row';

        // Левые кнопки
        const controlsLeft = document.createElement('div');
        controlsLeft.className = 'player-controls-left';
        controlsLeft.innerHTML = `
            <button class="player-btn-icon" data-action="play" aria-label="Воспроизведение">
                <span class="material-icons-round">play_arrow</span>
            </button>
            <div class="player-volume-control">
                <button class="player-btn-icon" data-action="mute" aria-label="Звук">
                    <span class="material-icons-round">volume_up</span>
                </button>
                <div class="player-volume-slider-container">
                    <input type="range" class="player-volume-slider" min="0" max="100" value="100" aria-label="Громкость">
                </div>
            </div>
            <div class="player-time-display">
                <span class="player-time-current">0:00</span>
                <span class="player-time-sep"> / </span>
                <span class="player-time-duration">0:00</span>
            </div>
        `;

        // Правые кнопки
        const controlsRight = document.createElement('div');
        controlsRight.className = 'player-controls-right';
        controlsRight.innerHTML = `
            <div class="player-settings-group">
                <button class="player-btn-icon" data-action="audio" aria-label="Аудиодорожка">
                    <span class="material-icons-round">audio_file</span>
                </button>
                <div class="player-menu" data-menu="audio">
                    <div class="player-menu-header">Аудиодорожка</div>
                    <div class="player-menu-items">
                        <div class="player-menu-item" data-value="0">Основная</div>
                    </div>
                </div>
            </div>
            <div class="player-settings-group">
                <button class="player-btn-icon player-btn-text" data-action="speed" aria-label="Скорость">
                    1x
                </button>
                <div class="player-menu" data-menu="speed">
                    <div class="player-menu-header">Скорость воспроизведения</div>
                    <div class="player-menu-items">
                        <div class="player-menu-item" data-value="0.25">0.25</div>
                        <div class="player-menu-item" data-value="0.5">0.5</div>
                        <div class="player-menu-item" data-value="0.75">0.75</div>
                        <div class="player-menu-item" data-value="1" data-active="true">Обычная</div>
                        <div class="player-menu-item" data-value="1.25">1.25</div>
                        <div class="player-menu-item" data-value="1.5">1.5</div>
                        <div class="player-menu-item" data-value="1.75">1.75</div>
                        <div class="player-menu-item" data-value="2">2</div>
                    </div>
                </div>
            </div>
            <div class="player-settings-group">
                <button class="player-btn-icon player-btn-text" data-action="quality" aria-label="Качество">
                    Auto
                </button>
                <div class="player-menu" data-menu="quality">
                    <div class="player-menu-header">Качество</div>
                    <div class="player-menu-items">
                        <div class="player-menu-item" data-value="-1" data-active="true">Auto</div>
                    </div>
                </div>
            </div>
            <button class="player-btn-icon" data-action="subtitles" aria-label="Субтитры">
                <span class="material-icons-round">closed_caption</span>
            </button>
            <div class="player-menu" data-menu="subtitles">
                <div class="player-menu-header">Субтитры</div>
                <div class="player-menu-items">
                    <div class="player-menu-item" data-value="-1" data-active="true">Выключено</div>
                </div>
            </div>
            <button class="player-btn-icon" data-action="settings" aria-label="Настройки">
                <span class="material-icons-round">settings</span>
            </button>
            <button class="player-btn-icon" data-action="theater" aria-label="Широкий режим">
                <span class="material-icons-round">rectangle</span>
            </button>
            <button class="player-btn-icon" data-action="fullscreen" aria-label="Полный экран">
                <span class="material-icons-round">fullscreen</span>
            </button>
        `;

        // Error Panel
        const errorPanel = document.createElement('div');
        errorPanel.className = 'player-error-panel';
        errorPanel.innerHTML = `
            <div class="player-error-content">
                <span class="material-icons-round">error_outline</span>
                <div class="player-error-text">Видео недоступно или временно не может быть воспроизведено</div>
                <button class="player-retry-btn">Повторить попытку</button>
            </div>
        `;

        // Loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'player-loading-spinner';
        spinner.innerHTML = '<div class="player-spinner"></div>';

        // Сборка
        controlsRow.appendChild(controlsLeft);
        controlsRow.appendChild(controlsRight);
        bottomControls.appendChild(progressContainer);
        bottomControls.appendChild(controlsRow);

        overlay.appendChild(topBar);
        overlay.appendChild(centerControls);
        overlay.appendChild(bottomControls);

        this.container.appendChild(overlay);
        this.container.appendChild(spinner);
        this.container.appendChild(errorPanel);

        // Сохранить ссылки
        this.elements = {
            overlay,
            centerControls,
            topBar,
            bottomControls,
            progressContainer,
            progressBuffer: progressContainer.querySelector('.player-progress-buffer'),
            progressPlayed: progressContainer.querySelector('.player-progress-played'),
            progressScrubber: progressContainer.querySelector('.player-progress-scrubber'),
            progressTooltip: progressContainer.querySelector('.player-progress-tooltip'),
            playBtn: controlsLeft.querySelector('[data-action="play"]'),
            muteBtn: controlsLeft.querySelector('[data-action="mute"]'),
            volumeSlider: controlsLeft.querySelector('.player-volume-slider'),
            timeDisplay: controlsLeft.querySelector('.player-time-display'),
            timeCurrent: controlsLeft.querySelector('.player-time-current'),
            timeDuration: controlsLeft.querySelector('.player-time-duration'),
            audioBtn: controlsRight.querySelector('[data-action="audio"]'),
            speedBtn: controlsRight.querySelector('[data-action="speed"]'),
            qualityBtn: controlsRight.querySelector('[data-action="quality"]'),
            subtitlesBtn: controlsRight.querySelector('[data-action="subtitles"]'),
            settingsBtn: controlsRight.querySelector('[data-action="settings"]'),
            theaterBtn: controlsRight.querySelector('[data-action="theater"]'),
            fullscreenBtn: controlsRight.querySelector('[data-action="fullscreen"]'),
            menuAudio: controlsRight.querySelector('[data-menu="audio"]'),
            menuSpeed: controlsRight.querySelector('[data-menu="speed"]'),
            menuQuality: controlsRight.querySelector('[data-menu="quality"]'),
            menuSubtitles: controlsRight.querySelector('[data-menu="subtitles"]'),
            spinner,
            errorPanel,
            errorText: errorPanel.querySelector('.player-error-text'),
            retryBtn: errorPanel.querySelector('.player-retry-btn'),
            title: topBar.querySelector('.player-title')
        };
    }

    setupEventListeners() {
        // Play/Pause
        this.elements.playBtn.addEventListener('click', () => this.player.togglePlay());
        this.elements.centerControls.querySelector('.player-big-play-btn').addEventListener('click', () => this.player.togglePlay());

        // Mute
        this.elements.muteBtn.addEventListener('click', () => this.player.toggleMute());

        // Volume
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.player.setVolume(e.target.value / 100);
        });

        // Progress bar
        this.setupProgressBar();

        // Menus
        this.setupMenu('speed', (value) => {
            this.player.setPlaybackRate(parseFloat(value));
            this.elements.speedBtn.textContent = value === '1' ? '1x' : value + 'x';
        });

        this.setupMenu('quality', (value) => {
            const index = parseInt(value);
            if (index === -1) {
                this.player.setAutoQuality();
                this.elements.qualityBtn.textContent = 'Auto';
            } else {
                this.player.setQuality(index);
                const quality = this.player.state.availableQualities[index];
                this.elements.qualityBtn.textContent = quality?.label || 'Auto';
            }
        });


        this.setupMenu('audio', (value) => {
            const index = parseInt(value);
            if (this.player.audio) {
                this.player.audio.setTrack(index);
            }
        });

        this.setupMenu('subtitles', (value) => {
            const index = parseInt(value);
            if (this.player.subtitles) {
                this.player.subtitles.setTrack(index);
            }
        });

        // Buttons
        this.elements.theaterBtn.addEventListener('click', () => this.toggleTheater());
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    setupProgressBar() {
        const progress = this.elements.progressContainer;
        let seeking = false;

        const seek = (e) => {
            const rect = progress.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const time = percent * this.player.state.duration;
            return { percent, time };
        };

        progress.addEventListener('mousedown', (e) => {
            seeking = true;
            const { time } = seek(e);
            this.player.seek(time);
        });

        progress.addEventListener('mousemove', (e) => {
            const { percent, time } = seek(e);
            this.elements.progressTooltip.textContent = this.formatTime(time);
            this.elements.progressTooltip.style.left = (percent * 100) + '%';

            if (seeking) {
                this.player.seek(time);
            }
        });

        document.addEventListener('mouseup', () => {
            if (seeking) {
                seeking = false;
            }
        });
    }

    setupMenu(menuType, callback) {
        const btn = this.elements[menuType + 'Btn'];
        const menu = this.elements['menu' + menuType.charAt(0).toUpperCase() + menuType.slice(1)];

        if (!btn || !menu) {
            console.warn('[UI] Menu not found:', menuType);
            return;
        }

        // Кнопка открытия меню
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = menu.classList.contains('active');
            this.closeAllMenus();
            if (!isActive) {
                menu.classList.add('active');
                console.log('[UI] Opened menu:', menuType);
            }
        });

        // Делегирование событий для элементов меню
        // Это позволяет обработчикам работать с динамически добавленными элементами
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.player-menu-item');
            if (!item) return;

            e.stopPropagation();
            const value = item.dataset.value;

            console.log('[UI] Menu item clicked:', menuType, value);

            // Убираем активный класс со всех элементов
            menu.querySelectorAll('.player-menu-item').forEach(i => {
                i.removeAttribute('data-active');
            });

            // Добавляем к выбранному
            item.setAttribute('data-active', 'true');

            // Вызываем callback
            callback(value);

            // Закрываем меню
            menu.classList.remove('active');
        });

        // Закрытие при клике вне меню
        document.addEventListener('click', () => this.closeAllMenus());
    }

    closeAllMenus() {
        document.querySelectorAll('.player-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    setupPlayerListeners() {
        // Play/Pause
        this.player.on('play', () => {
            this.container.classList.add('playing');
            this.container.classList.remove('paused');
            this.elements.playBtn.querySelector('span').textContent = 'pause';
            this.startProgressUpdate();
        });

        this.player.on('pause', () => {
            this.container.classList.remove('playing');
            this.container.classList.add('paused');
            this.elements.playBtn.querySelector('span').textContent = 'play_arrow';
            this.stopProgressUpdate();
        });

        // Time update
        this.player.on('timeupdate', () => {
            this.updateTimeDisplay();
        });

        // Metadata loaded
        this.player.on('loadedmetadata', () => {
            this.updateTimeDisplay();
        });

        // Volume
        this.player.on('volumechange', () => {
            this.updateVolumeUI();
        });

        // Quality
        this.player.on('manifestparsed', () => {
            this.updateQualityMenu();
        });

        // Audio tracks
        this.player.on('audiotracksupdate', (tracks) => {
            this.updateAudioMenu(tracks);
        });

        // Subtitles
        this.player.on('subtitlestracksupdate', (tracks) => {
            this.updateSubtitlesMenu(tracks);
        });

        // Progress
        this.player.on('progress', () => {
            this.updateBuffer();
        });

        // Loading
        this.player.on('waiting', () => {
            this.elements.spinner.classList.add('active');
        });

        this.player.on('playing', () => {
            this.elements.spinner.classList.remove('active');
            this.elements.errorPanel.classList.remove('active');
        });

        // Error handling
        this.player.on('error', (error) => {
            console.error('[UI] Плеер сообщил об ошибке:', error);
            this.elements.spinner.classList.remove('active');
            this.elements.errorPanel.classList.add('active');

            if (error.details === 'manifestLoadError') {
                this.elements.errorText.textContent = 'Ошибка: Файл видео не найден на сервере (404)';
            } else if (error.type === 'networkError') {
                this.elements.errorText.textContent = 'Ошибка сети: Проверьте интернет-соединение';
            } else {
                this.elements.errorText.textContent = 'Произошла ошибка при загрузке видео';
            }
        });

        this.elements.retryBtn.addEventListener('click', () => {
            this.elements.errorPanel.classList.remove('active');
            this.elements.spinner.classList.add('active');
            this.player.loadSource(this.player.hls ? this.player.sourceUrl : location.href);
        });
    }

    startProgressUpdate() {
        this.isUpdatingProgress = true;
        this.updateProgress();
    }

    stopProgressUpdate() {
        this.isUpdatingProgress = false;
    }

    updateProgress() {
        if (!this.isUpdatingProgress) return;

        const percent = (this.player.state.currentTime / this.player.state.duration) * 100;
        this.elements.progressPlayed.style.width = percent + '%';
        this.elements.progressScrubber.style.left = percent + '%';

        requestAnimationFrame(() => this.updateProgress());
    }

    updateBuffer() {
        const buffered = this.video.buffered;
        if (buffered.length > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            const percent = (bufferedEnd / this.player.state.duration) * 100;
            this.elements.progressBuffer.style.width = percent + '%';
        }
    }

    updateTimeDisplay() {
        this.elements.timeCurrent.textContent = this.formatTime(this.player.state.currentTime);
        this.elements.timeDuration.textContent = this.formatTime(this.player.state.duration);
    }

    updateVolumeUI() {
        const volume = this.player.state.volume;
        const muted = this.player.state.muted;

        this.elements.volumeSlider.value = volume * 100;

        const icon = this.elements.muteBtn.querySelector('span');
        if (muted || volume === 0) {
            icon.textContent = 'volume_off';
        } else if (volume < 0.5) {
            icon.textContent = 'volume_down';
        } else {
            icon.textContent = 'volume_up';
        }
    }

    updateQualityMenu() {
        const qualities = this.player.state.availableQualities;
        const menu = this.elements.menuQuality.querySelector('.player-menu-items');

        menu.innerHTML = '<div class="player-menu-item" data-value="-1" data-active="true">Auto</div>';

        qualities.forEach((quality, index) => {
            const item = document.createElement('div');
            item.className = 'player-menu-item';
            item.dataset.value = index;
            item.textContent = quality.label;
            menu.appendChild(item);
        });
    }

    updateAudioMenu(tracks) {
        if (!tracks || tracks.length === 0) return;

        const menu = this.elements.menuAudio.querySelector('.player-menu-items');
        menu.innerHTML = '';

        tracks.forEach((track) => {
            const item = document.createElement('div');
            item.className = 'player-menu-item';
            item.dataset.value = track.id;

            // Форматируем название дорожки
            let trackName = track.name || `Дорожка ${track.id + 1}`;
            if (track.lang) {
                trackName += ` (${track.lang})`;
            }
            if (track.codec) {
                trackName += ` - ${track.codec}`;
            }

            item.textContent = trackName;

            // Отмечаем активную дорожку
            if (track.id === this.player.hls?.audioTrack) {
                item.setAttribute('data-active', 'true');
            }

            menu.appendChild(item);
        });

        console.log('[UI] Audio menu updated:', tracks.length, 'tracks');
    }

    updateSubtitlesMenu(tracks) {
        if (!tracks || tracks.length === 0) {
            console.log('[UI] No subtitles available');
            return;
        }

        const menu = this.elements.menuSubtitles.querySelector('.player-menu-items');
        menu.innerHTML = '<div class="player-menu-item" data-value="-1" data-active="true">Выключено</div>';

        tracks.forEach((track) => {
            const item = document.createElement('div');
            item.className = 'player-menu-item';
            item.dataset.value = track.id;

            //Форматируем название субтитров
            let trackName = track.label || `Track ${track.id + 1}`;
            if (track.language && track.language !== 'unknown') {
                trackName += ` (${track.language})`;
            }

            item.textContent = trackName;

            // Отмечаем активную дорожку
            if (this.player.subtitles && track.id === this.player.subtitles.currentTrackId) {
                item.setAttribute('data-active', 'true');
                // Убираем active у "Выключено"
                menu.querySelector('[data-value="-1"]').removeAttribute('data-active');
            }

            menu.appendChild(item);
        });

        console.log('[UI] Subtitles menu updated:', tracks.length, 'tracks');
    }

    toggleTheater() {
        this.container.classList.toggle('theater-mode');
        const icon = this.elements.theaterBtn.querySelector('span');
        icon.textContent = this.container.classList.contains('theater-mode') ?
            'rectangle' : 'rectangle';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen();
            this.elements.fullscreenBtn.querySelector('span').textContent = 'fullscreen_exit';
        } else {
            document.exitFullscreen();
            this.elements.fullscreenBtn.querySelector('span').textContent = 'fullscreen';
        }
    }

    setupAutoHide() {
        let timeout;

        const show = () => {
            this.elements.overlay.classList.add('visible');
            clearTimeout(timeout);

            if (this.player.state.isPlaying) {
                timeout = setTimeout(() => {
                    this.elements.overlay.classList.remove('visible');
                }, 3000);
            }
        };

        this.container.addEventListener('mousemove', show);
        this.container.addEventListener('mouseenter', show);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.player.togglePlay();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    this.player.toggleMute();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.player.seek(this.player.state.currentTime - 5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.player.seek(this.player.state.currentTime + 5);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.player.setVolume(Math.min(1, this.player.state.volume + 0.1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.player.setVolume(Math.max(0, this.player.state.volume - 0.1));
                    break;
            }
        });
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    setTitle(title) {
        this.elements.title.textContent = title;
    }
}

// Ensure it's available globally in the browser
if (typeof window !== 'undefined') {
    window.PlayerUI = PlayerUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerUI;
}
