# QuantumGaze - Gesture-Controlled Video Platform

A futuristic video streaming platform that combines Netflix-style content delivery with innovative gesture and face controls, plus interactive mini-games.

## Features

- **Gesture Controls**
  - Play/Pause: Open palm detection
  - Volume: Hand sliding horizontally
  - Seek: Thumb gestures
  - Fullscreen: Two-handed expand gesture
  
- **Face Detection**
  - Auto-pause when looking away
  - Brightness control via head tilt
  
- **Mini-Games**
  - Gesture Pong
  - Space Defender
  - Gesture Racer
  - And more!

- **Authentication**
  - Email/Password
  - Google
  - Apple
  - Phone number

## Prerequisites

- Python 3.8+
- Node.js 14+
- Webcam access
- Modern web browser (Chrome/Firefox/Safari)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quantumgaze.git
cd quantumgaze
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

5. Initialize the database:
```bash
flask db upgrade
```

## Running the Application

1. Start the Flask server:
```bash
flask run
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

## Gesture Controls Guide

### Hand Gestures
- ✋ Open Palm: Play/Pause
- ↔️ Horizontal Hand Movement: Volume Control
- 👍 Thumb Up: Fast Forward
- 👎 Thumb Down: Rewind
- 👐 Two Hands Expanding: Toggle Fullscreen

### Face Controls
- 👀 Looking Away: Auto-pause
- 🔄 Head Tilt: Adjust Brightness

## Development

### Project Structure
```
quantumgaze/
├── app.py              # Main Flask application
├── gesture_controller.py   # Gesture detection logic
├── requirements.txt    # Python dependencies
├── static/
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── img/           # Images and icons
└── templates/         # HTML templates
```

### Adding New Features

1. Gesture Controls:
   - Add new gesture detection in `gesture_controller.py`
   - Map gestures to actions in `static/js/gesture-controller.js`

2. Games:
   - Create new game component in `templates/games/`
   - Add gesture controls in `static/js/games/`

3. UI Components:
   - Add new templates in `templates/`
   - Style in `static/css/style.css`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MediaPipe for gesture recognition
- Firebase for authentication
- Bootstrap for UI components 