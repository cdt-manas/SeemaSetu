# analysis.py — CSV analysis routes

from flask import Blueprint, request, jsonify
import os
import json

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analysis/upload', methods=['POST'])
def upload_csv():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Only CSV files allowed'}), 400

        # Save file temporarily
        filepath = f"/tmp/{file.filename}"
        file.save(filepath)

        return jsonify({
            'success': True,
            'filepath': filepath,
            'filename': file.filename
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/analysis/analyze', methods=['POST'])
def analyze():
    try:
        from utils.csv_helper import analyze_csv
        data = request.get_json()
        filepath = data.get('filepath')
        column_mapping = data.get('column_mapping', {})

        if not filepath or not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404

        result = analyze_csv(filepath, column_mapping)
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500