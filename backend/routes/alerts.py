# alerts.py — Alert management routes

from flask import Blueprint, request, jsonify
from utils.firebase_helper import get_alerts, update_alert_status

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/alerts', methods=['GET'])
def fetch_alerts():
    try:
        limit = request.args.get('limit', 50, type=int)
        alerts = get_alerts(limit)
        return jsonify({'success': True, 'alerts': alerts})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@alerts_bp.route('/alerts/<alert_id>', methods=['PATCH'])
def update_alert(alert_id):
    try:
        data = request.get_json()
        status = data.get('status')
        if status not in ['Confirmed', 'False Alarm', 'Under Review']:
            return jsonify({'error': 'Invalid status'}), 400
        update_alert_status(alert_id, status)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500