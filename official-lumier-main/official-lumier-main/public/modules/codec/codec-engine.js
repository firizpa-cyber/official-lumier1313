/**
 * Professional Video Player - Codec Engine
 * Handles codec detection, support verification, and format management
 */

class CodecEngine {
    constructor(player) {
        this.player = player;
        this.supportedCodecs = {
            video: {},
            audio: {}
        };
        this.init();
    }

    init() {
        this.detectSupport();
    }

    /**
     * Detect browser support for various codecs
     */
    detectSupport() {
        const videoTypes = {
            'h264': 'video/mp4; codecs="avc1.42E01E"',
            'h265': 'video/mp4; codecs="hev1.1.6.L93.B0"',
            'vp9': 'video/webm; codecs="vp9"',
            'av1': 'video/mp4; codecs="av01.0.05M.08"'
        };

        const audioTypes = {
            'aac': 'audio/mp4; codecs="mp4a.40.2"',
            'mp3': 'audio/mpeg',
            'ogg': 'audio/ogg; codecs="vorbis"',
            'flac': 'audio/flac',
            'opus': 'audio/ogg; codecs="opus"',
            'wav': 'audio/wav'
        };

        // Check Video Support
        for (const [name, type] of Object.entries(videoTypes)) {
            this.supportedCodecs.video[name] = this.checkType(type);
        }

        // Check Audio Support
        for (const [name, type] of Object.entries(audioTypes)) {
            this.supportedCodecs.audio[name] = this.checkType(type);
        }

        console.log('[CodecEngine] Supported Codecs:', this.supportedCodecs);
    }

    checkType(type) {
        const video = document.createElement('video');
        return video.canPlayType(type).replace(/^no$/, '') !== '';
    }

    /**
     * Get codec info for display
     */
    getCodecInfo(codecString) {
        if (!codecString) return { type: 'unknown', name: 'Unknown' };

        codecString = codecString.toLowerCase();

        // Audio Codecs
        if (codecString.includes('mp4a') || codecString.includes('aac')) return { type: 'audio', name: 'AAC (Lossy)', family: 'aac' };
        if (codecString.includes('ac-3') || codecString.includes('ac3')) return { type: 'audio', name: 'AC-3 (Dolby)', family: 'ac3' };
        if (codecString.includes('ec-3') || codecString.includes('eac3')) return { type: 'audio', name: 'E-AC-3 (Dolby+)', family: 'eac3' };
        if (codecString.includes('mp3')) return { type: 'audio', name: 'MP3 (Lossy)', family: 'mp3' };
        if (codecString.includes('vorbis')) return { type: 'audio', name: 'Vorbis (Lossy)', family: 'vorbis' };
        if (codecString.includes('opus')) return { type: 'audio', name: 'Opus (Lossy)', family: 'opus' };
        if (codecString.includes('flac')) return { type: 'audio', name: 'FLAC (Lossless)', family: 'flac' };
        if (codecString.includes('alac')) return { type: 'audio', name: 'ALAC (Lossless)', family: 'alac' };
        if (codecString.includes('ape')) return { type: 'audio', name: 'Monkey\'s Audio (Lossless)', family: 'ape' };
        if (codecString.includes('wv')) return { type: 'audio', name: 'WavPack (Lossless)', family: 'wv' };

        // Video Codecs
        if (codecString.includes('avc1') || codecString.includes('h264')) return { type: 'video', name: 'H.264 / AVC', family: 'h264' };
        if (codecString.includes('hev1') || codecString.includes('hvc1') || codecString.includes('h265')) return { type: 'video', name: 'H.265 / HEVC', family: 'h265' };
        if (codecString.includes('vp9')) return { type: 'video', name: 'VP9', family: 'vp9' };
        if (codecString.includes('av01') || codecString.includes('av1')) return { type: 'video', name: 'AV1', family: 'av1' };

        return { type: 'unknown', name: codecString, family: 'unknown' };
    }

    /**
     * Check if a specific audio format requires transcoding
     */
    requiresTranscoding(format) {
        const unsupported = ['ape', 'wv', 'wma']; // Monkey's Audio, WavPack, WMA usually need transcoding
        return unsupported.includes(format);
    }
}
