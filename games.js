// Game management and camera interaction for Quantum Gaze
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const gameModal = document.getElementById('gameModal');
    const gameModalLabel = document.getElementById('gameModalLabel');
    const gameContainer = document.getElementById('game-container');
    const startGameBtns = document.querySelectorAll('.start-game');
    
    // Canvas context for drawing
    const ctx = canvas.getContext('2d');
    let stream = null;
    let animationId = null;
    let currentGame = null;
    
    // Camera handling
    startCameraBtn.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            video.srcObject = stream;
            video.play();
            
            // Size the canvas to match the video
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
            
            // Update button states
            startCameraBtn.disabled = true;
            stopCameraBtn.disabled = false;
            
            // Start gesture processing
            startGestureProcessing();
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please ensure camera permissions are granted.');
        }
    });
    
    stopCameraBtn.addEventListener('click', () => {
        if (stream) {
            stopGestureProcessing();
            
            // Stop all tracks in the stream
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update button states
            startCameraBtn.disabled = false;
            stopCameraBtn.disabled = true;
        }
    });
    
    // Game launching
    startGameBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const gameType = btn.dataset.game;
            gameModalLabel.textContent = gameType.charAt(0).toUpperCase() + gameType.slice(1) + " Game";
            
            // Show the modal
            const gameModalInstance = new bootstrap.Modal(gameModal);
            gameModalInstance.show();
            
            // Start the requested game
            startGame(gameType);
        });
    });
    
    // Modal close handling
    gameModal.addEventListener('hidden.bs.modal', () => {
        if (currentGame) {
            currentGame.stop();
            currentGame = null;
            gameContainer.innerHTML = '';
        }
    });
    
    // Gesture processing
    function startGestureProcessing() {
        let lastGestureTime = Date.now();
        const processingInterval = 100; // Process every 100ms to avoid overwhelming the CPU
        
        function processFrame() {
            // Draw the current video frame onto the canvas
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            
            // Process gestures at a controlled rate
            const now = Date.now();
            if (now - lastGestureTime > processingInterval) {
                lastGestureTime = now;
                
                // Create a data url from the canvas
                const imgData = canvas.toDataURL('image/jpeg', 0.7);
                
                // Send to the server for processing
                if (currentGame) {
                    fetch('/api/gesture/state', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            image: imgData.split(',')[1] // Send base64 data without the data:image prefix
                        })
                    })
                    .then(res => res.json())
                    .then(gestureData => {
                        if (currentGame) {
                            currentGame.handleGesture(gestureData);
                        }
                    })
                    .catch(err => console.error('Error processing gesture:', err));
                }
            }
            
            animationId = requestAnimationFrame(processFrame);
        }
        
        animationId = requestAnimationFrame(processFrame);
    }
    
    function stopGestureProcessing() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
    
    // Game implementations
    function startGame(gameType) {
        const gameCanvas = document.createElement('canvas');
        gameCanvas.width = 640;
        gameCanvas.height = 480;
        gameCanvas.style.maxWidth = '100%';
        gameContainer.innerHTML = '';
        gameContainer.appendChild(gameCanvas);
        
        switch(gameType) {
            case 'snake':
                currentGame = new SnakeGame(gameCanvas);
                break;
            case 'tetris':
                currentGame = new TetrisGame(gameCanvas);
                break;
            case 'pong':
                currentGame = new PongGame(gameCanvas);
                break;
            default:
                console.error('Unknown game type:', gameType);
                return;
        }
        
        currentGame.start();
    }
    
    // Simple Pong Game implementation
    class PongGame {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.running = false;
            this.paddlePos = canvas.height / 2;
            this.ballX = canvas.width / 2;
            this.ballY = canvas.height / 2;
            this.ballSpeedX = 5;
            this.ballSpeedY = 2;
            this.score = 0;
            this.frameId = null;
        }
        
        start() {
            this.running = true;
            this.gameLoop();
        }
        
        stop() {
            this.running = false;
            if (this.frameId) {
                cancelAnimationFrame(this.frameId);
            }
        }
        
        handleGesture(gestureData) {
            if (gestureData.action === 'seek_forward') {
                this.paddlePos -= 20;
            } else if (gestureData.action === 'seek_backward') {
                this.paddlePos += 20;
            }
            
            // Keep paddle within canvas
            this.paddlePos = Math.max(50, Math.min(this.canvas.height - 50, this.paddlePos));
        }
        
        gameLoop() {
            if (!this.running) return;
            
            this.update();
            this.render();
            
            this.frameId = requestAnimationFrame(() => this.gameLoop());
        }
        
        update() {
            // Ball movement
            this.ballX += this.ballSpeedX;
            this.ballY += this.ballSpeedY;
            
            // Ball collision with top and bottom
            if (this.ballY < 10 || this.ballY > this.canvas.height - 10) {
                this.ballSpeedY = -this.ballSpeedY;
            }
            
            // Ball collision with paddle
            if (this.ballX < 30 && Math.abs(this.ballY - this.paddlePos) < 50) {
                this.ballSpeedX = -this.ballSpeedX;
                this.score++;
            }
            
            // Ball out of bounds
            if (this.ballX < 0) {
                // Reset ball
                this.ballX = this.canvas.width / 2;
                this.ballY = this.canvas.height / 2;
                this.score = Math.max(0, this.score - 1);
            }
            
            // Ball collision with right wall
            if (this.ballX > this.canvas.width) {
                this.ballSpeedX = -this.ballSpeedX;
            }
        }
        
        render() {
            const ctx = this.ctx;
            
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw paddle
            ctx.fillStyle = '#fff';
            ctx.fillRect(10, this.paddlePos - 50, 10, 100);
            
            // Draw ball
            ctx.beginPath();
            ctx.arc(this.ballX, this.ballY, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw score
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.fillText(`Score: ${this.score}`, 20, 30);
        }
    }
    
    // Placeholder for other game implementations
    class SnakeGame {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
        }
        
        start() {
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Snake Game - Coming Soon!', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        stop() {}
        handleGesture() {}
    }
    
    class TetrisGame {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
        }
        
        start() {
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Tetris Game - Coming Soon!', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        stop() {}
        handleGesture() {}
    }
}); 