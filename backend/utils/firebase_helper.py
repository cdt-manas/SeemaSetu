# firebase_helper.py — Firebase connection and helper functions

import firebase_admin
from firebase_admin import credentials, firestore
import datetime

# Initialize Firebase
def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = None

def get_db():
    global db
    if db is None:
        db = init_firebase()
    return db

# ── ALERTS ──
def save_alert(alert_data):
    db = get_db()
    alert_data['timestamp'] = datetime.datetime.now().isoformat()
    doc_ref = db.collection('alerts').add(alert_data)
    return doc_ref[1].id

def get_alerts(limit=50):
    db = get_db()
    alerts = db.collection('alerts')\
               .order_by('timestamp', direction=firestore.Query.DESCENDING)\
               .limit(limit)\
               .stream()
    return [{'id': a.id, **a.to_dict()} for a in alerts]

def update_alert_status(alert_id, status):
    db = get_db()
    db.collection('alerts').document(alert_id).update({
        'status': status,
        'updated_at': datetime.datetime.now().isoformat()
    })

# ── EVIDENCE ──
def save_evidence(evidence_data):
    db = get_db()
    evidence_data['timestamp'] = datetime.datetime.now().isoformat()
    doc_ref = db.collection('evidence').add(evidence_data)
    return doc_ref[1].id

def get_evidence(limit=50):
    db = get_db()
    evidence = db.collection('evidence')\
                 .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                 .limit(limit)\
                 .stream()
    return [{'id': e.id, **e.to_dict()} for e in evidence]

# ── REFUGEE CASES ──
def save_refugee_case(case_data):
    db = get_db()
    case_data['submitted_at'] = datetime.datetime.now().isoformat()
    case_data['status'] = 'Pending'
    doc_ref = db.collection('refugee_cases').add(case_data)
    return doc_ref[1].id

def get_refugee_cases(limit=50):
    db = get_db()
    cases = db.collection('refugee_cases')\
              .order_by('submitted_at', direction=firestore.Query.DESCENDING)\
              .limit(limit)\
              .stream()
    return [{'id': c.id, **c.to_dict()} for c in cases]

def get_refugee_case_by_id(case_id):
    db = get_db()
    # Search by case_id field
    cases = db.collection('refugee_cases')\
              .where('case_id', '==', case_id)\
              .stream()
    results = [{'id': c.id, **c.to_dict()} for c in cases]
    return results[0] if results else None

def update_refugee_case(doc_id, update_data):
    db = get_db()
    update_data['updated_at'] = datetime.datetime.now().isoformat()
    db.collection('refugee_cases').document(doc_id).update(update_data)