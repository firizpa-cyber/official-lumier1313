/**
 * Stats Module for Professional Video Player
 * Real-time statistics: bitrate, FPS, dropped frames, codecs, buffer health
 * 
 * @version 3.0.0
 */

class PlayerStats {
    constructor(player) {
        this.player = player;
        this.video = player.video;

        // Stats data
        this.stats = {
            // Video
            videoCodec: 'N/A',
            audioCodec: 'N/A',
            resolution: '0x0',
            fps: 0,

            // Performance
            droppedFrames: 0,
            totalFrames: 0,
            droppedFramesPercent: 0,

            // Network
            bitrate: 0,
            bandwidth: 0,
            networkActivity: 0,

            // Buffer
            bufferHealth: 0,
            bufferedRanges: [],

            // Playback
            currentTime: 0,
            duration: 0,
            volume: 100,
            playbackRate: 1,

            // Connection
            connectionType: 'unknown',
            downloadSpeed: 0,
        };

        // UI Elements
        this.overlay = null;
        this.isVisible = false;
        this.updateInterval = null;

        this.init();
    }

    /**
     * Initialize stats module
     */
    init() {
        this.createUI();
        this.setupPlayerListeners();
    }

    /**
     * Create stats overlay UI
     */
    createUI() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'player-stats-overlay';
        this.overlay.style.display = 'none';
        this.overlay.innerHTML = `
            <div class="player-stats-container">
                <div class="player-stats-header">
                    <h3>Stats for Nerds</h3>
                    <button class="player-stats-close material-icons-round">close</button>
                </div>
                <div class="player-stats-content">
                    <div class="player-stats-section">
                        <div class="player-stats-title">Video</div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Resolution:</span>
                            <span class="player-stat-value" data-stat="resolution">0x0</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Video Codec:</span>
                            <span class="player-stat-value" data-stat="videoCodec">N/A</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Audio Codec:</span>
                            <span class="player-stat-value" data-stat="audioCodec">N/A</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">FPS:</span>
                            <span class="player-stat-value" data-stat="fps">0</span>
                        </div>
                    </div>

                    <div class="player-stats-section">
                        <div class="player-stats-title">Performance</div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Dropped Frames:</span>
                            <span class="player-stat-value" data-stat="droppedFrames">0 / 0 (0%)</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Playback Rate:</span>
                            <span class="player-stat-value" data-stat="playbackRate">1x</span>
                        </div>
                    </div>

                    <div class="player-stats-section">
                        <div class="player-stats-title">Network</div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Current Bitrate:</span>
                            <span class="player-stat-value" data-stat="bitrate">0 Kbps</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Bandwidth Estimate:</span>
                            <span class="player-stat-value" data-stat="bandwidth">0 Mbps</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Network Activity:</span>
                            <span class="player-stat-value" data-stat="networkActivity">0 KB</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Connection:</span>
                            <span class="player-stat-value" data-stat="connectionType">Unknown</span>
                        </div>
                    </div>

                    <div class="player-stats-section">
                        <div class="player-stats-title">Buffer</div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Buffer Health:</span>
                            <span class="player-stat-value" data-stat="bufferHealth">0s</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Buffered Ranges:</span>
                            <span class="player-stat-value" data-stat="bufferedRanges">None</span>
                        </div>
                    </div>

                    <div class="player-stats-section">
                        <div class="player-stats-title">Playback</div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Time:</span>
                            <span class="player-stat-value" data-stat="currentTime">0:00 / 0:00</span>
                        </div>
                        <div class="player-stat-row">
                            <span class="player-stat-label">Volume:</span>
                            <span class="player-stat-value" data-stat="volume">100%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.player.container.appendChild(this.overlay);

        // Close button
        this.overlay.querySelector('.player-stats-close').addEventListener('click', () => {
            this.hide();
        });

        // Cache stat value elements
        this.statElements = {};
        this.overlay.querySelectorAll('[data-stat]').forEach(el => {
            this.statElements[el.dataset.stat] = el;
        });
    }

    /**
     * Setup player event listeners
     */
    setupPlayerListeners() {
        this.player.on('qualitychange', (quality) => {
            if (quality) {
                this.updateQualityStats(quality);
            }
        });

        this.player.on('timeupdate', () => {
            if (this.isVisible) {
                this.updatePlaybackStats();
            }
        });

        this.player.on('audiotrackchange', (track) => {
            if (track && track.codec) {
                this.stats.audioCodec = track.codec;
                this.renderStats();
            }
        });
    }

    /**
     * Show stats overlay
     */
    show() {
        this.overlay.style.display = 'block';
        this.isVisible = true;
        this.startUpdating();
    }

    /**
     * Hide stats overlay
     */
    hide() {
        this.overlay.style.display = 'none';
        this.isVisible = false;
        this.stopUpdating();
    }

    /**
     * Toggle stats visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Start periodic updates
     */
    startUpdating() {
        this.stopUpdating();
        this.update();
        this.updateInterval = setInterval(() => this.update(), 1000);
    }

    /**
     * Stop updates
     */
    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update all stats
     */
    update() {
        this.updateVideoStats();
        this.updatePerformanceStats();
        this.updateNetworkStats();
        this.updateBufferStats();
        this.updatePlaybackStats();
        this.renderStats();
    }

    /**
     * Update video stats
     */
    updateVideoStats() {
        this.stats.resolution = `${this.video.videoWidth}x${this.video.videoHeight}`;

        // Get FPS if available
        if (this.video.getVideoPlaybackQuality && this.lastFrameCount !== undefined) {
            const quality = this.video.getVideoPlaybackQuality();
            const frameDiff = quality.totalVideoFrames - this.lastFrameCount;
            this.stats.fps = frameDiff; // Approximate FPS
            this.lastFrameCount = quality.totalVideoFrames;
        } else if (this.video.getVideoPlaybackQuality) {
            this.lastFrameCount = this.video.getVideoPlaybackQuality().totalVideoFrames;
        }

        // Get codec from HLS
        if (this.player.hls && this.player.hls.levels) {
            const level = this.player.hls.levels[this.player.hls.currentLevel];
            if (level && level.videoCodec) {
                this.stats.videoCodec = level.videoCodec;
            }
            if (level && level.audioCodec) {
                this.stats.audioCodec = level.audioCodec;
            }
        }
    }

    /**
     * Update performance stats
     */
    updatePerformanceStats() {
        if (this.video.getVideoPlaybackQuality) {
            const quality = this.video.getVideoPlaybackQuality();
            this.stats.droppedFrames = quality.droppedVideoFrames;
            this.stats.totalFrames = quality.totalVideoFrames;

            if (this.stats.totalFrames > 0) {
                this.stats.droppedFramesPercent =
                    ((this.stats.droppedFrames / this.stats.totalFrames) * 100).toFixed(2);
            }
        }

        this.stats.playbackRate = this.video.playbackRate;
    }

    /**
     * Update network stats
     */
    updateNetworkStats() {
        // HLS stats
        if (this.player.hls && this.player.hls.levels) {
            const level = this.player.hls.levels[this.player.hls.currentLevel];
            if (level) {
                this.stats.bitrate = Math.round(level.bitrate / 1000); // Kbps
            }

            // Bandwidth estimate
            if (this.player.hls.bandwidthEstimate) {
                this.stats.bandwidth = (this.player.hls.bandwidthEstimate / 1000000).toFixed(2); // Mbps
            }
        }

        // Connection type (Network Information API)
        if (navigator.connection) {
            this.stats.connectionType = navigator.connection.effectiveType || 'unknown';
            this.stats.downloadSpeed = navigator.connection.downlink || 0;
        }

        // Network activity (approximate)
        if (this.player.hls && this.player.hls.stats) {
            const loaded = this.player.hls.stats.loaded || 0;
            this.stats.networkActivity = Math.round(loaded / 1024); // KB
        }
    }

    /**
     * Update buffer stats
     */
    updateBufferStats() {
        const buffered = this.video.buffered;
        const currentTime = this.video.currentTime;

        this.stats.bufferedRanges = [];
        let bufferHealth = 0;

        for (let i = 0; i < buffered.length; i++) {
            const start = buffered.start(i);
            const end = buffered.end(i);

            this.stats.bufferedRanges.push({
                start: start.toFixed(1),
                end: end.toFixed(1)
            });

            // Calculate buffer health (time ahead of current position)
            if (start <= currentTime && end >= currentTime) {
                bufferHealth = end - currentTime;
            }
        }

        this.stats.bufferHealth = bufferHealth;
    }

    /**
     * Update playback stats
     */
    updatePlaybackStats() {
        this.stats.currentTime = this.video.currentTime;
        this.stats.duration = this.video.duration;
        this.stats.volume = Math.round(this.video.volume * 100);
    }

    /**
     * Update quality-related stats
     */
    updateQualityStats(quality) {
        if (quality.codec) {
            this.stats.videoCodec = quality.codec;
        }
    }

    /**
     * Render stats to UI
     */
    renderStats() {
        // Resolution
        this.statElements.resolution.textContent = this.stats.resolution;

        // Codecs
        this.statElements.videoCodec.textContent = this.stats.videoCodec;
        this.statElements.audioCodec.textContent = this.stats.audioCodec;

        // FPS
        this.statElements.fps.textContent = this.stats.fps || 'N/A';

        // Dropped frames
        this.statElements.droppedFrames.textContent =
            `${this.stats.droppedFrames} / ${this.stats.totalFrames} (${this.stats.droppedFramesPercent}%)`;

        // Playback rate
        this.statElements.playbackRate.textContent = `${this.stats.playbackRate}x`;

        // Bitrate
        this.statElements.bitrate.textContent = `${this.stats.bitrate} Kbps`;

        // Bandwidth
        this.statElements.bandwidth.textContent = `${this.stats.bandwidth} Mbps`;

        // Network activity
        this.statElements.networkActivity.textContent = `${this.stats.networkActivity} KB`;

        // Connection type
        this.statElements.connectionType.textContent = this.stats.connectionType;

        // Buffer health
        this.statElements.bufferHealth.textContent = `${this.stats.bufferHealth.toFixed(1)}s`;

        // Buffered ranges
        const rangesText = this.stats.bufferedRanges.length > 0
            ? this.stats.bufferedRanges.map(r => `${r.start}-${r.end}s`).join(', ')
            : 'None';
        this.statElements.bufferedRanges.textContent = rangesText;

        // Time
        this.statElements.currentTime.textContent =
            `${this.formatTime(this.stats.currentTime)} / ${this.formatTime(this.stats.duration)}`;

        // Volume
        this.statElements.volume.textContent = `${this.stats.volume}%`;
    }

    /**
     * Format time helper
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * Get current stats data
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Destroy stats module
     */
    destroy() {
        this.stopUpdating();
        if (this.overlay) {
            this.overlay.remove();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerStats;
}
