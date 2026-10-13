import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Grid, List, ChevronDown, Camera, 
  Play, Square, AlertCircle, X, ShieldAlert 
} from 'lucide-react';
import { sendFrameForDetection } from './api';

const CAMERAS = [
  { id: "CAM-01", name: "North Gate Alpha", zone: "Sector 2 - Mizoram Belt", detections: 1, status: "online" },
  { id: "CAM-02", name: "River Crossing Point", zone: "Sector 4 - North Bengal", detections: 5, status: "online" },
  { id: "CAM-03", name: "Jungle Perimeter East", zone: "Sector 7 - Assam Corridor", detections: 3, status: "alert" },
  { id: "CAM-04", name: "Highway Checkpoint", zone: "Sector 1 - Tripura Border", detections: 0, status: "online" },
  { id: "CAM-05", name: "Mountain Pass South", zone: "Sector 5 - Manipur Sector", detections: 2, status: "online" },
  { id: "CAM-06", name: "Border Fence West", zone: "Sector 6 - Arunachal Zone", detections: 0, status: "online" },
];

export default function LiveFeedPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCam, setSelectedCam] = useState(null);
  
  // Webcam State
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Detection State
  const [detecting, setDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState([]);
  const [lastAlert, setLastAlert] = useState(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const detectionIntervalRef = useRef(null);

  // Start detection loop when camera starts
  const startDetectionLoop = () => {
    // Run detection every 2 seconds
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send to Flask backend
      const result = await sendFrameForDetection(
        frameBase64, 
        'LAPTOP-CAM-01'
      );
      
      if (result.success) {
        setDetectionResults(result.detections);
        
        // If unauthorized detected
        const unauthorized = result.detections.filter(
          d => d.label === 'UNAUTHORIZED'
        );
        
        if (unauthorized.length > 0) {
          setDetectionCount(prev => prev + unauthorized.length);
          setLastAlert({
            threat: unauthorized[0].threat_level,
            confidence: unauthorized[0].confidence,
            time: new Date().toLocaleTimeString(),
            count: unauthorized.length
          });
        }
      }
    }, 2000); // Every 2 seconds
  };

  // Stop detection loop when camera stops
  const stopDetectionLoop = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetectionResults([]);
    // Optionally keep last alert or clear it. The instructions said clear results and lastAlert.
    setLastAlert(null);
    setDetectionCount(0); // Also reset count if you prefer, or just leave it. I'll reset on stop.
  };

  // Handle Webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamActive(true);
      setDetectionCount(0); // Reset count on new session start
      startDetectionLoop();
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access camera. Please make sure you have granted permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    stopDetectionLoop();
  };


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetectionLoop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="animate-in fade-in duration-200 opacity-100 flex flex-col gap-6 relative">
      
      {/* Inline styles for custom scanline animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(150%); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#0F172A]">Live Feed</h2>
          <div className="flex items-center text-sm font-medium text-[#64748B] mt-1">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] mr-2"></div>
            {CAMERAS.length} Cameras Active
          </div>
        </div>
        
        {/* Top Bar Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#0F172A] hover:bg-slate-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            All Zones <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>
          
          <div className="flex items-center bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Camera — Full View */}
      {selectedCam && (
        <div className="bg-[#FFFFFF] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          <div className="relative w-full aspect-video bg-[#0F172A] flex items-center justify-center overflow-hidden">
            
            {/* Scanline Animation */}
            {selectedCam.status !== 'alert' && (
              <div className="absolute inset-0 w-full h-[200%] bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan pointer-events-none" />
            )}

            {/* Detection Simulation */}
            {selectedCam.status === 'alert' && (
              <div className="absolute top-[20%] left-[30%] w-[40%] h-[60%] border-2 border-[#EF4444] animate-pulse">
                 <div className="absolute -top-6 left-0 bg-[#EF4444] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                   UNAUTHORIZED
                 </div>
              </div>
            )}

            {/* Overlays */}
            <button 
              onClick={() => setSelectedCam(null)}
              className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors z-20 backdrop-blur-sm border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute top-4 left-4 bg-black/40 p-2 rounded-lg backdrop-blur-sm border border-white/10">
              <Video className="w-5 h-5 text-white/90" />
            </div>
            <div className="absolute top-4 right-16 flex items-center px-2 py-1.5 rounded bg-black/40 backdrop-blur-sm border border-white/10">
              <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse mr-2" />
              <span className="text-[10px] font-bold text-[#EF4444] tracking-wider">LIVE</span>
            </div>
            <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10">
              <h3 className="text-white font-bold text-[18px] mb-0.5">{selectedCam.name}</h3>
              <p className="text-white/70 text-[13px] font-medium">{selectedCam.id} | {selectedCam.zone}</p>
            </div>
          </div>
          
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[#F8F9FC] border-t border-[#E2E8F0]">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedCam.status === 'alert' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
                  <span className={`text-[14px] font-bold ${selectedCam.status === 'alert' ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                    {selectedCam.status === 'alert' ? 'ALERT ACTIVE' : 'ONLINE'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Detections Today</p>
                <p className="text-[14px] font-bold text-[#0F172A]">{selectedCam.detections}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Last Detection</p>
                <p className="text-[14px] font-bold text-[#0F172A]">{selectedCam.detections > 0 ? '14 mins ago' : '—'}</p>
              </div>
            </div>
            <button className="px-5 py-2.5 bg-[#FFFFFF] border border-[#2563EB] text-[#2563EB] text-[13px] font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap">
              View in Evidence Vault
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
        {CAMERAS.map((cam) => {
          const isAlert = cam.status === 'alert';
          const isSelected = selectedCam?.id === cam.id;
          
          return (
            <div 
              key={cam.id} 
              onClick={() => setSelectedCam(cam)}
              className={`
                bg-[#FFFFFF] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 relative
                ${isSelected ? 'ring-2 ring-[#2563EB] ring-offset-2' : ''}
                ${isAlert 
                  ? 'border-2 border-[#EF4444] shadow-[0_4px_12px_rgba(239,68,68,0.15)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.25)]' 
                  : 'border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-lg'
                }
              `}
            >
              {/* TOP SECTION - Video Feed */}
              <div className="relative w-full aspect-video bg-[#0F172A] overflow-hidden group">
                
                {/* Scanline Animation */}
                {!isAlert && (
                  <div className="absolute inset-0 w-full h-[200%] bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan pointer-events-none" />
                )}

                {/* Detection Simulation */}
                {isAlert && (
                  <div className="absolute top-[20%] left-[30%] w-[40%] h-[60%] border-2 border-[#EF4444] animate-pulse">
                     <div className="absolute -top-6 left-0 bg-[#EF4444] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                       UNAUTHORIZED
                     </div>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute top-3 left-3">
                  <Video className="w-4 h-4 text-white/80" />
                </div>
                <div className="absolute top-3 right-3 flex items-center px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse mr-1.5" />
                  <span className="text-[9px] font-bold text-[#EF4444] tracking-wider">LIVE</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-md max-w-[80%] border border-white/10">
                  <p className="text-white text-[11px] font-medium truncate">
                    {cam.id} | {cam.zone}
                  </p>
                </div>
              </div>

              {/* BOTTOM SECTION - Info Bar */}
              <div className={`p-4 flex items-center justify-between ${isAlert ? 'bg-red-50/40' : ''}`}>
                <div className="flex flex-col overflow-hidden mr-2">
                  <h3 className="text-[13px] font-semibold text-[#0F172A] truncate">{cam.name}</h3>
                  <p className="text-[12px] text-[#64748B] truncate mt-0.5">{cam.zone}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isAlert ? 'bg-[#EF4444] text-white' : 'bg-green-100 text-green-700'}`}>
                    {cam.status}
                  </span>
                  <span className="text-[11px] font-medium text-[#64748B]">
                    {cam.detections} detections
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo Section */}
      <div className="bg-[#FFFFFF] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden mt-4 mb-8">
        <div className="p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-[#0F172A]">Demo — Live Detection Feed</h3>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">BETA</span>
          </div>
          <p className="text-[13px] text-[#64748B] mt-1.5">
            Connect your laptop camera to simulate real-time border surveillance detection via YOLOv8 backend
          </p>
        </div>

        <div className="p-6 pt-4">
          
          {/* Detection Status Bar */}
          <div className="max-w-4xl mx-auto mb-4">
            {!webcamActive ? (
              <div className="bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl p-4 text-center">
                <span className="text-[13px] font-medium text-[#94A3B8]">Camera offline — Start camera to begin detection</span>
              </div>
            ) : lastAlert ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-2 rounded-lg animate-pulse">
                    <ShieldAlert className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> UNAUTHORIZED INDIVIDUAL DETECTED
                    </h4>
                    <p className="text-[12px] font-medium text-red-600 mt-0.5">Detected at {lastAlert.time} • Confidence: {Math.round(lastAlert.confidence * 100)}%</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-red-200 text-red-800 text-[11px] font-bold rounded-lg uppercase tracking-wider border border-red-300 shadow-sm shrink-0">
                  THREAT: {lastAlert.threat}
                </span>
              </div>
            ) : (
              <div className="bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#22C55E] rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  <span className="text-[13px] font-bold text-[#0F172A]">Scanning... No threats detected</span>
                </div>
                <span className="text-[11px] font-medium text-[#64748B]">Detection runs every 2 seconds</span>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="max-w-4xl mx-auto flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[12px] font-bold text-[#0F172A] shadow-sm">
              Detections This Session: <span className="text-[#2563EB] ml-1">{detectionCount}</span>
            </span>
            <span className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[12px] font-bold text-[#0F172A] shadow-sm">
              Last Detection: <span className="text-[#64748B] font-medium ml-1">{lastAlert?.time || 'None'}</span>
            </span>
            <span className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[12px] font-bold text-[#0F172A] shadow-sm flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${webcamActive ? 'bg-[#22C55E]' : 'bg-[#94A3B8]'}`}></div>
              Model: YOLOv8 &bull; Backend Connected
            </span>
          </div>

          {/* Video Area */}
          <div className="relative w-full max-w-4xl mx-auto aspect-video bg-[#0F172A] rounded-xl overflow-hidden flex items-center justify-center border border-[#E2E8F0] shadow-inner mb-6">
            <canvas ref={canvasRef} className="hidden" />
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${webcamActive ? 'block' : 'hidden'}`} 
            />
            
            {!webcamActive && (
              <div className="flex flex-col items-center text-slate-500 bg-slate-50/5 p-12 rounded-2xl">
                <Camera className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-[14px] font-medium text-slate-400">Click 'Start Camera' to begin demo</p>
              </div>
            )}

            {/* Overlays when active */}
            {webcamActive && (
               <div className="absolute top-4 right-4 flex items-center px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 z-10">
                 <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse mr-2" />
                 <span className="text-[10px] font-bold text-white tracking-wider">REC</span>
               </div>
            )}
            
            {/* Real YOLOv8 bounding boxes overlay */}
            {webcamActive && detectionResults.map((detection, index) => (
              <div
                key={index}
                className="pointer-events-none"
                style={{
                  position: 'absolute',
                  left: `${(detection.bbox[0] / 640) * 100}%`,
                  top: `${(detection.bbox[1] / 480) * 100}%`,
                  width: `${((detection.bbox[2] - detection.bbox[0]) / 640) * 100}%`,
                  height: `${((detection.bbox[3] - detection.bbox[1]) / 480) * 100}%`,
                  border: `2px solid ${detection.label === 'UNAUTHORIZED' ? '#EF4444' : '#22C55E'}`,
                }}
              >
                <span style={{
                  background: detection.label === 'UNAUTHORIZED' ? '#EF4444' : '#22C55E',
                  color: 'white',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  position: 'absolute',
                  top: '-18px',
                  left: '0',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {detection.label} {Math.round(detection.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>

          {/* Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto bg-[#F8F9FC] p-4 rounded-xl border border-[#E2E8F0]">
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={startCamera}
                disabled={webcamActive}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm ${
                  webcamActive 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                    : 'bg-[#2563EB] text-white hover:bg-blue-700 border border-[#2563EB]'
                }`}
              >
                <Play className="w-4 h-4" /> Start Camera
              </button>
              <button 
                onClick={stopCamera}
                disabled={!webcamActive}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                  !webcamActive 
                    ? 'border border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50' 
                    : 'border border-[#E2E8F0] text-[#0F172A] hover:bg-white bg-white shadow-sm'
                }`}
              >
                <Square className="w-4 h-4" /> Stop Camera
              </button>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm">
              <div className={`w-2 h-2 rounded-full ${webcamActive ? 'bg-[#22C55E] animate-pulse' : 'bg-[#64748B]'}`}></div>
              <span className={`text-[12px] font-bold uppercase tracking-wider ${webcamActive ? 'text-[#22C55E]' : 'text-[#64748B]'}`}>
                {webcamActive ? 'Camera Active' : 'Camera Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
