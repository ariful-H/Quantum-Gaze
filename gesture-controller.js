class GestureController {
    constructor() {
        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        this.faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        
        this.videoElement = document.getElementById('gesturePreview');
        this.lastFaceTime = Date.now();
        this.isPaused = false;
        
        this.setupHandlers();
    }

    setupHandlers() {
        // Configure MediaPipe instances
        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        // Set up result handlers
        this.hands.onResults(this.onHandResults.bind(this));
        this.faceMesh.onResults(this.onFaceResults.bind(this));
    }

    async start() {
        // Create camera feed
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.videoElement.srcObject = stream;
        this.videoElement.play();

        // Start detection loops
        this.startDetectionLoop();
    }

    startDetectionLoop() {
        if (!this.videoElement) return;

        const detectFrame = async () => {
            if (this.videoElement.videoWidth > 0) {
                // Process frame through both detectors
                await this.hands.send({ image: this.videoElement });
                await this.faceMesh.send({ image: this.videoElement });
            }
            // Request next frame
            requestAnimationFrame(detectFrame);
        };

        detectFrame();
    }

    async onHandResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const gestureData = {
                frame: this.videoElement,
                landmarks: landmarks
            };

            // Send gesture data to backend
            try {
                const response = await fetch('/api/gesture/state', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gestureData)
                });
                
                const result = await response.json();
                this.handleGestureAction(result);
            } catch (error) {
                console.error('Error sending gesture data:', error);
            }
        }
    }

    async onFaceResults(results) {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            this.lastFaceTime = Date.now();
            const landmarks = results.multiFaceLandmarks[0];
            const faceData = {
                frame: this.videoElement,
                landmarks: landmarks
            };

            try {
                const response = await fetch('/api/gesture/state', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(faceData)
                });
                
                const result = await response.json();
                this.handleGestureAction(result);
            } catch (error) {
                console.error('Error sending face data:', error);
            }
        } else if (Date.now() - this.lastFaceTime > 2000 && !this.isPaused) {
            // Auto-pause if face not detected for 2 seconds
            this.handleGestureAction({ action: 'pause', value: null });
        }
    }

    handleGestureAction(actionData) {
        const videoPlayer = document.querySelector('.video-player');
        if (!videoPlayer) return;

        switch (actionData.action) {
            case 'volume_up':
                videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
                break;
            case 'volume_down':
                videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
                break;
            case 'seek_forward':
                videoPlayer.currentTime += actionData.value;
                break;
            case 'seek_backward':
                videoPlayer.currentTime -= actionData.value;
                break;
            case 'toggle_play':
                if (videoPlayer.paused) {
                    videoPlayer.play();
                    this.isPaused = false;
                } else {
                    videoPlayer.pause();
                    this.isPaused = true;
                }
                break;
            case 'brightness_adjust':
                this.adjustBrightness(actionData.value);
                break;
        }
    }

    adjustBrightness(value) {
        const videoPlayer = document.querySelector('.video-player');
        if (!videoPlayer) return;

        // Apply brightness filter
        const brightness = Math.max(0.5, Math.min(1.5, 1 + value));
        videoPlayer.style.filter = `brightness(${brightness})`;
    }
}

// Initialize controller when requested
function initGestureController() {
    const controller = new GestureController();
    controller.start().catch(console.error);
    return controller;
} 