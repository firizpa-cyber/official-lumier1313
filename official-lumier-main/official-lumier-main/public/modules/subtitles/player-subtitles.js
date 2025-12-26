/**
 * Player Subtitles Module
 * Управление субтитрами и текстовыми дорожками
 */

class PlayerSubtitles {
    constructor(player) {
        this.player = player;
        this.video = player.video;
        this.tracks = [];
        this.currentTrackId = -1; // -1 = выключено
        this.externalTracks = [];

        this.init();
    }

    init() {
        console.log('[PlayerSubtitles] Инициализация');

        // Слушаем события HLS для субтитров
        if (this.player.hls) {
            this.setupHLSListeners();
        }

        // Слушаем события изменения текстовых дорожек
        this.video.textTracks.addEventListener('change', () => {
            this.onTrackChange();
        });
    }

    setupHLSListeners() {
        // HLS.js автоматически создаёт текстовые дорожки из манифеста
        this.player.on('manifestparsed', () => {
            setTimeout(() => this.updateTracks(), 100);
        });
    }

    /**
     * Обновить список доступных субтитров
     */
    updateTracks() {
        this.tracks = [];

        // Получаем все текстовые дорожки из video element
        const textTracks = Array.from(this.video.textTracks);

        textTracks.forEach((track, index) => {
            // Пропускаем metadata дорожки
            if (track.kind === 'metadata') return;

            this.tracks.push({
                id: index,
                kind: track.kind,
                label: track.label || `Track ${index + 1}`,
                language: track.language || 'unknown',
                mode: track.mode,
                original: track
            });
        });

        console.log('[PlayerSubtitles] Субтитры обновлены:', this.tracks);
        this.player.emit('subtitlestracksupdate', this.tracks);

        // Определяем текущую активную дорожку
        this.currentTrackId = this.getCurrentTrackId();
    }

    /**
     * Получить ID текущей активной дорожки
     */
    getCurrentTrackId() {
        const textTracks = Array.from(this.video.textTracks);
        for (let i = 0; i < textTracks.length; i++) {
            if (textTracks[i].mode === 'showing') {
                return i;
            }
        }
        return -1; // Выключено
    }

    /**
     * Включить дорожку по ID
     */
    setTrack(trackId) {
        console.log('[PlayerSubtitles] Установка дорожки:', trackId);

        const textTracks = Array.from(this.video.textTracks);

        // Выключаем все дорожки
        textTracks.forEach(track => {
            if (track.kind !== 'metadata') {
                track.mode = 'disabled';
            }
        });

        // Включаем выбранную дорожку
        if (trackId >= 0 && trackId < textTracks.length) {
            textTracks[trackId].mode = 'showing';
            this.currentTrackId = trackId;
            console.log('[PlayerSubtitles] ✅ Дорожка активирована:', this.tracks[trackId]);
        } else {
            this.currentTrackId = -1;
            console.log('[PlayerSubtitles] ✅ Субтитры выключены');
        }

        this.player.emit('subtitletrackchange', this.getCurrentTrack());
    }

    /**
     * Выключить субтитры
     */
    disable() {
        this.setTrack(-1);
    }

    /**
     * Получить текущую дорожку
     */
    getCurrentTrack() {
        if (this.currentTrackId === -1) {
            return null;
        }
        return this.tracks[this.currentTrackId] || null;
    }

    /**
     * Получить все дорожки
     */
    getTracks() {
        return this.tracks;
    }

    /**
     * Добавить внешнюю дорожку субтитров
     */
    addExternalTrack(url, options = {}) {
        const {
            label = 'External',
            language = 'en',
            kind = 'subtitles',
            isDefault = false
        } = options;

        console.log('[PlayerSubtitles] Добавление внешней дорожки:', url);

        const track = this.video.addTextTrack(kind, label, language);
        track.mode = isDefault ? 'showing' : 'disabled';

        // Загружаем VTT файл
        this.loadVTT(url, track);

        this.externalTracks.push({
            url,
            label,
            language,
            kind,
            track
        });

        // Обновляем список
        setTimeout(() => this.updateTracks(), 100);
    }

    /**
     * Загрузить VTT файл
     */
    async loadVTT(url, track) {
        try {
            const response = await fetch(url);
            const text = await response.text();

            // Парсим VTT
            this.parseVTT(text, track);

            console.log('[PlayerSubtitles] ✅ VTT загружен:', url);
        } catch (error) {
            console.error('[PlayerSubtitles] ❌ Ошибка загрузки VTT:', error);
        }
    }

    /**
     * Парсинг VTT формата
     */
    parseVTT(vttText, track) {
        const lines = vttText.split('\n');
        let currentCue = null;
        let cueText = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Пропускаем заголовок WEBVTT
            if (line.startsWith('WEBVTT')) continue;
            if (line === '') {
                if (currentCue && cueText.length > 0) {
                    // Добавляем cue
                    try {
                        const cue = new VTTCue(
                            currentCue.startTime,
                            currentCue.endTime,
                            cueText.join('\n')
                        );
                        track.addCue(cue);
                    } catch (e) {
                        console.warn('[PlayerSubtitles] Ошибка создания cue:', e);
                    }
                    currentCue = null;
                    cueText = [];
                }
                continue;
            }

            // Парсим временные метки
            const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
            if (timeMatch) {
                currentCue = {
                    startTime: this.parseTimestamp(timeMatch[1]),
                    endTime: this.parseTimestamp(timeMatch[2])
                };
            } else if (currentCue) {
                // Текст субтитра
                cueText.push(line);
            }
        }

        // Добавляем последний cue
        if (currentCue && cueText.length > 0) {
            try {
                const cue = new VTTCue(
                    currentCue.startTime,
                    currentCue.endTime,
                    cueText.join('\n')
                );
                track.addCue(cue);
            } catch (e) {
                console.warn('[PlayerSubtitles] Ошибка создания последнего cue:', e);
            }
        }
    }

    /**
     * Парсинг временной метки
     */
    parseTimestamp(timestamp) {
        const parts = timestamp.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const secondsParts = parts[2].split('.');
        const seconds = parseInt(secondsParts[0]);
        const milliseconds = parseInt(secondsParts[1]);

        return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    }

    /**
     * Обработка изменения дорожки
     */
    onTrackChange() {
        const newTrackId = this.getCurrentTrackId();
        if (newTrackId !== this.currentTrackId) {
            this.currentTrackId = newTrackId;
            console.log('[PlayerSubtitles] Дорожка изменена:', this.currentTrackId);
            this.player.emit('subtitletrackchange', this.getCurrentTrack());
        }
    }

    /**
     * Очистка
     */
    destroy() {
        this.tracks = [];
        this.externalTracks = [];
        this.currentTrackId = -1;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerSubtitles;
}
