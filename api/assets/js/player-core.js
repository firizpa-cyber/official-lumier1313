/**
 * Professional Video Player - Core
 * YouTube-Style Optimization
 * 
 * @version 3.0.0 - YouTube Optimized
 * @license MIT
 */

class ProVideoPlayer {
    constructor(config = {}) {
        this.config = {
            videoElement: config.videoElement || 'video',
            container: config.container || null,
            autoplay: config.autoplay || false,
            onReady: config.onReady || null,
            onError: config.onError || null,
        };

        this.video = typeof this.config.videoElement === 'string'
            ? document.getElementById(this.config.videoElement)
            : this.config.videoElement;

        if (!this.video) throw new Error('Видео элемент не найден');

        this.container = this.config.container
            ? (typeof this.config.container === 'string'
                ? document.getElementById(this.config.container)
                : this.config.container)
            : this.video.parentElement;

        this.state = {
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 1,
            muted: false,
            quality: 'auto',
            currentQuality: null,
            availableQualities: [],
            buffered: [],
        };

        this.hls = null;
        this.dash = null;
        this.currentEngine = null;
        this.eventHandlers = new Map();

        this.init();
    }

    init() {
        this.setupVideoListeners();
        if (this.config.onReady) this.config.onReady(this);
        this.emit('ready');
    }

    setupVideoListeners() {
        this.video.addEventListener('play', () => {
            this.state.isPlaying = true;
            this.emit('play');
        });

        this.video.addEventListener('pause', () => {
            this.state.isPlaying = false;
            this.emit('pause');
        });

        this.video.addEventListener('timeupdate', () => {
            this.state.currentTime = this.video.currentTime;
            this.emit('timeupdate', this.state.currentTime);
        });

        this.video.addEventListener('loadedmetadata', () => {
            this.state.duration = this.video.duration;
            this.emit('loadedmetadata');
        });

        this.video.addEventListener('volumechange', () => {
            this.state.volume = this.video.volume;
            this.state.muted = this.video.muted;
            this.emit('volumechange');
        });

        this.video.addEventListener('progress', () => {
            this.updateBuffered();
            this.emit('progress');
        });

        this.video.addEventListener('waiting', () => this.emit('waiting'));
        this.video.addEventListener('playing', () => this.emit('playing'));

        this.video.addEventListener('error', (e) => {
            const error = { code: this.video.error?.code, message: this.video.error?.message };
            if (this.config.onError) this.config.onError(error);
            this.emit('error', error);
        });
    }

    loadSource(url, type = 'auto') {
        if (type === 'auto') type = this.detectSourceType(url);
        console.log(`[Player] Загрузка: ${url} (${type})`);

        this.cleanup();

        switch (type) {
            case 'hls': this.loadHLS(url); break;
            case 'dash': this.loadDASH(url); break;
            default: this.loadNative(url); break;
        }

        this.emit('sourcechange', { url, type });
    }

    detectSourceType(url) {
        if (url.includes('proxy.php?url=')) {
            try {
                const match = url.match(/[?&]url=([^&]+)/);
                if (match) return this.detectSourceType(decodeURIComponent(match[1]));
            } catch (e) { }
        }

        const ext = url.split('?')[0].split('.').pop().toLowerCase();
        if (ext === 'm3u8') return 'hls';
        if (ext === 'mpd') return 'dash';
        if (ext === 'mp4' || ext === 'webm') return ext;
        return 'unknown';
    }

    loadHLS(url) {
        // Validate URL
        if (!url || typeof url !== 'string') {
            console.error('[Player] Невалидный URL:', url);
            return;
        }

        if (!window.Hls) {
            console.error('[Player] HLS.js не загружен');
            return;
        }

        if (!Hls.isSupported()) {
            if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
                this.loadNative(url);
                return;
            }
            console.error('[Player] HLS не поддерживается');
            return;
        }

        // Кастомный загрузчик с прокси
        class ProxyLoader extends Hls.DefaultConfig.loader {
            constructor(config) {
                super(config);
            }

