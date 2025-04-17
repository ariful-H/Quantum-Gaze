// Quantum Gaze - Stream Controller
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const gestureBadge = document.getElementById('gesture-status');
    const toggleGesturesBtn = document.getElementById('toggle-gestures');
    const searchBtn = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    // Canvas context for drawing
    const ctx = canvas.getContext('2d');
    let stream = null;
    let animationId = null;
    let gesturesActive = true;
    let player = null;
    let lastGestureTime = Date.now();
    const gestureProcessingInterval = 200; // Process every 200ms to avoid overwhelming the CPU
    
    // Initialize YouTube API
    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: 'M7lc1UVf-VE', // Default video ID
            playerVars: {
                'playsinline': 1,
                'controls': 1,
                'enablejsapi': 1,
                'rel': 0,
                'modestbranding': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    };
    
    function onPlayerReady(event) {
        console.log('Player is ready');
        
        // Set up progress bar updater
        setInterval(updateProgressBar, 1000);
        
        // Set up playback controls
        document.getElementById('play-pause').addEventListener('click', function() {
            const state = player.getPlayerState();
            if (state == YT.PlayerState.PLAYING) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        });
        
        document.getElementById('mute-unmute').addEventListener('click', function() {
            if (player.isMuted()) {
                player.unMute();
                this.innerHTML = '<i class="bi bi-volume-up-fill"></i> Mute';
            } else {
                player.mute();
                this.innerHTML = '<i class="bi bi-volume-mute-fill"></i> Unmute';
            }
        });
        
        document.getElementById('fullscreen').addEventListener('click', function() {
            const iframe = document.querySelector('#youtube-player');
            if (iframe) {
                const requestFullScreen = iframe.requestFullscreen || iframe.mozRequestFullScreen || 
                                        iframe.webkitRequestFullScreen || iframe.msRequestFullscreen;
                if (requestFullScreen) {
                    requestFullScreen.call(iframe);
                }
            }
        });
    }
    
    function onPlayerStateChange(event) {
        // Update play/pause button text based on player state
        const playPauseBtn = document.getElementById('play-pause');
        if (event.data == YT.PlayerState.PLAYING) {
            playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
        } else {
            playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play';
        }
    }
    
    function updateProgressBar() {
        if (!player) return;
        
        const currentTime = player.getCurrentTime() || 0;
        const duration = player.getDuration() || 0;
        
        if (duration > 0) {
            // Update progress bar
            const progressPercent = (currentTime / duration) * 100;
            document.getElementById('progress-bar').style.width = `${progressPercent}%`;
            
            // Update time displays
            document.getElementById('current-time').textContent = formatTime(currentTime);
            document.getElementById('duration').textContent = formatTime(duration);
        }
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
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
    
    // Toggle gesture controls
    toggleGesturesBtn.addEventListener('click', () => {
        gesturesActive = !gesturesActive;
        
        if (gesturesActive) {
            gestureBadge.textContent = 'Gestures: Active';
            gestureBadge.className = 'badge bg-success me-2';
            toggleGesturesBtn.textContent = 'Disable';
        } else {
            gestureBadge.textContent = 'Gestures: Disabled';
            gestureBadge.className = 'badge bg-danger me-2';
            toggleGesturesBtn.textContent = 'Enable';
        }
    });
    
    // Gesture processing
    function startGestureProcessing() {
        function processFrame() {
            // Draw the current video frame onto the canvas
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            
            // Process gestures at a controlled rate
            const now = Date.now();
            if (gesturesActive && now - lastGestureTime > gestureProcessingInterval) {
                lastGestureTime = now;
                
                // Create a data url from the canvas
                const imgData = canvas.toDataURL('image/jpeg', 0.7);
                
                // Send to the server for processing
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
                .then(handleGestureResponse)
                .catch(err => console.error('Error processing gesture:', err));
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
    
    // Handle gesture response from the server
    function handleGestureResponse(gestureData) {
        if (!player || !gesturesActive) return;
        
        switch(gestureData.action) {
            case 'volume_up':
                // Increase volume by 10%
                const currentVolume = player.getVolume();
                player.setVolume(Math.min(100, currentVolume + 10));
                break;
                
            case 'volume_down':
                // Decrease volume by 10%
                const volume = player.getVolume();
                player.setVolume(Math.max(0, volume - 10));
                break;
                
            case 'seek_forward':
                // Seek forward 5 seconds
                const currentTime = player.getCurrentTime();
                player.seekTo(currentTime + 5, true);
                break;
                
            case 'seek_backward':
                // Seek backward 5 seconds
                const time = player.getCurrentTime();
                player.seekTo(Math.max(0, time - 5), true);
                break;
                
            case 'toggle_play':
                // Toggle play/pause
                const state = player.getPlayerState();
                if (state == YT.PlayerState.PLAYING) {
                    player.pauseVideo();
                } else {
                    player.playVideo();
                }
                break;
                
            case 'brightness_adjust':
                // Adjust brightness using CSS filter
                if (gestureData.value) {
                    const brightness = 100 + (gestureData.value * 200); // Value will be in range -0.1 to 0.1
                    document.getElementById('youtube-player').style.filter = `brightness(${brightness}%)`;
                }
                break;
                
            case 'pause':
                // Auto-pause if user disappears
                if (player.getPlayerState() == YT.PlayerState.PLAYING) {
                    player.pauseVideo();
                }
                break;
        }
    }
    
    // Video search functionality
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchVideos(query);
        }
    });
    
    // Allow searching with Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchVideos(query);
            }
        }
    });
    
    function searchVideos(query) {
        const apiKey = 'AIzaSyAa8yy0GdcGPHdtD083HiGGx_S0vMPScDM'; // Replace with your YouTube API key
        const maxResults = 5;
        
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                displaySearchResults(data.items);
            })
            .catch(error => {
                console.error('Error searching videos:', error);
                searchResults.innerHTML = '<p class="text-danger">Error searching videos. Please try again.</p>';
            });
    }
    
    function displaySearchResults(videos) {
        if (!videos || videos.length === 0) {
            searchResults.innerHTML = '<p>No videos found. Try a different search term.</p>';
            return;
        }
        
        let resultsHTML = '<div class="list-group">';
        
        videos.forEach(video => {
            resultsHTML += `
                <a href="#" class="list-group-item list-group-item-action d-flex align-items-center video-result" data-video-id="${video.id.videoId}">
                    <img src="${video.snippet.thumbnails.default.url}" alt="${video.snippet.title}" class="me-3">
                    <div>
                        <h6 class="mb-1">${video.snippet.title}</h6>
                        <small class="text-muted">${video.snippet.channelTitle}</small>
                    </div>
                </a>
            `;
        });
        
        resultsHTML += '</div>';
        searchResults.innerHTML = resultsHTML;
        
        // Add click event listeners to search results
        document.querySelectorAll('.video-result').forEach(result => {
            result.addEventListener('click', (e) => {
                e.preventDefault();
                const videoId = result.dataset.videoId;
                player.loadVideoById(videoId);
                searchResults.innerHTML = ''; // Clear results after selection
            });
        });
    }
}); 