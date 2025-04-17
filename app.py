from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import pyrebase
from gesture_controller import GestureController

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Firebase Configuration
firebase_config = {
    "apiKey": os.getenv("FIREBASE_API_KEY", "2eaf2be0d1msh48f50fe2afeaa3cp167efajsn2d2c5e509894"),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", "quantumgaze.firebaseapp.com"),
    "databaseURL": os.getenv("FIREBASE_DATABASE_URL", "https://quantumgaze.firebaseio.com"),
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "quantumgaze.appspot.com")
}

# Initialize Firebase
firebase = pyrebase.initialize_app(firebase_config)
auth = firebase.auth()

# Initialize Gesture Controller
gesture_controller = GestureController()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    try:
        user = auth.create_user_with_email_and_password(data['email'], data['password'])
        return jsonify({"status": "success", "user": user}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    try:
        user = auth.sign_in_with_email_and_password(data['email'], data['password'])
        return jsonify({"status": "success", "user": user}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/games')
def games():
    return render_template('games.html')

@app.route('/stream')
def stream():
    return render_template('stream.html')

@app.route('/api/gesture/state', methods=['POST'])
def update_gesture_state():
    data = request.get_json()
    result = gesture_controller.process_gesture(data)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True) 