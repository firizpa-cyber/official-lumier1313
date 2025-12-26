/**
 * Professional Video Player - Audio Module
 * Handles audio context, track switching, and advanced audio features
 */

class PlayerAudio {
    constructor(player) {
        this.player = player;
        this.context = null;
        this.gainNode = null;
        this.sourceNode = null;
        this.isUnlocked = false;
        this.tracks = [];
        this.currentTrackId = -1;

        this.init();
    }

    init() {
        this.setupContext();
        this.setupListeners();
    }

    /**
     * Initialize Web Audio API context (lazy - only when needed)
     */
    setupContext() {
        // Don't create AudioContext immediately - will be created on first user interaction
        // This avoids "AudioContext was not allowed to start" error
        console.log('[PlayerAudio] AudioContext setup deferred until first user interaction');
    }

    /**
     * Create AudioContext (called on first user interaction)
     */
    createContext() {
        if (this.context) return; // Already created

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.context = new AudioContext();
                this.gainNode = this.context.createGain();
                this.gainNode.connect(this.context.destination);
                console.log('[PlayerAudio] AudioContext created:', this.context.state);
                this.isUnlocked = true;
            }
        } catch (e) {
            console.warn('[PlayerAudio] Web Audio API not supported', e);
        }
    }

    /**
     * Connect video element to AudioContext
     * NOTE: Disabled to avoid CORS issues with cross-origin video streams
     * The browser's native audio path works fine without Web Audio API routing
     */
    connectVideo() {
        // Commented out to prevent CORS errors
        // This is not needed for basic audio playback
        /*
        if (!this.context || this.sourceNode) return;

        try {
            this.sourceNode = this.context.createMediaElementSource(this.player.video);
            this.sourceNode.connect(this.gainNode);
            console.log('[PlayerAudio] Video connected to AudioContext');
        } catch (e) {
            console.warn('[PlayerAudio] Failed to connect media element source (CORS?)', e);
        }
        */
        console.log('[PlayerAudio] connectVideo skipped (using native audio path)');
    }

    setupListeners() {
        // Unlock audio on first interaction
        const unlockHandler = () => {
            this.unlockAudio();
            ['click', 'touchstart', 'keydown'].forEach(e =>
                document.removeEventListener(e, unlockHandler)
            );
        };

        ['click', 'touchstart', 'keydown'].forEach(e =>
            document.addEventListener(e, unlockHandler)
        );

        // Listen for player events
        this.player.on('manifestparsed', (data) => this.updateTracks(data));
        this.player.on('play', () => this.resumeContext());
    }

    /**
     * Resume AudioContext if suspended (browser policy)
     */
    async resumeContext() {
        // Create context if not exists
        if (!this.context) {
            this.createContext();
        }

        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
            console.log('[PlayerAudio] AudioContext resumed');
        }
    }

    /**
     * Unlock audio context (fix for "no sound" issues)
     */
    unlockAudio() {
        // Create AudioContext if not exists (first user interaction)
        if (!this.context) {
            this.createContext();
        }

        if (this.isUnlocked || !this.context) return;

        if (this.context.state === 'suspended') {
            this.context.resume().then(() => {
                this.isUnlocked = true;
                console.log('[PlayerAudio] Audio unlocked, state:', this.context.state);
            });
        } else {
            this.isUnlocked = true;
            console.log('[PlayerAudio] Audio already unlocked, state:', this.context.state);
        }
    }

    /**
     * Update available audio tracks from manifest
     */
    updateTracks(data) {
        this.tracks = [];

        // HLS Tracks
        if (this.player.hls && this.player.hls.audioTracks) {
            this.tracks = this.player.hls.audioTracks.map(track => ({
                id: track.id,
                name: track.name,
                lang: track.lang,
                codec: this.player.codecEngine ?
                    this.player.codecEngine.getCodecInfo(track.audioCodec || '').name :
                    (track.audioCodec || 'Unknown'),
                bitrate: track.bitrate,
                original: track
            }));
        }
        // DASH Tracks (simplified)
        else if (this.player.dash) {
            const tracks = this.player.dash.getTracksFor('audio');
            this.tracks = tracks.map((track, index) => ({
                id: index,
                name: track.lang || `Track ${index + 1}`,
                lang: track.lang,
                codec: track.codec,
                bitrate: track.bitrate,
                original: track
            }));
        }

        console.log('[PlayerAudio] Audio tracks updated:', this.tracks);
        this.player.emit('audiotracksupdate', this.tracks);

        // Set initial track
        if (this.tracks.length > 0) {
            this.currentTrackId = this.player.hls ? this.player.hls.audioTrack : 0;
            this.player.emit('audiotrackchange', this.getCurrentTrack());
        }
    }

    /**
     * Set active audio track
     */
    setTrack(trackId) {
        if (this.player.hls) {
            this.player.hls.audioTrack = trackId;
            this.currentTrackId = trackId;
        } else if (this.player.dash) {
            const track = this.tracks[trackId].original;
            this.player.dash.setCurrentTrack(track);
            this.currentTrackId = trackId;
        }

        console.log('[PlayerAudio] Switched to track:', trackId);
        this.player.emit('audiotrackchange', this.getCurrentTrack());
    }

    getCurrentTrack() {
        return this.tracks.find(t => t.id === this.currentTrackId) || null;
    }

    /**
     * Set volume gain (software amplification)
     */
    setGain(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }
}
