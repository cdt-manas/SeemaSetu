// api.js — Central API layer for Seema Setu
// All Flask backend calls go through here

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── HELPER ──
async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return { success: false, error: error.message };
  }
}

// ── HEALTH ──
export const checkHealth = () =>
  request('/health');

// ── DETECTION ──
export const sendFrameForDetection = (frameBase64, cameraId) =>
  request('/detect', {
    method: 'POST',
    body: JSON.stringify({
      frame: frameBase64,
      camera_id: cameraId
    })
  });

// ── ALERTS ──
export const fetchAlerts = (limit = 50) =>
  request(`/alerts?limit=${limit}`);

export const updateAlertStatus = (alertId, status) =>
  request(`/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

// ── REFUGEE ──
export const registerRefugeeCase = (caseData) =>
  request('/refugee/register', {
    method: 'POST',
    body: JSON.stringify(caseData)
  });

export const trackRefugeeCase = (caseId) =>
  request(`/refugee/track/${caseId}`);

export const fetchRefugeeCases = () =>
  request('/refugee/cases');

export const updateRefugeeCase = (docId, updateData) =>
  request(`/refugee/cases/${docId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });

// ── CSV ANALYSIS ──
export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch(`${BASE_URL}/analysis/upload`, {
      method: 'POST',
      body: formData
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const analyzeCSV = (filepath, columnMapping) =>
  request('/analysis/analyze', {
    method: 'POST',
    body: JSON.stringify({
      filepath,
      column_mapping: columnMapping
    })
  });

// ── EVIDENCE ──
export const fetchEvidence = (limitCount = 50) =>
  request(`/evidence?limit=${limitCount}`);

// ── FIREBASE REALTIME ──
const firebaseConfig = {
  apiKey: "AIzaSyAGMEo6VnS3uj05HbrCuf9uZHvAZ2eG4-w",
  authDomain: "seema-setu.firebaseapp.com",
  projectId: "seema-setu",
  storageBucket: "seema-setu.firebasestorage.app",
  messagingSenderId: "157618637193",
  appId: "1:157618637193:web:39a8bcaa4d0dfaf5c53958"
};

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

export const subscribeToAlerts = (callback, limitCount = 10) => {
  const q = query(
    collection(firestoreDb, 'alerts'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(alerts);
  });
};