            load(context, config, callbacks) {
                const originalUrl = context.url;

                if (!originalUrl.includes('localhost') && !originalUrl.includes('127.0.0.1') && !originalUrl.includes('proxy.php')) {
                    context.url = './proxy.php?url=' + encodeURIComponent(originalUrl);
                }

                const originalOnSuccess = callbacks.onSuccess;
                callbacks.onSuccess = (response, stats, ctx) => {
                    response.url = originalUrl;
                    originalOnSuccess(response, stats, ctx);
                };

                super.load(context, config, callbacks);
            }
        }

        // Сохраняем source URL для возможной перезагрузки
        this.sourceUrl = url;
        if (url.includes('proxy.php?url=')) {
            const match = url.match(/[?&]url=([^&]+)/);
            if (match) this.sourceUrl = decodeURIComponent(match[1]);
        }

        // ========================================
        // YOUTUBE-STYLE КОНФИГУРАЦИЯ HLS
        // Плавное переключение + стабильность
        // ========================================
        this.hls = new Hls({
            // Общие настройки
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,

            // БУФЕРИЗАЦИЯ (YouTube: 30s вперед, 30s назад)
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 100 * 1000 * 1000,
            backBufferLength: 30,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,

            // ПЛАВНОЕ ПЕРЕКЛЮЧЕНИЕ КАЧЕСТВА
            abrEwmaDefaultEstimate: 500000,
            abrEwmaSlowVoD: 3,
            abrEwmaFastVoD: 3,
            abrBandWidthFactor: 0.95,
            abrBandWidthUpFactor: 0.7,
            abrMaxWithRealBitrate: true,

            // Качество
            startLevel: -1,
            autoLevelCapping: -1,
            minAutoBitrate: 0,
            capLevelToPlayerSize: false,

            // ЗАГРУЗКА СЕГМЕНТОВ
            startFragPrefetch: true,
            progressive: true,

            // Таймауты
            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 4,
            manifestLoadingRetryDelay: 1000,
            manifestLoadingMaxRetryTimeout: 64000,

            levelLoadingTimeOut: 10000,
            levelLoadingMaxRetry: 4,
            levelLoadingRetryDelay: 1000,
            levelLoadingMaxRetryTimeout: 64000,

            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1000,
            fragLoadingMaxRetryTimeout: 64000,

            // ОБРАБОТКА ОШИБОК
            appendErrorMaxRetry: 3,
            maxLoadingDelay: 4,
            maxStarvationDelay: 4,

            // SEEK И ПЕРЕМОТКА
            seekHoleNudgeDuration: 0.1,
            maxSeekHole: 2,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 3,

            // FPS
            maxFragLookUpTolerance: 0.25,
            maxAudioFramesDrift: 1,

            // ПРОКСИ
            loader: ProxyLoader
        });

        console.log('[Player] Загрузка HLS (YouTube-optimized):', this.sourceUrl);
        this.hls.loadSource(url);
        this.hls.attachMedia(this.video);

