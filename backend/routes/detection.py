# detection.py — YOLOv8 detection routes

from flask import Blueprint, request, jsonify
from utils.yolo_helper import detect_from_frame
from utils.firebase_helper import save_alert, save_evidence
import datetime
import uuid
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name = "awlsgzcf",
    api_key = "319668893346691",
    api_secret = "eoesoT999CxMiT2vTqLCEz0ZfII"
)

def upload_frame_to_cloudinary(frame_data, evidence_id):
    """
    Upload base64 frame to Cloudinary
    Returns public URL of uploaded image
    """
    try:
        # Upload base64 image directly to Cloudinary
        upload_result = cloudinary.uploader.upload(
            frame_data,
            public_id=f"seema-setu/evidence/{evidence_id}",
            folder="seema-setu",
            resource_type="image",
            format="jpg",
            transformation=[
                {"width": 640, "height": 480, "crop": "fit"},
                {"quality": "auto"}
            ]
        )
        return upload_result.get('secure_url', None)
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None

detection_bp = Blueprint('detection', __name__)

@detection_bp.route('/detect', methods=['POST'])
def detect():
    """
    Receives base64 frame from frontend laptop camera
    Runs YOLOv8 detection
    Saves alert and evidence if unauthorized detected
    """
    try:
        data = request.get_json()
        frame_data = data.get('frame')
        camera_id = data.get('camera_id', 'LAPTOP-CAM-01')

        if not frame_data:
            return jsonify({'error': 'No frame provided'}), 400

        # Run detection
        result = detect_from_frame(frame_data)

        if not result['success']:
            return jsonify(result), 500

        # If unauthorized detected — save alert + evidence
        unauthorized = [
            d for d in result['detections']
            if d['label'] == 'UNAUTHORIZED'
        ]

        if unauthorized:
            # Save alert
            alert_data = {
                'alert_id': f"ALT-{uuid.uuid4().hex[:6].upper()}",
                'camera_id': camera_id,
                'location': 'Demo — Laptop Camera',
                'zone': 'Demo Zone',
                'threat_level': unauthorized[0]['threat_level'],
                'detection_type': 'Unauthorized Individual',
                'confidence': unauthorized[0]['confidence'],
                'status': 'Pending',
                'detections': unauthorized
            }
            alert_id = save_alert(alert_data)

            # Save evidence
            evidence_id = f"EVD-{uuid.uuid4().hex[:6].upper()}"
            
            # Upload frame to Cloudinary
            image_url = upload_frame_to_cloudinary(frame_data, evidence_id)
            
            evidence_data = {
                'evidence_id': evidence_id,
                'alert_id': alert_id,
                'camera_id': camera_id,
                'location': 'Demo — Laptop Camera',
                'zone': 'Demo Zone',
                'type': 'IMAGE',
                'threat_level': unauthorized[0]['threat_level'],
                'detection': 'Unauthorized Individual',
                'behavior': unauthorized[0].get('behavior', 'Unknown'),
                'confidence': unauthorized[0]['confidence'],
                'threat_score': unauthorized[0].get('threat_score', 0),
                'status': 'Pending',
                'image_url': image_url  # Cloudinary URL
            }
            save_evidence(evidence_data)

            result['alert_saved'] = True
            result['alert_id'] = alert_id

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@detection_bp.route('/evidence', methods=['GET'])
def fetch_evidence():
    try:
        from utils.firebase_helper import get_evidence
        limit = request.args.get('limit', 50, type=int)
        evidence = get_evidence(limit)
        return jsonify({'success': True, 'evidence': evidence})
    except Exception as e:
        return jsonify({'error': str(e)}), 500