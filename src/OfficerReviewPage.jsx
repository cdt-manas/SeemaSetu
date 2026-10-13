import React, { useState, useEffect } from 'react';
import { 
  Search, ClipboardCheck, ArrowLeft, CheckCircle2, 
  XCircle, AlertCircle, FileText, Bot, FileCheck, 
  AlertTriangle, Check, X, Send, Eye, Users, Loader2
} from 'lucide-react';
import { fetchRefugeeCases, updateRefugeeCase } from './api';

export default function OfficerReviewPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  
  // Detail View State
  const [activeTab, setActiveTab] = useState('overview');
  const [officerNotes, setOfficerNotes] = useState('');
  const [confirmDecision, setConfirmDecision] = useState(null); 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [verifiedDocs, setVerifiedDocs] = useState({}); // { [caseId_docIndex]: boolean }
  const [decisionLoading, setDecisionLoading] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchRefugeeCases();
    if (result.success) {
      setCases(result.cases);
    } else {
      setError('Failed to load cases');
    }
    setLoading(false);
  };

  const selectedCase = cases.find(c => c.id === selectedId);

  // Stats
  const filterCounts = {
    All: cases.length,
    Pending: cases.filter(c => c.status === 'Pending').length,
    'Under Review': cases.filter(c => c.status === 'Under Review').length,
    Approved: cases.filter(c => c.status === 'Approved').length,
    Rejected: cases.filter(c => c.status === 'Rejected').length,
  };

  // Filtered List
  const filteredCases = cases.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = (c.full_name || '').toLowerCase().includes(q) || (c.case_id || '').toLowerCase().includes(q);
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const showToast = (type) => {
    setToast({
      type: type,
      text: type === 'approved' ? `Case ${selectedCase?.case_id} approved successfully` 
          : type === 'rejected' ? `Case ${selectedCase?.case_id} rejected successfully`
          : 'Additional documents requested'
    });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirmDecision = async (decision) => {
    // Safety checks
    if (!selectedCase) {
      console.error('No case selected');
      return;
    }
    
    if (!selectedCase.id) {
      console.error('Case has no document ID:', selectedCase);
      return;
    }
  
    if (!officerNotes.trim()) {
      alert('Please add officer notes before making a decision');
      return;
    }
  
    setDecisionLoading(true);
  
    try {
      const updateData = {
        status: decision,
        officer_notes: officerNotes,
        decision: decision,
        assigned_officer: 'BCU-047'
      };
  
      console.log('Updating case:', selectedCase.id, updateData);
  
      const result = await updateRefugeeCase(
        selectedCase.id,
        updateData
      );
  
      console.log('Update result:', result);
  
      if (result.success) {
        // Update in cases list
        setCases(prev => prev.map(c =>
          c.id === selectedCase.id
            ? { ...c, ...updateData }
            : c
        ));
  
        // Update selected case
        // React handles this implicitly because selectedCase is derived from `cases`, 
        // but we'll let the list update drive it.
  
        // Close modal
        setShowConfirmModal(false);
        setConfirmDecision(null);
  
        // Show toast
        if (decision === 'Approved') {
          showToast('approved');
        } else if (decision === 'Rejected') {
          showToast('rejected');
        }
      } else {
        console.error('Update failed:', result);
        alert('Failed to update: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Exception during update:', err);
      alert('Error: ' + err.message);
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleRequestMoreInfo = async () => {
    if (!selectedCase || !selectedCase.id) return;
  
    try {
      const result = await updateRefugeeCase(
        selectedCase.id,
        { 
          status: 'Under Review', 
          officer_notes: officerNotes || 'Additional documents requested'
        }
      );
  
      if (result.success) {
        setCases(prev => prev.map(c =>
          c.id === selectedCase.id
            ? { ...c, status: 'Under Review', officer_notes: officerNotes || 'Additional documents requested' }
            : c
        ));
        showToast('request');
      } else {
        alert('Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Helper for Score Color
  const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-[#22C55E]' };
    if (score >= 50) return { text: 'text-amber-700', bg: 'bg-amber-100', border: 'border-[#F59E0B]' };
    return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-[#EF4444]' };
  };

  // Helper for Status Color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'text-green-700 bg-green-50 border-green-200';
      case 'Rejected': return 'text-red-700 bg-red-50 border-red-200';
      case 'Under Review': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Pending': default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFlag = (country) => {
    const flags = { Myanmar: '🇲🇲', Bangladesh: '🇧🇩', Afghanistan: '🇦🇫', Nepal: '🇳🇵', 'Sri Lanka': '🇱🇰', Pakistan: '🇵🇰' };
    return flags[country] || '🏳️';
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden animate-in fade-in duration-200">
      
      {/* ============================== */}
      {/* LEFT PANEL: Case List          */}
      {/* ============================== */}
      <div className={`w-full md:w-[320px] lg:w-[380px] flex flex-col border-r border-[#E2E8F0] bg-[#F8F9FC] ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Top of Panel */}
        <div className="p-4 border-b border-[#E2E8F0] bg-white z-10 shadow-sm">
          <h2 className="text-[18px] font-bold text-[#0F172A] mb-1">Refugee Cases</h2>
          <p className="text-[12px] font-medium text-[#64748B] mb-4">{filterCounts.All} total &bull; {filterCounts.Pending} pending review</p>
          
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input 
              type="text" 
              placeholder="Search cases..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F1F5F9] border border-transparent rounded-lg text-[13px] font-medium text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder-[#94A3B8]"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center overflow-x-auto hide-scrollbar border-b border-[#E2E8F0] bg-white px-2">
          {['All', 'Pending', 'Under Review', 'Approved', 'Rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-3 text-[12px] font-bold transition-all border-b-[3px] whitespace-nowrap ${filter === f ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
            >
              {f} ({filterCounts[f]})
            </button>
          ))}
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-xl h-16 bg-slate-200"></div>
              ))}
            </div>
          ) : error ? (
            <div className="m-4 p-6 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
              <p className="text-red-700 text-[14px] font-bold mb-4">{error}</p>
              <button 
                onClick={loadCases} 
                className="px-6 py-2 bg-white text-red-700 text-[13px] font-bold rounded-lg border border-red-200 hover:bg-red-100 shadow-sm transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-8 flex flex-col items-center text-center text-[#64748B] text-[13px] font-medium">
              <Users className="w-10 h-10 mb-3 opacity-50" />
              <p>No cases found</p>
            </div>
          ) : (
            filteredCases.map((c, i) => {
              const sc = getScoreColor(c.ml_score || 0);
              const initial = c.full_name ? c.full_name.charAt(0).toUpperCase() : '?';
              const isSelected = selectedId === c.id;
              const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700', 'bg-rose-100 text-rose-700'];
              const avatarColor = colors[i % colors.length];

              return (
                <div 
                  key={c.id} 
                  onClick={() => { setSelectedId(c.id); setActiveTab('overview'); setOfficerNotes(c.officer_notes || ''); }}
                  className={`p-4 border-b border-[#E2E8F0] cursor-pointer transition-colors flex items-center justify-between group ${isSelected ? 'bg-[#EFF6FF] border-l-[3px] border-l-[#2563EB]' : 'bg-white hover:bg-[#F8F9FC] border-l-[3px] border-l-transparent'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0 ${avatarColor}`}>
                      {initial}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[14px] font-bold text-[#0F172A] truncate">{c.full_name}</span>
                      <span className="text-[12px] font-medium text-[#64748B] mb-0.5">{c.case_id}</span>
                      <span className="text-[11px] text-[#94A3B8] font-medium truncate">{c.country_of_origin} &bull; {c.entry_date || formatTime(c.submitted_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                      Score: {Math.round(c.ml_score || 0)}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================== */}
      {/* RIGHT PANEL: Case Detail       */}
      {/* ============================== */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden relative ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Empty State */}
        {!selectedCase && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <ClipboardCheck className="w-16 h-16 text-[#CBD5E1] mb-4" />
            <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">Select a case to review</h3>
            <p className="text-[14px] text-[#64748B] max-w-sm">Click on any case from the list to view full details and take action.</p>
          </div>
        )}

        {/* Selected State */}
        {selectedCase && (
          <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
            
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[#E2E8F0] bg-[#F8F9FC] shrink-0">
              <button 
                onClick={() => setSelectedId(null)}
                className="md:hidden flex items-center gap-1 text-[13px] font-bold text-[#2563EB] mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back to List
              </button>
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="text-[13px] font-mono font-bold text-[#64748B] mb-1 block">{selectedCase.case_id}</span>
                  <h2 className="text-[24px] font-bold text-[#0F172A] mb-2">{selectedCase.full_name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium text-[#64748B]">
                    <span className="flex items-center gap-1.5"><span className="text-[14px]">{getFlag(selectedCase.country_of_origin)}</span> {selectedCase.country_of_origin}</span>
                    <span>&bull;</span>
                    <span>Entry: {selectedCase.entry_date}</span>
                    <span>&bull;</span>
                    <span>Reason: {selectedCase.reason_for_asylum}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getStatusColor(selectedCase.status)} shadow-sm`}>
                    {selectedCase.status}
                  </span>
                  <span className="text-[11px] font-medium text-[#94A3B8]">Assigned to: Officer BCU-047</span>
                </div>
              </div>
            </div>

            {/* Right Panel Tabs */}
            <div className="flex items-center gap-6 px-6 md:px-8 border-b border-[#E2E8F0] shrink-0">
              {['overview', 'documents', 'ml', 'decision'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`py-4 text-[13px] font-bold transition-all border-b-[3px] uppercase tracking-wider ${activeTab === t ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  {t === 'ml' ? 'ML Assessment' : t}
                </button>
              ))}
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
              
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Personal Details Card */}
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8F9FC]">
                        <h3 className="text-[14px] font-bold text-[#0F172A]">Personal Details</h3>
                      </div>
                      <div className="p-4 flex flex-col gap-3">
                        <DetailRow label="Full Name" value={selectedCase.full_name} />
                        <DetailRow label="Date of Birth" value={selectedCase.date_of_birth || 'N/A'} />
                        <DetailRow label="Gender" value={selectedCase.gender || 'N/A'} />
                        <DetailRow label="Nationality" value={selectedCase.nationality || selectedCase.country_of_origin} />
                        <DetailRow label="Country of Origin" value={selectedCase.country_of_origin} />
                        <DetailRow label="Primary Language" value={selectedCase.primary_language || 'N/A'} />
                        <DetailRow label="Contact" value={selectedCase.contact || 'N/A'} />
                        <DetailRow label="UNHCR Registered" value={(selectedCase.unhcr_registered === 'yes' || selectedCase.unhcr_registered === 'Yes') ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Yes</span> : <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">No</span>} />
                        {(selectedCase.unhcr_registered === 'yes' || selectedCase.unhcr_registered === 'Yes') && <DetailRow label="UNHCR Number" value={selectedCase.unhcr_number || 'N/A'} />}
                        <DetailRow label="Entry Point" value={selectedCase.entry_point} />
                        <DetailRow label="Entry Date" value={selectedCase.entry_date} />
                        <DetailRow label="Reason for Asylum" value={selectedCase.reason_for_asylum} />
                      </div>
                    </div>

                    {/* Case Summary Card */}
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8F9FC]">
                        <h3 className="text-[14px] font-bold text-[#0F172A]">Case Summary</h3>
                      </div>
                      <div className="p-4 flex flex-col gap-4 flex-1">
                        <DetailRow label="Submission Date" value={formatTime(selectedCase.submitted_at)} />
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-bold text-[#64748B]">Documents Submitted</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0F172A]">{selectedCase.docs_submitted || 0} of 4</span>
                            <div className="w-16 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div className="h-full bg-[#2563EB]" style={{ width: `${((selectedCase.docs_submitted || 0)/4)*100}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[13px] py-2 border-y border-[#E2E8F0] my-2">
                          <span className="font-bold text-[#64748B]">ML Score</span>
                          <span className={`text-[20px] font-black ${getScoreColor(selectedCase.ml_score || 0).text}`}>{Math.round(selectedCase.ml_score || 0)}</span>
                        </div>
                        <DetailRow label="Current Status" value={<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusColor(selectedCase.status)}`}>{selectedCase.status}</span>} />
                        <DetailRow label="Assigned Officer" value="BCU-047" />
                      </div>
                    </div>

                  </div>

                  {/* Situation Description */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#E2E8F0] bg-[#F8F9FC]">
                      <h3 className="text-[14px] font-bold text-[#0F172A]">Situation Description</h3>
                    </div>
                    <div className="p-5">
                      <p className="text-[13px] text-[#374151] leading-relaxed font-medium">
                        {selectedCase.situation_description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Submitted Documents ({selectedCase.docs_submitted || 0} of 4)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {['Passport / Travel Document', 'Identity Proof', 'Supporting Evidence'].slice(0, selectedCase.docs_submitted || 0).map((doc, idx) => {
                      const isVerified = verifiedDocs[`${selectedCase.id}_${idx}`];
                      return (
                        <div key={idx} className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col">
                          <div className="h-32 bg-[#0F172A] relative flex items-center justify-center group cursor-pointer overflow-hidden">
                             <FileText className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform duration-300" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Eye className="w-8 h-8 text-white" />
                             </div>
                             {isVerified && (
                               <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-md">
                                 <Check className="w-3 h-3" />
                               </div>
                             )}
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <h4 className="text-[13px] font-bold text-[#0F172A] mb-1">{doc}</h4>
                            <p className="text-[11px] font-medium text-[#64748B] mb-3">document_scan_{idx+1}.pdf</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isVerified ? 'Verified' : 'Pending'}
                              </span>
                              <div className="flex items-center gap-2">
                                {!isVerified && (
                                  <button 
                                    onClick={() => setVerifiedDocs(prev => ({...prev, [`${selectedCase.id}_${idx}`]: true}))}
                                    className="px-2 py-1 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[11px] font-bold text-[#0F172A] rounded transition-colors shadow-sm"
                                  >
                                    Mark Verified
                                  </button>
                                )}
                                <button className="px-2 py-1 bg-[#2563EB] hover:bg-blue-700 text-[11px] font-bold text-white rounded transition-colors shadow-sm">
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Missing Document Slot */}
                    {(selectedCase.docs_submitted || 0) < 4 && (
                      <div className="bg-[#F8F9FC] rounded-xl border-2 border-dashed border-[#CBD5E1] p-6 flex flex-col items-center justify-center text-center h-full">
                        <FileText className="w-8 h-8 text-[#94A3B8] mb-2" />
                        <h4 className="text-[13px] font-bold text-[#64748B] mb-1">Additional Document</h4>
                        <p className="text-[11px] font-medium text-[#94A3B8] mb-4">Not submitted by applicant</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-200 text-slate-500">
                          Not Submitted
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: ML ASSESSMENT */}
              {activeTab === 'ml' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
                  
                  {/* Score Display */}
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center relative shadow-sm border-[8px] ${getScoreColor(selectedCase.ml_score || 0).border} bg-white`}>
                      <span className="text-[48px] font-black text-[#0F172A] leading-none tracking-tighter">{Math.round(selectedCase.ml_score || 0)}</span>
                      <span className="text-[16px] font-bold text-[#64748B] absolute bottom-4 right-4">/100</span>
                    </div>
                    <div className="mt-4 text-[16px] font-bold text-[#0F172A]">
                      {(selectedCase.ml_score || 0) >= 80 ? 'High Credibility' : (selectedCase.ml_score || 0) >= 50 ? 'Moderate Credibility' : 'Low Credibility'}
                    </div>
                  </div>

                  {/* Breakdown Card */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#E2E8F0] bg-[#F8F9FC]">
                      <h3 className="text-[14px] font-bold text-[#0F172A]">What influenced this score</h3>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <MLFactor name="UNHCR Registration" weight={25} value={(selectedCase.unhcr_registered === 'yes' || selectedCase.unhcr_registered === 'Yes') ? "Registered (+)" : "Not Registered"} impact={(selectedCase.unhcr_registered === 'yes' || selectedCase.unhcr_registered === 'Yes') ? "HIGH" : "NEGATIVE"} type={(selectedCase.unhcr_registered === 'yes' || selectedCase.unhcr_registered === 'Yes') ? 'green' : 'amber'} />
                      <MLFactor name="Document Completeness" weight={20} value={`${selectedCase.docs_submitted || 0}/4 docs`} impact={(selectedCase.docs_submitted || 0) === 4 ? "HIGH" : "MEDIUM"} type={(selectedCase.docs_submitted || 0) === 4 ? 'green' : 'amber'} />
                      <MLFactor name="Country Risk Index" weight={20} value={`${selectedCase.country_of_origin} (Risk Area)`} impact="HIGH" type={selectedCase.country_of_origin === 'Myanmar' ? 'red' : 'amber'} />
                      <MLFactor name="Stated Reason Validity" weight={15} value={selectedCase.reason_for_asylum} impact="HIGH" type="green" />
                      <MLFactor name="Prior Application History" weight={10} value="First Application" impact="LOW" type="green" />
                      <MLFactor name="Biometric Consistency" weight={10} value="Photo Match" impact="HIGH" type="green" />
                    </div>
                  </div>

                  {/* Model Info */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-[#2563EB]" />
                      <h3 className="text-[13px] font-bold text-[#0F172A]">Model Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-[12px] font-medium">
                      <span className="text-[#64748B]">Model:</span><span className="text-[#0F172A] font-bold">Random Forest Classifier</span>
                      <span className="text-[#64748B]">Version:</span><span className="text-[#0F172A] font-bold">v1.2.0</span>
                      <span className="text-[#64748B]">Last Trained:</span><span className="text-[#0F172A] font-bold">01 Nov 2024</span>
                      <span className="text-[#64748B]">Training Accuracy:</span><span className="text-[#0F172A] font-bold">91.3%</span>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-medium text-amber-800 leading-relaxed flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <p>This ML score is a decision-support tool only. The final decision must be made by a qualified human officer after thorough review.</p>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: DECISION */}
              {activeTab === 'decision' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${selectedCase.status === 'Approved' ? 'bg-green-50 border-green-200' : selectedCase.status === 'Rejected' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-3">
                      {selectedCase.status === 'Approved' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : selectedCase.status === 'Rejected' ? <XCircle className="w-5 h-5 text-red-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                      <span className={`text-[14px] font-bold uppercase tracking-wider ${selectedCase.status === 'Approved' ? 'text-green-700' : selectedCase.status === 'Rejected' ? 'text-red-700' : 'text-amber-700'}`}>
                        Current Status: {selectedCase.status}
                      </span>
                    </div>
                  </div>

                  {/* Top Readonly Decision Banner */}
                  {(selectedCase.status === 'Approved' || selectedCase.status === 'Rejected') && (
                    <div className={`p-5 rounded-xl border flex flex-col gap-2 shadow-sm ${selectedCase.status === 'Approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                       <h4 className={`text-[15px] font-bold uppercase ${selectedCase.status === 'Approved' ? 'text-green-700' : 'text-red-700'}`}>
                         {selectedCase.status === 'Approved' ? 'This case was approved' : 'This case was rejected'}
                       </h4>
                       <p className="text-[13px] font-medium text-[#0F172A] italic border-t pt-3 mt-1 border-black/10">"{selectedCase.officer_notes || 'No notes provided'}"</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#0F172A]">Officer Notes (required before decision)</label>
                    <div className="relative">
                      <textarea
                        rows="4"
                        value={officerNotes}
                        onChange={(e) => { if(e.target.value.length <= 500) setOfficerNotes(e.target.value) }}
                        disabled={selectedCase.status === 'Approved' || selectedCase.status === 'Rejected' || decisionLoading}
                        className={`w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all shadow-sm resize-none ${
                          (selectedCase.status === 'Approved' || selectedCase.status === 'Rejected' || decisionLoading) ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
                        }`}
                        placeholder="Add review notes based on documents and ML score..."
                      ></textarea>
                      <span className="absolute bottom-3 right-3 text-[11px] font-bold text-[#94A3B8]">
                        {officerNotes.length} / 500
                      </span>
                    </div>
                  </div>

                  {/* Action Cards */}
                  {selectedCase.status !== 'Approved' && selectedCase.status !== 'Rejected' ? (
                    <div className="flex flex-col gap-4">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Approve Card */}
                        <div className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#22C55E] rounded-xl p-5 shadow-sm flex flex-col">
                          <CheckCircle2 className="w-8 h-8 text-[#22C55E] mb-3" />
                          <h4 className="text-[16px] font-bold text-[#0F172A] mb-1">Approve Application</h4>
                          <p className="text-[12px] font-medium text-[#64748B] mb-5 flex-1">Grant temporary asylum status and forward to FRRO for registration.</p>
                          <button
                            onClick={() => {
                              if (!officerNotes.trim()) {
                                alert('Please add officer notes in the text area above before making a decision.');
                                return;
                              }
                              setConfirmDecision('Approved');
                              setShowConfirmModal(true);
                            }}
                            disabled={
                              decisionLoading ||
                              ['Approved','Rejected'].includes(selectedCase?.status)
                            }
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Approve
                          </button>
                        </div>

                        {/* Reject Card */}
                        <div className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#EF4444] rounded-xl p-5 shadow-sm flex flex-col">
                          <XCircle className="w-8 h-8 text-[#EF4444] mb-3" />
                          <h4 className="text-[16px] font-bold text-[#0F172A] mb-1">Reject Application</h4>
                          <p className="text-[12px] font-medium text-[#64748B] mb-5 flex-1">Application does not meet asylum criteria. Initiate deportation proceedings.</p>
                          <button
                            onClick={() => {
                              if (!officerNotes.trim()) {
                                alert('Please add officer notes in the text area above before making a decision.');
                                return;
                              }
                              setConfirmDecision('Rejected');
                              setShowConfirmModal(true);
                            }}
                            disabled={
                              decisionLoading ||
                              ['Approved','Rejected'].includes(selectedCase?.status)
                            }
                            className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* Request Info */}
                      <div className="bg-white border border-[#2563EB] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-[15px] font-bold text-[#0F172A] mb-1">Request Additional Documents</h4>
                          <p className="text-[12px] font-medium text-[#64748B]">Ask applicant to submit more supporting evidence.</p>
                        </div>
                        <button 
                          onClick={handleRequestMoreInfo}
                          disabled={decisionLoading}
                          className="px-6 py-2.5 border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 text-[13px] font-bold rounded-lg transition-colors shadow-sm shrink-0 whitespace-nowrap"
                        >
                          Send Request
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl p-6 text-center">
                      <p className="text-[13px] font-bold text-[#64748B]">Decision already made</p>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ============================== */}
      {/* MODALS & TOASTS                */}
      {/* ============================== */}
      
      {/* Confirmation Modal */}
      {showConfirmModal && confirmDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 animate-in fade-in duration-200" onClick={() => !decisionLoading && setShowConfirmModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[16px] shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex flex-col items-center text-center mb-6">
              {confirmDecision === 'Approved' ? <CheckCircle2 className="w-12 h-12 text-[#22C55E] mb-3" /> : <XCircle className="w-12 h-12 text-[#EF4444] mb-3" />}
              <h2 className="text-[20px] font-bold text-[#0F172A] mb-2">Confirm Decision</h2>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                Are you sure you want to <strong className={confirmDecision === 'Approved' ? 'text-[#22C55E]' : 'text-[#EF4444]'}>{confirmDecision.toUpperCase()}</strong> this application? This action will be logged and cannot be undone.
              </p>
            </div>
            
            <div className="bg-[#F8F9FC] border border-[#E2E8F0] rounded-lg p-3 mb-6 max-h-[100px] overflow-y-auto">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Your Notes:</span>
              <p className="text-[12px] text-[#0F172A] font-medium italic">"{officerNotes}"</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                disabled={decisionLoading}
                className="flex-1 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] text-[13px] font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDecision(confirmDecision)}
                disabled={decisionLoading}
                className={`px-6 py-2 flex-1 flex items-center justify-center rounded-lg text-white text-[13px] font-medium
                  ${confirmDecision === 'Approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'}
                  ${decisionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  transition-colors`}
              >
                {decisionLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" 
                      viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" 
                        r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Confirm ${confirmDecision}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 ${
          toast.type === 'approve' ? 'bg-green-50 border-green-200' : toast.type === 'reject' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        }`}>
          {toast.type === 'approve' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : toast.type === 'reject' ? <XCircle className="w-5 h-5 text-red-600" /> : <Send className="w-5 h-5 text-blue-600" />}
          <p className={`text-[13px] font-bold ${toast.type === 'approve' ? 'text-green-800' : toast.type === 'reject' ? 'text-red-800' : 'text-blue-800'}`}>
            {toast.text}
          </p>
        </div>
      )}

    </div>
  );
}

// Helpers
const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-[13px]">
    <span className="font-bold text-[#64748B]">{label}</span>
    <span className="font-bold text-[#0F172A] text-right">{value}</span>
  </div>
);

const MLFactor = ({ name, weight, value, impact, type }) => {
  const color = type === 'green' ? 'bg-[#22C55E]' : type === 'amber' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]';
  const text = type === 'green' ? 'text-green-700 bg-green-100' : type === 'amber' ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-[#0F172A]">{name}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{weight}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#64748B]">{value}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${text}`}>{impact}</span>
        </div>
      </div>
      <div className="h-1 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${weight}%` }}></div>
      </div>
    </div>
  );
};
