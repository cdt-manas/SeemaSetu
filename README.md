# 🛡️ Seema Setu — Border Intelligence & Surveillance System

> **Seema Setu** (Hindi: *सीमा सेतु* — "Border Bridge") is a full-stack, AI-powered border surveillance and intelligence platform built for real-time threat detection, refugee case management, and data-driven border analysis.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Project Structure](#-project-structure)
6. [Module Breakdown](#-module-breakdown)
   - [Overview Dashboard](#1-overview-dashboard)
   - [Live Feed](#2-live-feed--ai-detection)
   - [Intelligence Center](#3-intelligence-center)
   - [Evidence Vault](#4-evidence-vault)
   - [Refugee Portal](#5-refugee-portal)
   - [Officer Review](#6-officer-review)
   - [Settings](#7-settings)
7. [Backend API Reference](#-backend-api-reference)
8. [AI Detection Pipeline](#-ai-detection-pipeline)
9. [Database Schema (Firebase)](#-database-schema-firebase)
10. [Cloudinary Integration](#-cloudinary-integration)
11. [Dataset Generation](#-dataset-generation)
12. [Environment Variables](#-environment-variables)
13. [Installation & Setup](#-installation--setup)
14. [Running the Project](#-running-the-project)
15. [Deployment Notes](#-deployment-notes)

---

## 🎯 Project Overview

Seema Setu is a comprehensive border surveillance intelligence platform designed to assist border security forces with:

- **Real-time AI-powered person detection** via YOLOv8 custom model
- **Automatic threat scoring** using weighted behavioral analysis
- **Evidence collection** with Cloudinary image storage
- **Refugee case management** with ML-based credibility scoring
- **Intelligence analysis** of CSV-based surveillance datasets
- **Officer review workflows** for alert and case management

The system consists of a **React + Vite frontend** (SPA) communicating with a **Flask REST API backend**, with **Firebase Firestore** as the primary database and **Cloudinary** for image storage.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎥 Live Camera Detection | Capture laptop/CCTV frames and run YOLOv8 inference in real-time |
| 🧠 CLAHE Enhancement | Night/low-light image enhancement before detection |
| 🚨 Threat Scoring | Weighted formula (detection + behavior + group + zone) |
| 📸 Evidence Auto-Save | Unauthorized detections automatically saved with Cloudinary image URL |
| 🔥 Firebase Realtime | Live alert subscription via Firestore `onSnapshot` |
| 📊 CSV Intelligence | Upload CSV datasets for zone-risk analysis, time-series, and forecast |
| 🧑‍💼 Refugee Portal | Public-facing refugee registration with ML credibility scoring |
| 👮 Officer Review | Full CRUD workflow for officers to manage alerts and refugee cases |
| ♻️ Auto-Refresh | Evidence Vault auto-refreshes every 30 seconds |
| 📱 Responsive UI | Mobile-friendly sidebar with hamburger menu |

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI Framework |
| React Router DOM | 6.22.0 | Client-side Routing |
| Vite | 5.1.4 | Build Tool & Dev Server |
| TailwindCSS | 3.4.1 | Styling |
| Lucide React | 0.344.0 | Icon Library |
| Firebase JS SDK | 10.7.1 (CDN) | Realtime Firestore subscription |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Flask | Latest | REST API Server |
| Flask-CORS | Latest | Cross-Origin Request Handling |
| Ultralytics YOLOv8 | Latest | Object Detection Model |
| OpenCV (cv2) | Latest | Image Processing + CLAHE |
| Firebase Admin SDK | Latest | Firestore CRUD |
| Cloudinary SDK | Latest | Image Upload & Storage |
| scikit-learn | Latest | ML scoring (refugee + CSV) |
| pandas + numpy | Latest | Data analysis (CSV module) |

### Cloud Services
| Service | Purpose |
|---|---|
| Firebase Firestore | Primary database (alerts, evidence, refugee cases) |
| Cloudinary | Evidence image storage |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              React SPA (Vite + TailwindCSS)                 │    │
│  │                                                             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │    │
│  │  │ Overview │ │Live Feed │ │ Intel.   │ │  Evidence    │  │    │
│  │  │Dashboard │ │+ YOLOv8  │ │ Center   │ │  Vault       │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │    │
│  │  │ Refugee  │ │ Officer  │ │ Settings │                   │    │
│  │  │ Portal   │ │ Review   │ │          │                   │    │
│  │  └──────────┘ └──────────┘ └──────────┘                   │    │
│  │                     │                                      │    │
│  │            src/api.js (Central API Layer)                  │    │
│  └───────────────────────────────────────────────────────────-┘    │
│          │ REST calls (fetch)              │ onSnapshot              │
└──────────┼─────────────────────────────────┼────────────────────────┘
           │                                 │
           ▼                                 ▼
┌──────────────────────┐        ┌────────────────────────┐
│   Flask Backend       │        │  Firebase Firestore     │
│   (Port 5000)         │◄──────►│  (Cloud Database)      │
│                       │        │                        │
│  /api/detect          │        │  collections:          │
│  /api/evidence        │        │  - alerts              │
│  /api/alerts          │        │  - evidence            │
│  /api/refugee/*       │        │  - refugee_cases       │
│  /api/analysis/*      │        └────────────────────────┘
│  /api/health          │
└──────────┬────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│          YOLOv8 + CLAHE Pipeline         │
│                                          │
│  Base64 Frame                            │
│      → CLAHE Night Enhancement           │
│      → YOLOv8 Inference (best.pt)        │
│      → Rule-based Behavior Analysis      │
│      → Weighted Threat Scoring           │
│      → Cloudinary Image Upload           │
│      → Firebase Evidence Save           │
└──────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
SeemaSetu/
│
├── backend/                        # Flask REST API
│   ├── app.py                      # Flask app entry point, blueprint registration
│   ├── config.py                   # Configuration (env vars)
│   ├── serviceAccountKey.json      # Firebase Admin SDK credentials
│   ├── yolov8n.pt                  # Fallback YOLOv8 nano base model
│   │
│   ├── models/
│   │   └── best.pt                 # Custom-trained YOLOv8 weights
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── detection.py            # /detect + /evidence endpoints
│   │   ├── alerts.py               # /alerts endpoints
│   │   ├── refugee.py              # /refugee/* endpoints
│   │   └── analysis.py             # /analysis/* endpoints
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── yolo_helper.py          # CLAHE + YOLOv8 + behavior + threat scoring
│   │   ├── firebase_helper.py      # Firestore CRUD operations
│   │   └── csv_helper.py           # CSV analysis + risk scoring + forecast
│   │
│   └── venv/                       # Python virtual environment
│
├── src/                            # React Frontend (Vite SPA)
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Router, layout, sidebar navigation
│   ├── api.js                      # Central API layer (all fetch calls)
│   ├── index.css                   # Global styles
│   │
│   ├── OverviewPage.jsx            # Dashboard with live stats
│   ├── LiveFeedPage.jsx            # CCTV grid + webcam demo detection
│   ├── IntelligenceCenterPage.jsx  # CSV upload + analysis + charts
│   ├── EvidenceVaultPage.jsx       # Evidence grid + modal + auto-refresh
│   ├── RefugeePortalPage.jsx       # Refugee registration + case tracking
│   ├── OfficerReviewPage.jsx       # Alert + case management for officers
│   └── SettingsPage.jsx            # System configuration panel
│
├── generate_dataset.py             # Script to generate 2500-row synthetic CSV
├── seema_setu_dataset/             # Generated dataset directory
├── index.html                      # HTML entry point
├── package.json                    # Frontend dependencies
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # TailwindCSS configuration
├── postcss.config.js               # PostCSS configuration
├── start.sh                        # One-command startup script
├── .env                            # Frontend environment variables
└── yarn.lock                       # Dependency lockfile
```

---

## 📦 Module Breakdown

### 1. Overview Dashboard
**File:** `src/OverviewPage.jsx`

The command center of the system. Displays:
- Live alert counts (HIGH / MEDIUM / LOW)
- Active cameras count
- Recent alerts list with real-time Firebase `onSnapshot` subscription
- Zone activity summary
- Sector status cards

**Data Source:** Firebase Firestore `alerts` collection via realtime listener.

---

### 2. Live Feed + AI Detection
**File:** `src/LiveFeedPage.jsx`

Two-part page:
1. **Static CCTV Grid** — Shows 6 simulated camera feeds (CAM-01 to CAM-06) across different border sectors. Alert cameras show animated bounding boxes.

2. **Demo Live Detection Section** — Uses the user's laptop webcam:
   - Captures frame every **2 seconds**
   - Encodes as Base64 JPEG
   - Sends to Flask `/api/detect` endpoint
   - Renders real YOLOv8 bounding boxes on the video overlay
   - Shows red alert status bar when `UNAUTHORIZED` is detected
   - Tracks detection count per session

**Camera Zones:**
| Camera | Zone | Terrain |
|---|---|---|
| CAM-01 | Sector 2 - Mizoram Belt | Forest + River |
| CAM-02 | Sector 4 - North Bengal | Plains + Fence Gap |
| CAM-03 | Sector 7 - Assam Corridor | Dense Jungle |
| CAM-04 | Sector 1 - Tripura Border | Semi-Urban |
| CAM-05 | Sector 5 - Manipur Sector | Hill Terrain |
| CAM-06 | Sector 6 - Arunachal Zone | Mountain |

---

### 3. Intelligence Center
**File:** `src/IntelligenceCenterPage.jsx`

A data analysis module where officers can:
- Upload any CSV dataset (surveillance logs, border crossing data, etc.)
- Map CSV columns to analysis types (date, location, category, numeric)
- Receive automated analysis including:
  - **Time-series chart** — weekly activity trends
  - **Zone distribution** — which sectors have the most activity
  - **Category breakdown** — percentage split by incident type
  - **Numeric stats** — min/max/average with trend direction
  - **Risk scores** — per-zone risk levels (LOW / MEDIUM / HIGH / CRITICAL)
  - **AI Alerts** — auto-generated anomaly alerts from data patterns
  - **Forecast** — overall risk and trend prediction

**Backend:** `routes/analysis.py` → `utils/csv_helper.py`

**Demo Dataset:** Run `generate_dataset.py` to generate `seema_setu_demo_dataset.csv` with 2500 rows of realistic border surveillance data.

---

### 4. Evidence Vault
**File:** `src/EvidenceVaultPage.jsx`

A media vault for all captured detection evidence:
- **Auto-loads** from Firebase via `/api/evidence`
- **Auto-refreshes** every 30 seconds
- **Real images** from Cloudinary displayed as card thumbnails (falls back to placeholder icon if no URL)
- **Search** by evidence ID, camera, zone, location, or detection type
- **Filter** by type (Image / Video) and threat level
- **Evidence Modal** — detailed view with full metadata:
  - Evidence ID, Alert ID, Camera ID, Location, Zone
  - Date & Time, Detection Type, Behavior, Confidence Score, Threat Level, Status
  - Full-size Cloudinary image in the modal left panel
- Actions: Export Evidence, Mark False Alarm, Add to Case File

**Evidence is automatically created** by the backend whenever an `UNAUTHORIZED` detection occurs in Live Feed.

---

### 5. Refugee Portal
**File:** `src/RefugeePortalPage.jsx`

A dual-purpose module:

**Public Registration Form:**
- Full name, date of birth, nationality, country of origin
- Reason for asylum (Armed Conflict, Ethnic Violence, Political/Religious Persecution)
- UNHCR registration status
- Document count
- Prior asylum application history
- Emergency contact

**ML Credibility Scoring:** Every submitted case receives a **credibility score (0–100)** computed by the backend:
| Factor | Max Points |
|---|---|
| UNHCR Registration | 25 |
| Document completeness | 20 |
| Country risk index | 20 |
| Reason validity | 15 |
| No prior application | 10 |
| Biometric consistency | 10 |

**Case Tracking:** Applicants can track their case status using their Case ID (format: `R-YEAR-XXXXX`).

---

### 6. Officer Review
**File:** `src/OfficerReviewPage.jsx`

Internal officer dashboard with two tabs:

**Alert Management:**
- View all alerts from Firebase
- Update status: `Pending → Confirmed / False Alarm / Under Review`
- Filter by threat level and status

**Refugee Case Management:**
- View all submitted refugee cases
- Add officer notes
- Update case decisions
- Assign cases to officers
- Filter by status and credibility score

---

### 7. Settings
**File:** `src/SettingsPage.jsx`

System configuration panel including:
- Detection threshold settings
- Zone configuration
- Camera management
- Notification preferences
- System health status

---

## 🌐 Backend API Reference

**Base URL:** `http://127.0.0.1:5000/api`

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check if backend is running |

**Response:**
```json
{ "status": "Seema Setu Backend Running", "version": "1.0.0" }
```

---

### Detection

#### POST `/detect`
Send a video frame for YOLOv8 detection.

**Request Body:**
```json
{
  "frame": "data:image/jpeg;base64,/9j/4AAQ...",
  "camera_id": "LAPTOP-CAM-01"
}
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "bbox": [120.5, 80.2, 340.1, 450.6],
      "confidence": 0.912,
      "class_id": 1,
      "class_name": "unauthorized",
      "label": "UNAUTHORIZED",
      "behavior": "Crawling",
      "behavior_risk": 0.9,
      "threat_score": 0.82,
      "threat_level": "HIGH"
    }
  ],
  "total_detections": 1,
  "unauthorized_count": 1,
  "clahe_applied": true,
  "timestamp": "2024-11-15T14:32:10.123456",
  "alert_saved": true,
  "alert_id": "firestore_doc_id"
}
```

---

#### GET `/evidence?limit=50`
Fetch all stored evidence records.

**Response:**
```json
{
  "success": true,
  "evidence": [
    {
      "id": "firestore_doc_id",
      "evidence_id": "EVD-A1B2C3",
      "alert_id": "ALT-D4E5F6",
      "camera_id": "LAPTOP-CAM-01",
      "location": "Demo — Laptop Camera",
      "zone": "Demo Zone",
      "type": "IMAGE",
      "threat_level": "HIGH",
      "detection": "Unauthorized Individual",
      "behavior": "Crawling",
      "confidence": 0.912,
      "threat_score": 0.82,
      "status": "Pending",
      "image_url": "https://res.cloudinary.com/awlsgzcf/...",
      "timestamp": "2024-11-15T14:32:10.123456"
    }
  ]
}
```

---

### Alerts

#### GET `/alerts?limit=50`
Fetch all alerts ordered by most recent.

#### PATCH `/alerts/<alert_id>`
Update alert status.

**Request Body:**
```json
{ "status": "Confirmed" }
```
Valid statuses: `Confirmed`, `False Alarm`, `Under Review`

---

### Refugee

#### POST `/refugee/register`
Submit a new refugee asylum case.

**Response includes:**
```json
{
  "success": true,
  "case_id": "R-2024-A1B2C",
  "ml_score": 75,
  "doc_id": "firestore_doc_id"
}
```

#### GET `/refugee/track/<case_id>`
Track a case by its ID.

#### GET `/refugee/cases`
List all refugee cases (officer access).

#### PATCH `/refugee/cases/<doc_id>`
Update case details. Allowed fields: `status`, `officer_notes`, `decision`, `assigned_officer`.

---

### Analysis

#### POST `/analysis/upload`
Upload a CSV file.

**Request:** Multipart form with `file` field.

**Response:**
```json
{
  "success": true,
  "filepath": "/tmp/dataset.csv",
  "filename": "dataset.csv"
}
```

#### POST `/analysis/analyze`
Analyze a previously uploaded CSV.

**Request Body:**
```json
{
  "filepath": "/tmp/dataset.csv",
  "column_mapping": {
    "date": "date",
    "zone": "location",
    "incident_type": "category",
    "temperature_celsius": "numeric",
    "humidity_percent": "numeric"
  }
}
```

**Response includes:** `summary`, `time_series`, `zone_distribution`, `category_breakdown`, `numeric_stats`, `risk_scores`, `alerts`, `forecast`.

---

## 🤖 AI Detection Pipeline

Every frame sent to `/api/detect` passes through this 4-step pipeline:

```
Step 1: CLAHE Night Enhancement
   ↓ Convert BGR → LAB color space
   ↓ Apply CLAHE on L (luminance) channel only
   ↓ clipLimit=2.0, tileGridSize=(8,8)
   ↓ Merge back and convert to BGR
   → Enhanced frame (color preserved, brightness improved)

Step 2: YOLOv8 Inference
   ↓ Load custom model: models/best.pt
   ↓ Fallback to yolov8n.pt if custom model fails
   ↓ conf=0.60, iou=0.45
   → Bounding boxes with class IDs (0=authorized, 1=unauthorized)

Step 3: Rule-based Behavior Analysis (bounding box geometry)
   ↓ aspect_ratio = box_width / box_height
   ↓ > 2.0 → Crawling (risk: 0.9)
   ↓ > 1.5 → Crouching (risk: 0.7)
   ↓ Near frame edges → Fence Proximity (risk: 0.6)
   ↓ Near top of frame → Rapid Movement (risk: 0.4)
   ↓ Normal → Standing (risk: 0.1)
   → behavior label + behavior_risk score

Step 4: Weighted Threat Scoring
   Score = 0.40×detection + 0.30×behavior + 0.20×group + 0.10×zone
   
   ≥ 0.75 → HIGH threat
   ≥ 0.50 → MEDIUM threat
   < 0.50 → LOW threat
```

If `UNAUTHORIZED` is detected:
1. Alert is saved to Firebase `alerts` collection
2. Frame is uploaded to **Cloudinary** (`seema-setu/evidence/<evidence_id>`)
3. Evidence record (with Cloudinary URL) is saved to Firebase `evidence` collection

---

## 🗄 Database Schema (Firebase)

### Collection: `alerts`
```
alerts/{doc_id}
├── alert_id          string    "ALT-A1B2C3"
├── camera_id         string    "LAPTOP-CAM-01"
├── location          string    "Demo — Laptop Camera"
├── zone              string    "Demo Zone"
├── threat_level      string    "HIGH" | "MEDIUM" | "LOW"
├── detection_type    string    "Unauthorized Individual"
├── confidence        float     0.912
├── status            string    "Pending" | "Confirmed" | "False Alarm" | "Under Review"
├── detections        array     [{ bbox, confidence, label, behavior, ... }]
└── timestamp         string    ISO 8601
```

### Collection: `evidence`
```
evidence/{doc_id}
├── evidence_id       string    "EVD-A1B2C3"
├── alert_id          string    Firestore alert doc ID
├── camera_id         string    "LAPTOP-CAM-01"
├── location          string    "Demo — Laptop Camera"
├── zone              string    "Demo Zone"
├── type              string    "IMAGE" | "VIDEO"
├── threat_level      string    "HIGH" | "MEDIUM" | "LOW"
├── detection         string    "Unauthorized Individual"
├── behavior          string    "Crawling" | "Crouching" | ...
├── confidence        float     0.912
├── threat_score      float     0.82
├── status            string    "Pending" | "Confirmed" | "False Alarm"
├── image_url         string    Cloudinary secure URL (or null)
└── timestamp         string    ISO 8601
```

### Collection: `refugee_cases`
```
refugee_cases/{doc_id}
├── case_id           string    "R-2024-A1B2C"
├── full_name         string
├── date_of_birth     string
├── nationality       string
├── country_of_origin string
├── reason_for_asylum string
├── unhcr_registered  string    "yes" | "no"
├── docs_submitted    number
├── prior_application boolean
├── ml_score          number    0-100
├── status            string    "Pending" | "Under Review" | "Approved" | "Rejected"
├── officer_notes     string
├── assigned_officer  string
├── decision          string
├── submitted_at      string    ISO 8601
└── updated_at        string    ISO 8601
```

---

## ☁️ Cloudinary Integration

Evidence images are automatically uploaded to Cloudinary when an unauthorized detection occurs.

**Configuration** (in `backend/routes/detection.py`):
```python
cloudinary.config(
    cloud_name = "awlsgzcf",
    api_key    = "319668893346691",
    api_secret = "eoesoT999CxMiT2vTqLCEz0ZfII"
)
```

**Upload Settings:**
- Folder: `seema-setu/evidence/`
- Public ID: `seema-setu/evidence/<evidence_id>`
- Format: JPEG
- Transformation: 640×480, fit crop, auto quality
- Returns: `secure_url` (HTTPS)

Images are displayed in the Evidence Vault cards and modals. If Cloudinary upload fails, `image_url` is `null` and a placeholder icon is shown.

---

## 📊 Dataset Generation

A synthetic dataset of **2,500 rows** covering border surveillance data from January 2023 to November 2024.

**Run:**
```bash
python3 generate_dataset.py
```

**Output:** `seema_setu_demo_dataset.csv`

**Columns:**

| Column | Type | Description |
|---|---|---|
| date | YYYY-MM-DD | Date of incident |
| time | HH:MM | Time of incident |
| zone | string | Border sector |
| terrain | string | Zone terrain type |
| weather | string | Weather conditions |
| temperature_celsius | int | Temperature 12–38°C |
| humidity_percent | int | Humidity 40–95% |
| visibility_km | float | Visibility 0.5–10.0 km |
| wind_speed_kmh | int | Wind speed |
| incident_type | string | Type of border incident |
| severity | string | LOW / MEDIUM / HIGH |
| persons_detected | int | Count of persons detected |
| authorized | int | Authorized personnel count |
| unauthorized | int | Unauthorized persons count |
| alert_triggered | bool | Whether alert was triggered |
| response_time_min | int | Response time in minutes |
| patrol_unit | string | Patrol unit identifier |
| action_taken | string | Action taken by forces |
| confidence_score | float | Detection confidence |
| camera_id | string | Camera that made detection |

**Pattern Logic in Dataset:**
- Night hours (21:00–05:00) have higher unauthorized detection rates
- Rainy/foggy weather increases unauthorized attempts
- Sector 7 (Assam Corridor) is configured as highest-risk zone
- Groups of 3+ persons trigger higher alert probabilities

Use this dataset in the **Intelligence Center** to test the full analysis pipeline.

---

## 🔐 Environment Variables

### Frontend (`.env` in project root)
```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

### Backend
- `backend/serviceAccountKey.json` — Firebase Admin SDK service account credentials
- Cloudinary credentials are currently hardcoded in `detection.py` (move to env for production)

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** ≥ 18 and **Yarn**
- **Python** ≥ 3.9
- **pip** / **virtualenv**
- A **Firebase** project with Firestore enabled
- A **Cloudinary** account

---

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SeemaSetu
```

---

### 2. Frontend Setup
```bash
# Install frontend dependencies
yarn install
```

Create `.env` file in root:
```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

---

### 3. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install Python dependencies
pip install flask flask-cors
pip install ultralytics          # YOLOv8
pip install opencv-python-headless
pip install firebase-admin
pip install cloudinary
pip install scikit-learn pandas numpy
```

---

### 4. Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Cloud Firestore** in your project
3. Go to **Project Settings → Service Accounts → Generate new private key**
4. Save the downloaded JSON as `backend/serviceAccountKey.json`
5. Update `src/api.js` with your Firebase config (the `firebaseConfig` object)

**Required Firestore Collections** (auto-created on first write):
- `alerts`
- `evidence`
- `refugee_cases`

---

### 5. YOLOv8 Model
Place your custom-trained model at:
```
backend/models/best.pt
```

> If `best.pt` is not found, the system automatically falls back to `yolov8n.pt` (base YOLOv8 nano model).

---

## ▶️ Running the Project

### Option A — One Command (Recommended)
```bash
chmod +x start.sh
./start.sh
```

This script:
1. Starts the Flask backend on `http://127.0.0.1:5000`
2. Waits 2 seconds for backend initialization
3. Starts the Vite dev server on `http://localhost:5173`

Press `Ctrl+C` to stop both servers.

---

### Option B — Manual Start

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
python3 app.py
```

**Terminal 2 — Frontend:**
```bash
# From project root
yarn dev
```

---

### Verifying Setup
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend health check: [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

Expected health response:
```json
{ "status": "Seema Setu Backend Running", "version": "1.0.0" }
```

---

## 📦 Deployment Notes

### Frontend Build
```bash
yarn build
# Output in dist/ directory
```

Deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages, Firebase Hosting).

### Backend Deployment
The Flask backend can be deployed to:
- **Google Cloud Run** (recommended for Firebase integration)
- **Railway**
- **Render**
- **AWS EC2 / GCP Compute Engine**

For production, set `debug=False` in `app.py` and use a production WSGI server:
```bash
pip install gunicorn
gunicorn -w 4 app:app
```

> **Important:** Update the CORS origin list in `app.py` to match your production frontend URL.

### Security Checklist for Production
- [ ] Move Cloudinary credentials to environment variables
- [ ] Restrict Firebase Firestore rules to authenticated users
- [ ] Add JWT authentication to Flask API routes
- [ ] Enable HTTPS on all endpoints
- [ ] Remove `debug=True` from Flask

---

## 🗺️ Border Zones Reference

| Zone ID | Zone Name | Terrain | Country Border |
|---|---|---|---|
| Sector 1 | Tripura Border | Semi-Urban | Bangladesh |
| Sector 2 | Mizoram Belt | Forest + River | Bangladesh/Myanmar |
| Sector 4 | North Bengal | Plains + Fence Gap | Bangladesh/Nepal |
| Sector 5 | Manipur Sector | Hill Terrain | Myanmar |
| Sector 6 | Arunachal Zone | Mountain | China |
| Sector 7 | Assam Corridor | Dense Jungle | Bhutan/Bangladesh |

---

## 👥 Role-based Access (Conceptual)

| Role | Access |
|---|---|
| **Admin Officer** | Full access to all modules |
| **Field Officer** | Overview, Live Feed, Evidence Vault |
| **Intelligence Analyst** | Intelligence Center, Overview |
| **Refugee Case Officer** | Refugee Portal, Officer Review |

*Note: Authentication/authorization is not yet implemented. All routes are currently open.*

---

## 📝 License

This project was developed as an academic/demonstration system for border intelligence and surveillance. Not intended for production use without proper security hardening and legal compliance review.

---

*Built with ❤️ for border security intelligence — Seema Setu v1.0*
