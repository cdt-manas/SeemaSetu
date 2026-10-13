import React, { useState, useEffect } from 'react';
import { 
  Archive, Image as ImageIcon, Video, Calendar, 
  Search, ChevronDown, Eye, Download, MoreHorizontal,
  X, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { fetchEvidence } from './api';

export default function EvidenceVaultPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedEvd, setSelectedEvd] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvidence();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadEvidence();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadEvidence = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchEvidence();
    if (result.success) {
      setEvidence(result.evidence);
    } else {
      setError('Failed to load evidence');
    }
    setLoading(false);
  };

  // Filter Logic
  const filteredData = evidence.filter(evd => {
    // Search
    const q = searchQuery.toLowerCase();
    const matchesSearch = (evd.evidence_id || '').toLowerCase().includes(q) || 
                          (evd.camera_id || '').toLowerCase().includes(q) || 
                          (evd.zone || '').toLowerCase().includes(q) ||
                          (evd.location || '').toLowerCase().includes(q) ||
                          (evd.detection || '').toLowerCase().includes(q);
    // Type Filter
    const matchesType = typeFilter === 'All' || evd.type === typeFilter.toUpperCase();
    
    return matchesSearch && matchesType;
  });

  // Handle Export
  const handleExport = (e) => {
    if (e) e.stopPropagation();
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  // Keyboard shortcut (ESC to close modal)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setSelectedEvd(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (selectedEvd) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedEvd]);

  // Derived stats
  const imgCount = evidence.filter(e => e.type === 'IMAGE').length;
  const vidCount = evidence.filter(e => e.type === 'VIDEO').length;
  const thisWeekCount = evidence.filter(e => {
    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - new Date(e.timestamp).getTime()) < msInWeek;
  }).length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200 relative min-h-[calc(100vh-140px)]">
      
      {/* Page Header */}
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-[#0F172A]">Evidence Vault</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1 flex items-center gap-2">
            Logged incidents and saved evidence
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1"><RefreshCw size={10} className="animate-spin-slow" /> Auto-refreshing every 30s</span>
          </p>
        </div>
        <button onClick={loadEvidence} className="text-[#64748B] hover:text-[#0F172A] p-2 bg-white rounded-lg border border-[#E2E8F0] shadow-sm transition-colors" title="Refresh Evidence">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-sm">
          <Archive className="w-4 h-4 text-[#64748B]" />
          <span className="text-[13px] font-bold text-[#0F172A]">Total Evidence: <span className="font-medium text-[#64748B]">{evidence.length}</span></span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-sm">
          <ImageIcon className="w-4 h-4 text-[#64748B]" />
          <span className="text-[13px] font-bold text-[#0F172A]">Images: <span className="font-medium text-[#64748B]">{imgCount}</span></span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-sm">
          <Video className="w-4 h-4 text-[#64748B]" />
          <span className="text-[13px] font-bold text-[#0F172A]">Video Clips: <span className="font-medium text-[#64748B]">{vidCount}</span></span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-sm">
          <Calendar className="w-4 h-4 text-[#64748B]" />
          <span className="text-[13px] font-bold text-[#0F172A]">This Week: <span className="font-medium text-[#64748B]">{thisWeekCount}</span></span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-[350px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input 
            type="text" 
            placeholder="Search by ID, zone, camera..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8F9FC] border border-[#E2E8F0] rounded-lg text-[13px] focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#0F172A] hover:bg-slate-50 transition-colors">
            All Time <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>

          <div className="flex items-center gap-1 bg-[#F8F9FC] border border-[#E2E8F0] rounded-lg p-1">
            {['All', 'Image', 'Video'].map(t => (
              <button 
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-[12px] font-bold rounded-md transition-colors ${typeFilter === t ? 'bg-[#FFFFFF] text-[#0F172A] shadow-sm border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A] border border-transparent'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#0F172A] hover:bg-slate-50 transition-colors">
            All Zones <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>
          
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#0F172A] hover:bg-slate-50 transition-colors">
            Newest First <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>
      </div>

      {/* Main Content - Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className="animate-pulse bg-slate-100 border border-[#E2E8F0] rounded-xl h-64" />
          ))
        ) : error ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-16 bg-white border border-[#E2E8F0] rounded-xl">
            <AlertCircle className="mx-auto mb-3 text-red-400" size={48} />
            <p className="text-red-500 font-medium text-[15px]">Failed to load evidence</p>
            <button onClick={loadEvidence} className="mt-3 text-blue-600 text-[13px] font-bold hover:underline">
              Try Again
            </button>
          </div>
        ) : evidence.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-16 bg-white border border-[#E2E8F0] rounded-xl">
            <Archive className="mx-auto mb-3 text-slate-300" size={48} />
            <p className="text-[#64748B] font-medium text-[15px]">No evidence recorded yet</p>
            <p className="text-[#94A3B8] text-[13px] mt-1">Evidence is automatically saved when detection occurs in Live Feed</p>
          </div>
        ) : (
          filteredData.map(evd => {
            let threatText = evd.threat_level === 'HIGH' ? 'text-red-700 bg-red-100' : evd.threat_level === 'MEDIUM' ? 'text-amber-700 bg-amber-100' : 'text-green-700 bg-green-100';

            return (
              <div key={evd.id} className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-shadow duration-200 flex flex-col group">
                
                {/* TOP - Thumbnail Area */}
                <div className="relative w-full aspect-[4/3] bg-[#0F172A] rounded-t-xl overflow-hidden flex items-center justify-center cursor-pointer" onClick={() => setSelectedEvd(evd)}>
                  
                  {/* Simulated image/video */}
                  {evd.image_url ? (
                      <img 
                          src={evd.image_url} 
                          alt={evd.evidence_id}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                              e.target.style.display = 'none';
                          }}
                      />
                  ) : evd.type === 'IMAGE' ? (
                      <ImageIcon className="w-10 h-10 text-white/20" />
                  ) : (
                      <Video className="w-10 h-10 text-white/20" />
                  )}

                  {/* Overlays */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${evd.type === 'IMAGE' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                      {evd.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${threatText}`}>
                      {evd.threat_level}
                    </span>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="absolute bottom-0 left-0 w-full p-3 pt-6 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="text-[11px] font-medium text-white/90 drop-shadow-md">
                      {new Date(evd.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* BOTTOM - Card Info */}
                <div className="p-4 flex flex-col gap-2 flex-1 cursor-default">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[14px] font-bold text-[#0F172A]">{evd.evidence_id}</h3>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-medium text-[#64748B] truncate">{evd.camera_id} — {evd.location}</p>
                    <p className="text-[12px] font-medium text-[#64748B] truncate">{evd.zone}</p>
                  </div>
                  <div className="mt-2 text-[12px] font-bold text-[#0F172A]">
                    {evd.detection}
                  </div>
                  
                  <div className="h-px w-full bg-[#E2E8F0] my-3"></div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedEvd(evd)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button 
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-[#64748B]" /> Export
                      </button>
                    </div>
                    <button className="p-1.5 text-[#64748B] hover:bg-slate-100 rounded-md transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* No Filter Results */}
        {!loading && !error && evidence.length > 0 && filteredData.length === 0 && (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-12 text-center text-[#64748B] text-[14px] bg-white rounded-xl border border-[#E2E8F0]">
            No evidence matches your filters.
          </div>
        )}
      </div>

      {/* --- EVIDENCE MODAL --- */}
      {selectedEvd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/70 animate-in fade-in duration-200"
            onClick={() => setSelectedEvd(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-[800px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[18px] font-bold text-[#0F172A]">Evidence Details</h2>
              <button 
                onClick={() => setSelectedEvd(null)}
                className="p-2 text-[#64748B] hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row">
              
              {/* Left Side - Large Thumbnail */}
              <div className="w-full md:w-[45%] bg-[#0F172A] min-h-[250px] flex items-center justify-center relative">
                {selectedEvd.image_url ? (
                    <img 
                        src={selectedEvd.image_url}
                        alt={selectedEvd.evidence_id}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                ) : selectedEvd.type === 'IMAGE' ? (
                    <ImageIcon className="w-16 h-16 text-white/20" />
                ) : (
                    <Video className="w-16 h-16 text-white/20" />
                )}
                <div className="absolute top-4 left-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${selectedEvd.type === 'IMAGE' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                    {selectedEvd.type}
                  </span>
                </div>
              </div>

              {/* Right Side - Details */}
              <div className="flex-1 p-6 flex flex-col bg-[#F8F9FC]">
                
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-[22px] font-bold text-[#0F172A]">{selectedEvd.evidence_id}</h3>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                    selectedEvd.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                    selectedEvd.status === 'False Alarm' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedEvd.status}
                  </span>
                </div>
                
                <div className="h-px w-full bg-[#E2E8F0] mb-4"></div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Camera ID</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{selectedEvd.camera_id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Location</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{selectedEvd.location}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Zone</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{selectedEvd.zone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Date & Time</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{new Date(selectedEvd.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Detection Type</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{selectedEvd.detection}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Confidence Score</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{Math.round(selectedEvd.confidence * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Threat Level</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedEvd.threat_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                      selectedEvd.threat_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedEvd.threat_level}
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-[#E2E8F0] my-6"></div>

                <div className="flex flex-col gap-2 mt-auto">
                  <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#2563EB] hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg transition-colors">
                    <Download className="w-4 h-4" /> Export Evidence
                  </button>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 px-3 border border-[#EF4444] text-[#EF4444] hover:bg-red-50 text-[12px] font-bold rounded-lg transition-colors text-center">
                      Mark False Alarm
                    </button>
                    <button className="flex-1 py-2 px-3 border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 text-[12px] font-bold rounded-lg transition-colors text-center shadow-sm">
                      Add to Case File
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toastVisible && (
        <div className="fixed bottom-6 right-6 bg-white border border-[#E2E8F0] shadow-lg rounded-lg p-4 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
          </div>
          <p className="text-[14px] font-bold text-[#0F172A]">Evidence exported successfully</p>
        </div>
      )}

    </div>
  );
}
