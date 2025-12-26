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
        this.playPromise = null;  // Для отслеживания промиса play()

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
        if (url.includes('/api/proxy?url=')) {
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

                if (!originalUrl.includes('localhost') &&
                    !originalUrl.includes('127.0.0.1') &&
                    !originalUrl.includes('/api/proxy') &&
                    !originalUrl.includes('/api/cors-proxy')) {

                    // Use cors-proxy for playlists and regular proxy for segments
                    const isPlaylist = originalUrl.includes('.m3u8');
                    const proxyPath = isPlaylist ? '/api/cors-proxy' : '/api/proxy';

                    context.url = window.location.origin + proxyPath + '?url=' + encodeURIComponent(originalUrl);
                    console.log(`[Proxy] ${originalUrl} -> ${context.url}`);
                }

                const originalOnSuccess = callbacks.onSuccess;
                callbacks.onSuccess = (response, stats, ctx) => {
                    // НЕ меняем response.url - HLS.js должен использовать proxy URL
                    // response.url = originalUrl;
                    originalOnSuccess(response, stats, ctx);
                };

                super.load(context, config, callbacks);
            }
        }

        // Сохраняем source URL для возможной перезагрузки
        this.sourceUrl = url;
        if (url.includes('/api/proxy?url=')) {
            const match = url.match(/[?&]url=([^&]+)/);
            if (match) this.sourceUrl = decodeURIComponent(match[1]);
        }

        // ========================================
        // ULTRA-FAST КОНФИГУРАЦИЯ HLS
        // Максимальная скорость старта
        // ========================================
        this.hls = new Hls({
            // Общие настройки
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,

            // БУФЕРИЗАЦИЯ (Минимальная для мгновенного старта)
            maxBufferLength: 10,  // Уменьшено для быстрого старта
            maxMaxBufferLength: 30,  // Уменьшено
            maxBufferSize: 60 * 1024 * 1024,
            backBufferLength: 5,  // Минимум
            maxBufferHole: 0.5,  // Меньше дырки
            highBufferWatchdogPeriod: 1,

            // МГНОВЕННЫЙ СТАРТ
            startFragPrefetch: true,  // Префетч первого сегмента
            testBandwidth: false,  // Пропускаем тест
            progressive: true,  // Прогрессивная загрузка

            // КАЧЕСТВО (Быстрый старт с низкого)
            startLevel: 0,  // Начинаем с НИЗШЕГО качества для мгновенного старта
            autoLevelCapping: -1,
            minAutoBitrate: 0,
            capLevelToPlayerSize: false,  // Отключаем ограничение

            // ABR (Быстрое переключение вверх)
            abrEwmaDefaultEstimate: 5000000,  // Высокая начальная оценка (5mbps)
            abrEwmaSlowVoD: 1,  // Быстрая реакция
            abrEwmaFastVoD: 1,
            abrBandWidthFactor: 0.8,
            abrBandWidthUpFactor: 0.7,  // Быстрее повышаем качество
            abrMaxWithRealBitrate: false,

            // ТАЙМАУТЫ (Очень быстрые)
            manifestLoadingTimeOut: 5000,  // Быстрее
            manifestLoadingMaxRetry: 2,
            manifestLoadingRetryDelay: 300,

            levelLoadingTimeOut: 5000,
            levelLoadingMaxRetry: 2,
            levelLoadingRetryDelay: 300,

            fragLoadingTimeOut: 10000,
            fragLoadingMaxRetry: 6,  // Больше попыток
            fragLoadingRetryDelay: 300,

            // МАКСИМАЛЬНОЕ КОЛИЧЕСТВО ПАРАЛЛЕЛЬНЫХ ЗАГРУЗОК
            maxFragLookUpTolerance: 0.1,

            // ОБРАБОТКА ОШИБОК
            appendErrorMaxRetry: 5,
            maxLoadingDelay: 1,
            maxStarvationDelay: 1,

            // SEEK
            seekHoleNudgeDuration: 0.05,
            maxSeekHole: 1,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 15,

            // PROXY для решения Mixed Content (HTTPS → HTTP)
            // Необходим когда страница загружена через HTTPS (Cloudflare)
            // а источник работает только по HTTP
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

            // Автоплей только если включен в конфиге
            if (this.config.autoplay) {
                this.play().catch(error => {
                    // Если браузер блокирует автоплей - показываем предупреждение
                    if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
                        console.error('[Player] Ошибка автоплея:', error);
                    } else {
                        console.warn('[Player] Автоплей заблокирован браузером. Нажмите Play для начала воспроизведения.');
                    }
                });
            }
        });

        this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
            console.log('[Player] 🎵 Аудио-дорожки обновлены:', data.audioTracks.length);
            this.state.availableAudioTracks = data.audioTracks;
            this.emit('audiotracksupdate', data.audioTracks);
        });

        this.hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
            console.log('[Player] 🎵 Аудио-дорожка переключена на:', data.id);
            this.emit('audiotrackchange', data.id);
        });

        this.hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
            console.log('[Player] 📝 Субтитры обновлены:', data.subtitleTracks.length);
            this.state.availableSubtitleTracks = data.subtitleTracks;
            this.emit('subtitletracksupdate', data.subtitleTracks);
        });

        this.hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (event, data) => {
            console.log('[Player] 📝 Субтитры переключены на:', data.id);
            this.emit('subtitletrackchange', data.id);
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
        // Отменяем предыдущий промис play если он есть
        if (this.playPromise) {
            this.playPromise.catch(() => { });
        }

        this.playPromise = this.video.play();

        if (this.playPromise !== undefined) {
            this.playPromise
                .then(() => {
                    this.playPromise = null;
                })
                .catch(error => {
                    this.playPromise = null;
                    // Игнорируем AbortError (прерывание воспроизведения)
                    if (error.name !== 'AbortError') {
                        console.error('[Player] Play error:', error);
                    }
                });
        }

        return this.playPromise;
    }

    pause() {
        // Ждем завершения play() перед паузой
        if (this.playPromise) {
            this.playPromise
                .then(() => {
                    this.video.pause();
                })
                .catch(() => {
                    // Play был отменен, можно безопасно вызвать pause
                    this.video.pause();
                });
        } else {
            this.video.pause();
        }
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
            console.log('[Player] 🎬 Установка качества (smooth):', index);
            // Используем nextLevel вместо currentLevel для плавного переключения
            // currentLevel вызывает немедленный сброс буфера (лаг)
            // nextLevel переключает качество для следующего загружаемого сегмента
            this.hls.nextLevel = index;
        }
    }

    setAutoQuality() {
        if (this.hls) {
            console.log('[Player] 🎬 Установка Auto качества (smooth)');
            this.hls.nextLevel = -1;
        }
    }

    // Audio & Subtitles
    setAudioTrack(index) {
        const idx = parseInt(index);
        console.log(`[Player] 🎵 Запрос на переключение аудио: ${idx}`);

        if (this.hls) {
            if (!this.hls.audioTracks || this.hls.audioTracks.length === 0) {
                console.warn('[Player] ⚠ Нет доступных аудио дорожек');
                return;
            }

            if (idx >= 0 && idx < this.hls.audioTracks.length) {
                console.log(`[Player] 🎵 Переключение аудио трека на индекс: ${idx}`);
                this.hls.audioTrack = idx;
            } else {
                console.warn(`[Player] ⚠ Неверный индекс аудио: ${idx}. Доступно: 0-${this.hls.audioTracks.length - 1}`);
            }
        } else {
            console.warn('[Player] ⚠ HLS не активен для переключения аудио');
        }
    }

    setSubtitleTrack(index) {
        const idx = parseInt(index);
        console.log(`[Player] 📝 Запрос на переключение субтитров: ${idx}`);

        if (this.hls) {
            // Индекс -1 означает выключение субтитров
            this.hls.subtitleTrack = idx;
            console.log(`[Player] 📝 Субтитры переключены на: ${idx}`);
        } else {
            console.warn('[Player] ⚠ HLS не активен для переключения субтитров');
        }
    }

    getAudioTracks() {
        return this.hls ? this.hls.audioTracks : [];
    }

    getSubtitleTracks() {
        return this.hls ? this.hls.subtitleTracks : [];
    }

    getState() {
        return {
            ...this.state,
            audioTracks: this.getAudioTracks(),
            subtitleTracks: this.getSubtitleTracks(),
            currentAudioTrack: this.hls ? this.hls.audioTrack : -1,
            currentSubtitleTrack: this.hls ? this.hls.subtitleTrack : -1
        };
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

window.ProVideoPlayer = ProVideoPlayer;

// Export для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProVideoPlayer;
}
