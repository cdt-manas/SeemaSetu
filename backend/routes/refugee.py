# refugee.py — Refugee case management routes

from flask import Blueprint, request, jsonify
from utils.firebase_helper import (
    save_refugee_case,
    get_refugee_cases,
    get_refugee_case_by_id,
    update_refugee_case
)
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import uuid
import datetime

refugee_bp = Blueprint('refugee', __name__)

def calculate_ml_score(case_data):
    """
    Calculate refugee case credibility score
    Using rule-based scoring (will be replaced with trained RF model)
    """
    score = 0

    # UNHCR Registration (25 points)
    if case_data.get('unhcr_registered') == 'yes':
        score += 25

    # Document completeness (20 points)
    docs_submitted = case_data.get('docs_submitted', 0)
    score += min(20, docs_submitted * 5)

    # Country risk index (20 points)
    high_risk_countries = ['Myanmar', 'Afghanistan', 'Syria']
    medium_risk_countries = ['Bangladesh', 'Pakistan', 'Sri Lanka']
    country = case_data.get('country_of_origin', '')
    if country in high_risk_countries:
        score += 20
    elif country in medium_risk_countries:
        score += 12
    else:
        score += 5

    # Reason validity (15 points)
    valid_reasons = ['Armed Conflict', 'Ethnic Violence',
                     'Political Persecution', 'Religious Persecution']
    if case_data.get('reason_for_asylum') in valid_reasons:
        score += 15
    else:
        score += 5

    # Prior application (10 points)
    if not case_data.get('prior_application', False):
        score += 10

    # Biometric consistency (10 points)
    score += 10  # Default — will be photo match later

    return min(100, score)

@refugee_bp.route('/refugee/register', methods=['POST'])
def register_case():
    try:
        data = request.get_json()

        # Generate unique case ID
        case_id = f"R-{datetime.datetime.now().year}-{uuid.uuid4().hex[:5].upper()}"
        data['case_id'] = case_id

        # Calculate ML score
        ml_score = calculate_ml_score(data)
        data['ml_score'] = ml_score

        # Save to Firebase
        doc_id = save_refugee_case(data)

        return jsonify({
            'success': True,
            'case_id': case_id,
            'ml_score': ml_score,
            'doc_id': doc_id
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@refugee_bp.route('/refugee/track/<case_id>', methods=['GET'])
def track_case(case_id):
    try:
        case = get_refugee_case_by_id(case_id)
        if not case:
            return jsonify({'success': False,
                           'message': 'Case not found'}), 404
        return jsonify({'success': True, 'case': case})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@refugee_bp.route('/refugee/cases', methods=['GET'])
def fetch_cases():
    try:
        cases = get_refugee_cases()
        return jsonify({'success': True, 'cases': cases})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@refugee_bp.route('/refugee/cases/<doc_id>', methods=['PATCH'])
def update_case(doc_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        allowed = ['status', 'officer_notes', 
                   'decision', 'assigned_officer']
        update_data = {k: v for k, v in data.items() 
                      if k in allowed}
        
        if not update_data:
            return jsonify({'error': 'No valid fields'}), 400
        
        update_refugee_case(doc_id, update_data)
        
        return jsonify({
            'success': True,
            'updated': update_data
        })
        
    except Exception as e:
        print(f"Update case error: {e}")
        return jsonify({'error': str(e)}), 500