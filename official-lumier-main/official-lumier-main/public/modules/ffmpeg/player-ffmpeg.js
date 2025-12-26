/**
 * FFmpeg Module for Professional Video Player
 * Client-side video editing: export, trim, conversion, preview generation
 * 
 * @version 3.0.0
 * @requires FFmpeg.wasm
 */

class PlayerFFmpeg {
    constructor(player, config = {}) {
        this.player = player;

        // Configuration
        this.config = {
            corePath: config.corePath || './lib/ffmpeg-core.js',
            wasmPath: config.wasmPath || './lib/ffmpeg-core-engine.wasm',
            workerPath: config.workerPath || './lib/ffmpeg-core.worker.js',
            onProgress: config.onProgress || null,
            onLog: config.onLog || null,
        };

        // FFmpeg instance
        this.ffmpeg = null;
        this.isLoaded = false;
        this.isProcessing = false;

        // Current loaded file
        this.currentFile = null;
        this.currentFileName = 'input.mp4';

        // UI
        this.panel = null;
        this.logElement = null;

        this.init();
    }

    /**
     * Initialize FFmpeg module
     */
    async init() {
        if (typeof FFmpeg !== 'undefined') {
            const { createFFmpeg } = FFmpeg;

            this.ffmpeg = createFFmpeg({
                log: true,
                corePath: this.config.corePath,
                progress: (progress) => {
                    if (this.config.onProgress) {
                        this.config.onProgress(progress);
                    }
                    this.handleProgress(progress);
                },
            });

            console.log('[PlayerFFmpeg] FFmpeg instance created');
        } else {
            console.warn('[PlayerFFmpeg] FFmpeg.wasm not available');
        }

        this.createUI();
    }