        // События HLS
        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log('[Player] ✅ Манифест распарсен', data);
            this.updateQualities(data.levels);
            this.emit('manifestparsed', data);
            if (this.config.autoplay) this.play();
        });

        this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
            console.log('[Player] 🎵 Аудио-дорожки обновлены:', data.audioTracks.length);
            if (this.audio) {
                this.audio.updateTracks(data);
            }
            this.emit('audiotracksupdate', data.audioTracks);
        });

        this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            const level = this.hls.levels[data.level];
            this.state.currentQuality = {
                height: level.height,
                bitrate: level.bitrate,
                codec: level.codecSet
            };
            console.log(`[Player] 🎬 Качество: ${level.height}p, ${(level.bitrate / 1000).toFixed(0)} kbps`);
            this.emit('qualitychange', this.state.currentQuality);
        });

        this.hls.on(Hls.Events.ERROR, (event, data) => {
            // Игнорируем битые audio плейлисты
            if (data.details === 'levelParsingError' && data.url && data.url.includes('audio')) {
                console.warn('[Player] ⚠ Битый audio плейлист, игнорируем:', data.url);
                return;
            }

            console.error('[Player] ❌ HLS Ошибка:', data);

            // Обработка фатальных ошибок
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        // Игнорируем ошибки парсинга уровней (битые плейлисты)
                        if (data.details === 'levelParsingError') {
                            console.log('[Player] Ошибка парсинга уровня, пропускаем');
                            return;
                        }
                        console.log('[Player] 🔄 Сетевая ошибка, восстановление...');
                        this.hls.startLoad();
                        break;

                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('[Player] 🔄 Медиа ошибка, восстановление...');
                        this.hls.recoverMediaError();
                        break;

                    default:
                        console.error('[Player] ❌ Фатальная ошибка');
                        this.emit('error', data);
                        break;
                }
            }
            // Обработка non-fatal ошибок
            else {
                switch (data.details) {
                    case 'bufferStalledError':
                        console.log('[Player] ⏸ Буфер застрял, попытка восстановления...');
                        if (this.hls.currentLevel > 0) {
                            const newLevel = Math.max(0, this.hls.currentLevel - 1);
                            console.log(`[Player] Понижение качества: ${this.hls.levels[this.hls.currentLevel].height}p → ${this.hls.levels[newLevel].height}p`);
                            this.hls.currentLevel = newLevel;
                        }
                        this.hls.startLoad();
                        break;

                    case 'bufferAppendingError':
                        console.log('[Player] 🔄 Ошибка добавления буфера, retry...');
                        break;

                    case 'fragLoadError':
                        console.log('[Player] 🔄 Ошибка загрузки сегмента, retry...');
                        break;

                    default:
                        console.warn('[Player] ⚠ Non-fatal ошибка:', data.details);
                }
            }

            this.emit('error', data);
        });

        this.currentEngine = 'hls';
    }

    loadDASH(url) {
        if (!window.dashjs) {
            console.error('[Player] Dash.js не загружен');
            return;
        }

        this.dash = dashjs.MediaPlayer().create();
        this.dash.initialize(this.video, url, this.config.autoplay);

        this.dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
            console.log('[Player] DASH инициализирован');
            this.emit('manifestparsed');
        });

        this.currentEngine = 'dash';
    }

    loadNative(url) {
        this.video.src = url;
        this.currentEngine = 'native';
        if (this.config.autoplay) this.play();
    }

    updateQualities(levels) {
        this.state.availableQualities = levels.map((level, index) => ({
            index,
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
            codec: level.codecSet,
            label: `${level.height}p`
        }));
        console.log('[Player] 📊 Доступные качества:', this.state.availableQualities.map(q => q.label).join(', '));
    }

    updateBuffered() {
        const buffered = [];
        for (let i = 0; i < this.video.buffered.length; i++) {
            buffered.push({
                start: this.video.buffered.start(i),
                end: this.video.buffered.end(i)
            });
        }
        this.state.buffered = buffered;
    }

    // ========================================
    // PUBLIC API
    // ========================================

    play() {
        return this.video.play();
    }

    pause() {
        this.video.pause();
    }

    togglePlay() {
        this.state.isPlaying ? this.pause() : this.play();
    }

    seek(time) {
        this.video.currentTime = time;
    }

    setVolume(volume) {
        this.video.volume = Math.max(0, Math.min(1, volume));
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
    }

    setPlaybackRate(rate) {
        this.video.playbackRate = rate;
    }

    setQuality(index) {
        if (this.hls) {
            console.log('[Player] 🎬 Установка качества:', index, this.hls.levels[index]);
            this.hls.currentLevel = index;
        } else {
            console.warn('[Player] HLS не инициализирован');
        }
    }

    setAutoQuality() {
        if (this.hls) {
            console.log('[Player] 🎬 Автоматическое качество');
            this.hls.currentLevel = -1;
        } else {
            console.warn('[Player] HLS не инициализирован');
        }
    }

    getState() {
        return { ...this.state };
    }

    // ========================================
    // EVENT SYSTEM
    // ========================================

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    off(event, handler) {
        if (!this.eventHandlers.has(event)) return;
        const handlers = this.eventHandlers.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
    }

    emit(event, data) {
        if (!this.eventHandlers.has(event)) return;
        this.eventHandlers.get(event).forEach(handler => handler(data));
    }

    // ========================================
    // CLEANUP
    // ========================================

    cleanup() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        if (this.dash) {
            this.dash.reset();
            this.dash = null;
        }
    }

    destroy() {
        this.cleanup();
        this.video.removeAttribute('src');
        this.video.load();
        this.eventHandlers.clear();
    }
}

// Export для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProVideoPlayer;
}
