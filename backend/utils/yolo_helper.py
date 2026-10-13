from ultralytics import YOLO
import cv2
import base64
import numpy as np
import datetime

# ── MODEL ──
model = None

def load_model(model_path='models/best.pt'):
    global model
    if model is None:
        try:
            model = YOLO(model_path)
            print(f"✅ Custom model loaded: {model_path}")
        except Exception as e:
            print(f"⚠️ Custom model failed, using base: {e}")
            model = YOLO('yolov8n.pt')
    return model

# ── CLAHE NIGHT ENHANCEMENT ──
def apply_clahe(frame):
    """
    Apply CLAHE for night/low-light enhancement
    Converts to LAB color space
    Applies CLAHE on L channel only
    Preserves color while enhancing brightness
    """
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    enhanced_lab = cv2.merge([l_enhanced, a, b])
    enhanced_frame = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    return enhanced_frame

# ── RULE-BASED BEHAVIOR ANALYSIS ──
def analyze_behavior(frame, bbox):
    """
    Rule-based behavior analysis using bounding box geometry
    No external dependencies needed
    
    Logic:
    - Crawling: bounding box width >> height (person horizontal)
    - Crouching: box width > height (person low, compact)
    - Fence Proximity: detection near frame edges
    - Standing: normal upright person
    """
    try:
        x1, y1, x2, y2 = [float(v) for v in bbox]
        h, w = frame.shape[:2]

        box_h = y2 - y1
        box_w = x2 - x1

        if box_h == 0:
            return 'Unknown', 0.0

        aspect_ratio = box_w / box_h

        # Crawling — very wide bounding box
        if aspect_ratio > 2.0:
            return 'Crawling', 0.9

        # Crouching — wider than tall
        elif aspect_ratio > 1.5:
            return 'Crouching', 0.7

        # Fence Proximity — near left or right frame edge
        elif x1 < w * 0.1 or x2 > w * 0.9:
            return 'Fence Proximity', 0.6

        # Rapid Movement — near top of frame
        elif y1 < h * 0.15:
            return 'Rapid Movement', 0.4

        # Normal standing
        else:
            return 'Standing', 0.1

    except Exception:
        return 'Unknown', 0.0

# ── THREAT SCORING ──
def calculate_threat_score(detection_class, behavior_risk,
                            group_size, zone_risk=0.5):
    """
    Weighted threat score formula:
    Score = w1*detection + w2*behavior + w3*group + w4*zone

    Weights:
    w1=0.40 detection class (primary signal)
    w2=0.30 behavior risk
    w3=0.20 group size
    w4=0.10 zone risk forecast
    """
    w1, w2, w3, w4 = 0.40, 0.30, 0.20, 0.10

    # Detection class score
    # class 0 = authorized → score 0.0
    # class 1 = unauthorized → score 1.0
    detection_score = 1.0 if detection_class == 1 else 0.0

    # Group size normalized (max 8 people assumed)
    group_score = min(1.0, group_size / 8.0)

    # Weighted sum
    threat_score = (w1 * detection_score +
                    w2 * behavior_risk +
                    w3 * group_score +
                    w4 * zone_risk)

    return round(threat_score, 3)

def get_threat_level(threat_score):
    """
    Convert numeric score to threat level label
    """
    if threat_score >= 0.75:
        return 'HIGH'
    elif threat_score >= 0.50:
        return 'MEDIUM'
    else:
        return 'LOW'

# ── MAIN DETECTION FUNCTION ──
def detect_from_frame(frame_data):
    """
    Full pipeline:
    Base64 Frame
        → CLAHE Night Enhancement
        → YOLOv8 Detection (authorized vs unauthorized)
        → Rule-based Behavior Analysis
        → Weighted Threat Scoring
        → Structured Result
    """
    try:
        # Decode base64 frame from frontend
        frame_bytes = base64.b64decode(frame_data.split(',')[1])
        np_arr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {
                'success': False,
                'error': 'Could not decode frame',
                'detections': []
            }

        # Step 1 — CLAHE Enhancement (night vision)
        enhanced_frame = apply_clahe(frame)

        # Step 2 — YOLOv8 Detection
        yolo = load_model()
        results = yolo(enhanced_frame, conf=0.60, iou=0.45,
                       verbose=False)

        detections = []
        unauthorized_count = 0

        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = result.names[class_id]

                # Step 3 — Behavior Analysis
                if class_id == 1:  # unauthorized
                    behavior, behavior_risk = analyze_behavior(
                        enhanced_frame, [x1, y1, x2, y2]
                    )
                    unauthorized_count += 1
                else:
                    behavior = 'Authorized Personnel'
                    behavior_risk = 0.0

                # Step 4 — Threat Score
                threat_score = calculate_threat_score(
                    detection_class=class_id,
                    behavior_risk=behavior_risk,
                    group_size=unauthorized_count
                )

                threat_level = get_threat_level(threat_score)

                detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'confidence': round(confidence, 3),
                    'class_id': class_id,
                    'class_name': class_name,
                    'label': 'UNAUTHORIZED' if class_id == 1
                             else 'AUTHORIZED',
                    'behavior': behavior,
                    'behavior_risk': behavior_risk,
                    'threat_score': threat_score,
                    'threat_level': threat_level
                })

        return {
            'success': True,
            'detections': detections,
            'total_detections': len(detections),
            'unauthorized_count': unauthorized_count,
            'clahe_applied': True,
            'timestamp': datetime.datetime.now().isoformat()
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'detections': []
        }