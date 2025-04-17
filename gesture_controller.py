import cv2
import mediapipe as mp
import numpy as np
import pyautogui
import time

class GestureController:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_face_mesh = mp.solutions.face_mesh
        self.hands = self.mp_hands.Hands(max_num_hands=1)
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.drawing = mp.solutions.drawing_utils
        self.last_face_time = time.time()
        self.paused = False

    def count_fingers(self, landmarks):
        """Count raised fingers in hand landmarks"""
        cnt = 0
        thresh = (landmarks.landmark[0].y*100 - landmarks.landmark[9].y*100)/2

        if (landmarks.landmark[5].y*100 - landmarks.landmark[8].y*100) > thresh:
            cnt += 1
        if (landmarks.landmark[9].y*100 - landmarks.landmark[12].y*100) > thresh:
            cnt += 1
        if (landmarks.landmark[13].y*100 - landmarks.landmark[16].y*100) > thresh:
            cnt += 1
        if (landmarks.landmark[17].y*100 - landmarks.landmark[20].y*100) > thresh:
            cnt += 1
        if (landmarks.landmark[5].x*100 - landmarks.landmark[4].x*100) > 6:
            cnt += 1

        return cnt

    def process_face(self, frame):
        """Process face detection and head pose"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        face_detected = False

        if results.multi_face_landmarks:
            face_detected = True
            self.last_face_time = time.time()
            
            for face_landmarks in results.multi_face_landmarks:
                # Calculate eye centers for head tilt
                left_eye = np.array([
                    (face_landmarks.landmark[i].x, face_landmarks.landmark[i].y) 
                    for i in [33, 133, 159, 145]
                ])
                right_eye = np.array([
                    (face_landmarks.landmark[i].x, face_landmarks.landmark[i].y) 
                    for i in [362, 263, 386, 374]
                ])
                
                eye_center_x = (left_eye[:, 0].mean() + right_eye[:, 0].mean()) / 2
                face_center_x = face_landmarks.landmark[1].x
                
                # Head tilt controls
                if abs(eye_center_x - face_center_x) > 0.05:
                    return {"action": "brightness_adjust", "value": eye_center_x - face_center_x}

        # Auto-pause if face not detected for 2 seconds
        if not face_detected and time.time() - self.last_face_time > 2:
            return {"action": "pause", "value": None}

        return {"action": "none", "value": None}

    def process_hands(self, frame):
        """Process hand gestures"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0]
            finger_count = self.count_fingers(hand_landmarks)
            
            # Map finger counts to actions
            actions = {
                1: {"action": "volume_up", "value": 10},
                2: {"action": "volume_down", "value": 10},
                3: {"action": "seek_forward", "value": 5},
                4: {"action": "seek_backward", "value": 5},
                5: {"action": "toggle_play", "value": None}
            }
            
            return actions.get(finger_count, {"action": "none", "value": None})
            
        return {"action": "none", "value": None}

    def process_gesture(self, frame_data):
        """Main gesture processing pipeline"""
        # Convert frame data to numpy array
        frame = np.frombuffer(frame_data, dtype=np.uint8)
        frame = cv2.imdecode(frame, cv2.IMREAD_COLOR)
        
        # Process both face and hand gestures
        face_result = self.process_face(frame)
        hand_result = self.process_hands(frame)
        
        # Prioritize hand gestures over face gestures
        if hand_result["action"] != "none":
            return hand_result
        return face_result 