    /**
     * Create FFmpeg tools UI panel
     */
    createUI() {
        this.panel = document.createElement('div');
        this.panel.className = 'player-ffmpeg-panel';
        this.panel.innerHTML = `
            <div class="player-ffmpeg-container">
                <div class="player-ffmpeg-header">
                    <h3>Video Tools (FFmpeg.wasm)</h3>
                    <button class="player-ffmpeg-toggle material-icons-round">expand_less</button>
                </div>

                <div class="player-ffmpeg-content">
                    <!-- File Input -->
                    <div class="player-ffmpeg-section">
                        <h4>Load Video</h4>
                        <div class="player-ffmpeg-row">
                            <input type="file" id="ffmpeg-file-input" accept="video/*" style="display:none">
                            <button class="player-btn-primary" data-action="load-file">
                                <span class="material-icons-round">file_upload</span>
                                Load Video File
                            </button>
                            <button class="player-btn-primary" data-action="load-current">
                                <span class="material-icons-round">video_library</span>
                                Use Current Video
                            </button>
                        </div>
                        <div class="player-ffmpeg-info">
                            <span>Status: <strong id="ffmpeg-status">Not loaded</strong></span>
                        </div>
                    </div>

                    <!-- Trim Tool -->
                    <div class="player-ffmpeg-section">
                        <h4>Trim Video</h4>
                        <div class="player-ffmpeg-row">
                            <div class="player-ffmpeg-input-group">
                                <label>Start Time (seconds)</label>
                                <input type="number" id="trim-start" value="0" min="0" step="0.1">
                            </div>
                            <div class="player-ffmpeg-input-group">
                                <label>End Time (seconds)</label>
                                <input type="number" id="trim-end" value="10" min="0" step="0.1">
                            </div>
                            <button class="player-btn-secondary" data-action="trim">
                                <span class="material-icons-round">content_cut</span>
                                Trim
                            </button>
                        </div>
                    </div>

                    <!-- Convert Tool -->
                    <div class="player-ffmpeg-section">
                        <h4>Convert Video</h4>
                        <div class="player-ffmpeg-row">
                            <select id="convert-format">
                                <option value="mp4">MP4 (H.264)</option>
                                <option value="webm">WebM (VP9)</option>
                                <option value="mp4-h265">MP4 (H.265)</option>
                            </select>
                            <select id="convert-quality">
                                <option value="high">High Quality</option>
                                <option value="medium" selected>Medium Quality</option>
                                <option value="low">Low Quality</option>
                            </select>
                            <button class="player-btn-secondary" data-action="convert">
                                <span class="material-icons-round">transform</span>
                                Convert
                            </button>
                        </div>
                    </div>

                    <!-- Extract Audio -->
                    <div class="player-ffmpeg-section">
                        <h4>Extract Audio</h4>
                        <div class="player-ffmpeg-row">
                            <select id="audio-format">
                                <option value="mp3">MP3</option>
                                <option value="aac">AAC</option>
                                <option value="opus">Opus</option>
                            </select>
                            <button class="player-btn-secondary" data-action="extract-audio">
                                <span class="material-icons-round">audiotrack</span>
                                Extract Audio
                            </button>
                        </div>
                    </div>

                    <!-- Generate Thumbnail -->
                    <div class="player-ffmpeg-section">
                        <h4>Generate Thumbnails</h4>
                        <div class="player-ffmpeg-row">
                            <div class="player-ffmpeg-input-group">
                                <label>Time (seconds)</label>
                                <input type="number" id="thumb-time" value="0" min="0" step="0.1">
                            </div>
                            <button class="player-btn-secondary" data-action="thumbnail">
                                <span class="material-icons-round">image</span>
                                Generate Thumbnail
                            </button>
                            <button class="player-btn-secondary" data-action="thumbnails-grid">
                                <span class="material-icons-round">grid_on</span>
                                Generate Grid
                            </button>
                        </div>
                    </div>

                    <!-- Progress -->
                    <div class="player-ffmpeg-progress">
                        <div class="player-ffmpeg-progress-bar">
                            <div class="player-ffmpeg-progress-fill" id="ffmpeg-progress"></div>
                        </div>
                        <div class="player-ffmpeg-progress-text" id="ffmpeg-progress-text">Ready</div>
                    </div>

                    <!-- Log Output -->
                    <div class="player-ffmpeg-log" id="ffmpeg-log"></div>
                </div>
            </div>
        `;

        // Add to player container
        document.body.appendChild(this.panel);

        // Cache elements
        this.elements = {
            status: this.panel.querySelector('#ffmpeg-status'),
            log: this.panel.querySelector('#ffmpeg-log'),
            progress: this.panel.querySelector('#ffmpeg-progress'),
            progressText: this.panel.querySelector('#ffmpeg-progress-text'),
            fileInput: this.panel.querySelector('#ffmpeg-file-input'),
        };

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Toggle panel
        this.panel.querySelector('.player-ffmpeg-toggle').addEventListener('click', () => {
            this.panel.classList.toggle('collapsed');
        });

        // Action buttons
        this.panel.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });

        // File input
        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadFile(file);
            }
        });
    }

    /**
     * Handle UI actions
     */
    async handleAction(action) {
        if (this.isProcessing) {
            this.log('Please wait, processing...');
            return;
        }

        switch (action) {
            case 'load-file':
                this.elements.fileInput.click();
                break;

            case 'load-current':
                await this.loadCurrentVideo();
                break;

            case 'trim':
                await this.trim();
                break;

            case 'convert':
                await this.convert();
                break;

            case 'extract-audio':
                await this.extractAudio();
                break;

            case 'thumbnail':
                await this.generateThumbnail();
                break;

            case 'thumbnails-grid':
                await this.generateThumbnailGrid();
                break;
        }
    }

    /**
     * Ensure FFmpeg is loaded
     */
    async ensureLoaded() {
        if (!this.ffmpeg) {
            throw new Error('FFmpeg.wasm not available');
        }

        if (!this.isLoaded) {
            this.log('Loading FFmpeg core...');
            this.elements.status.textContent = 'Loading FFmpeg...';

            await this.ffmpeg.load();

            this.isLoaded = true;
            this.log('FFmpeg loaded successfully!');
            this.elements.status.textContent = 'Ready';
        }
    }

    /**
     * Load file into FFmpeg
     */
    async loadFile(file) {
        try {
            await this.ensureLoaded();

            this.log(`Loading file: ${file.name}...`);
            this.elements.status.textContent = 'Loading file...';

            const { fetchFile } = FFmpeg;

            // Determine file extension
            const ext = file.name.split('.').pop();
            this.currentFileName = `input.${ext}`;

            // Write file to FFmpeg filesystem
            this.ffmpeg.FS('writeFile', this.currentFileName, await fetchFile(file));

            this.currentFile = file;
            this.log(`File loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
            this.elements.status.textContent = `Loaded: ${file.name}`;

        } catch (err) {
            this.log(`Error loading file: ${err.message}`);
            console.error(err);
        }
    }

    /**
     * Load current playing video
     */
    async loadCurrentVideo() {
        try {
            this.log('Feature not yet implemented. Please load a local file.');
            // TODO: Implement fetching current video source
        } catch (err) {
            this.log(`Error: ${err.message}`);
        }
    }

    /**
     * Trim video
     */
    async trim() {
        if (!this.currentFile) {
            this.log('No file loaded!');
            return;
        }

        try {
            await this.ensureLoaded();

            const startTime = parseFloat(this.panel.querySelector('#trim-start').value);
            const endTime = parseFloat(this.panel.querySelector('#trim-end').value);
            const duration = endTime - startTime;

            if (duration <= 0) {
                this.log('Invalid time range!');
                return;
            }

            this.isProcessing = true;
            this.log(`Trimming video from ${startTime}s to ${endTime}s...`);
            this.setProgress(0, 'Processing...');

            await this.ffmpeg.run(
                '-i', this.currentFileName,
                '-ss', startTime.toString(),
                '-t', duration.toString(),
                '-c', 'copy',
                'output.mp4'
            );

            // Read output file
            const data = this.ffmpeg.FS('readFile', 'output.mp4');
            this.downloadFile(data, 'trimmed.mp4', 'video/mp4');

            this.log('Trim complete! ✓');
            this.setProgress(100, 'Complete!');

        } catch (err) {
            this.log(`Error trimming: ${err.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Convert video
     */
    async convert() {
        if (!this.currentFile) {
            this.log('No file loaded!');
            return;
        }

        try {
            await this.ensureLoaded();

            const format = this.panel.querySelector('#convert-format').value;
            const quality = this.panel.querySelector('#convert-quality').value;

            this.isProcessing = true;
            this.log(`Converting to ${format}...`);
            this.setProgress(0, 'Converting...');

            let args = ['-i', this.currentFileName];
            let outputFile = 'output.mp4';
            let mimeType = 'video/mp4';

            // Format-specific settings
            switch (format) {
                case 'mp4':
                    args.push('-vcodec', 'libx264', '-acodec', 'aac');
                    break;
                case 'webm':
                    args.push('-vcodec', 'libvpx-vp9', '-acodec', 'libopus');
                    outputFile = 'output.webm';
                    mimeType = 'video/webm';
                    break;
                case 'mp4-h265':
                    args.push('-vcodec', 'libx265', '-acodec', 'aac');
                    break;
            }

            // Quality settings
            switch (quality) {
                case 'high':
                    args.push('-crf', '18');
                    break;
                case 'medium':
                    args.push('-crf', '23');
                    break;
                case 'low':
                    args.push('-crf', '28');
                    break;
            }

            args.push(outputFile);

            await this.ffmpeg.run(...args);

            const data = this.ffmpeg.FS('readFile', outputFile);
            this.downloadFile(data, `converted.${format === 'webm' ? 'webm' : 'mp4'}`, mimeType);

            this.log('Conversion complete! ✓');
            this.setProgress(100, 'Complete!');

        } catch (err) {
            this.log(`Error converting: ${err.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Extract audio
     */
    async extractAudio() {
        if (!this.currentFile) {
            this.log('No file loaded!');
            return;
        }

        try {
            await this.ensureLoaded();

            const format = this.panel.querySelector('#audio-format').value;

            this.isProcessing = true;
            this.log(`Extracting audio as ${format}...`);
            this.setProgress(0, 'Extracting...');

            let args = ['-i', this.currentFileName, '-vn'];
            let outputFile = `output.${format}`;
            let mimeType = `audio/${format}`;

            switch (format) {
                case 'mp3':
                    args.push('-acodec', 'libmp3lame');
                    break;
                case 'aac':
                    args.push('-acodec', 'aac');
                    mimeType = 'audio/aac';
                    break;
                case 'opus':
                    args.push('-acodec', 'libopus');
                    mimeType = 'audio/opus';
                    break;
            }

            args.push(outputFile);

            await this.ffmpeg.run(...args);

            const data = this.ffmpeg.FS('readFile', outputFile);
            this.downloadFile(data, `audio.${format}`, mimeType);

            this.log('Audio extraction complete! ✓');
            this.setProgress(100, 'Complete!');

        } catch (err) {
            this.log(`Error extracting audio: ${err.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate single thumbnail
     */
    async generateThumbnail() {
        if (!this.currentFile) {
            this.log('No file loaded!');
            return;
        }

        try {
            await this.ensureLoaded();

            const time = parseFloat(this.panel.querySelector('#thumb-time').value);

            this.isProcessing = true;
            this.log(`Generating thumbnail at ${time}s...`);
            this.setProgress(0, 'Generating...');

            await this.ffmpeg.run(
                '-i', this.currentFileName,
                '-ss', time.toString(),
                '-frames:v', '1',
                'thumbnail.jpg'
            );

            const data = this.ffmpeg.FS('readFile', 'thumbnail.jpg');
            this.downloadFile(data, 'thumbnail.jpg', 'image/jpeg');

            this.log('Thumbnail generated! ✓');
            this.setProgress(100, 'Complete!');

        } catch (err) {
            this.log(`Error generating thumbnail: ${err.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate thumbnail grid
     */
    async generateThumbnailGrid() {
        if (!this.currentFile) {
            this.log('No file loaded!');
            return;
        }

        try {
            await this.ensureLoaded();

            this.isProcessing = true;
            this.log('Generating thumbnail grid...');
            this.setProgress(0, 'Generating...');

            // Generate grid of thumbnails
            await this.ffmpeg.run(
                '-i', this.currentFileName,
                '-vf', 'fps=1/10,scale=320:180,tile=3x3',
                '-frames:v', '1',
                'grid.jpg'
            );

            const data = this.ffmpeg.FS('readFile', 'grid.jpg');
            this.downloadFile(data, 'thumbnail-grid.jpg', 'image/jpeg');

            this.log('Thumbnail grid generated! ✓');
            this.setProgress(100, 'Complete!');

        } catch (err) {
            this.log(`Error generating grid: ${err.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle FFmpeg progress
     */
    handleProgress(progress) {
        if (progress.ratio) {
            const percent = Math.round(progress.ratio * 100);
            this.setProgress(percent, `Processing: ${percent}%`);
        }
    }

    /**
     * Set progress bar
     */
    setProgress(percent, text) {
        this.elements.progress.style.width = `${percent}%`;
        this.elements.progressText.textContent = text;
    }

    /**
     * Download file helper
     */
    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data.buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        this.log(`Downloaded: ${filename}`);
    }

    /**
     * Log message
     */
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logLine = document.createElement('div');
        logLine.textContent = `[${timestamp}] ${message}`;
        this.elements.log.appendChild(logLine);
        this.elements.log.scrollTop = this.elements.log.scrollHeight;

        if (this.config.onLog) {
            this.config.onLog(message);
        }
    }

    /**
     * Destroy FFmpeg module
     */
    destroy() {
        if (this.ffmpeg && this.isLoaded) {
            this.ffmpeg.exit();
        }

        if (this.panel) {
            this.panel.remove();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerFFmpeg;
}
