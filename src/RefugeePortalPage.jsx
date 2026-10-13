import React, { useState, useRef, useEffect } from 'react';
import { 
  Info, User, FileText, Upload, CheckCircle2, Copy, Search, 
  AlertCircle, Check, Loader2, Bot
} from 'lucide-react';
import { registerRefugeeCase, trackRefugeeCase } from './api';

export default function RefugeePortalPage() {
  const [view, setView] = useState('register'); // 'register' or 'track'

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200 min-h-[calc(100vh-140px)]">
      
      {/* Page Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-[22px] font-bold text-[#0F172A]">Refugee Portal</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">Refugee registration and case management</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex items-center bg-[#FFFFFF] border border-[#E2E8F0] rounded-full p-1 shadow-sm">
          <button 
            onClick={() => setView('register')}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-200 ${view === 'register' ? 'bg-[#2563EB] text-white shadow-md' : 'text-[#64748B] hover:text-[#0F172A]'}`}
          >
            Register New Case
          </button>
          <button 
            onClick={() => setView('track')}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-200 ${view === 'track' ? 'bg-[#2563EB] text-white shadow-md' : 'text-[#64748B] hover:text-[#0F172A]'}`}
          >
            Track Existing Case
          </button>
        </div>
      </div>

      {view === 'register' ? <RegisterView setView={setView} /> : <TrackView />}

    </div>
  );
}

/* =========================================
   REGISTER NEW CASE VIEW
========================================= */
function RegisterView({ setView }) {
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success'
  const [generatedId, setGeneratedId] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: '',
    nationality: '',
    country: '',
    language: '',
    phone: '',
    reason: '',
    entryDate: '',
    entryPoint: '',
    description: '',
    hasUnhcr: 'No',
    unhcrNumber: ''
  });
  
  // File Upload State
  const [files, setFiles] = useState({
    passport: null,
    unhcr: null,
    identity: null,
    evidence: null
  });

  // Checkboxes
  const [declTruth, setDeclTruth] = useState(false);
  const [declLegal, setDeclLegal] = useState(false);
  
  // Validation State
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleFileChange = (slot, file) => {
    setFiles(prev => ({ ...prev, [slot]: file }));
  };

  const validateForm = () => {
    const newErrors = {};
    const req = ['fullName', 'dob', 'gender', 'nationality', 'country', 'reason', 'entryDate', 'entryPoint', 'description'];
    req.forEach(f => {
      if (!formData[f]) newErrors[f] = true;
    });
    if (formData.hasUnhcr === 'Yes' && !formData.unhcrNumber) {
      newErrors.unhcrNumber = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!declTruth || !declLegal) return;
    
    setStatus('loading');
    
    const caseData = {
      full_name: formData.fullName,
      date_of_birth: formData.dob,
      gender: formData.gender,
      nationality: formData.nationality,
      country_of_origin: formData.country,
      primary_language: formData.language,
      contact: formData.phone,
      reason_for_asylum: formData.reason,
      entry_date: formData.entryDate,
      entry_point: formData.entryPoint,
      situation_description: formData.description,
      unhcr_registered: formData.hasUnhcr === 'Yes' ? 'yes' : 'no',
      unhcr_number: formData.unhcrNumber || '',
      docs_submitted: [files.passport, files.unhcr, files.identity, files.evidence].filter(Boolean).length,
      prior_application: false
    };

    const result = await registerRefugeeCase(caseData);
    
    if (result.success) {
      setGeneratedId(result.case_id);
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setStatus('idle');
      alert('Submission failed. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedId);
    alert('Copied to clipboard!');
  };

  if (status === 'success') {
    return (
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in spin-in-12 duration-500 delay-150">
          <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
        </div>
        <h2 className="text-[28px] font-bold text-[#0F172A] mb-2">Case Submitted Successfully!</h2>
        <p className="text-[14px] text-[#64748B] mb-8">Please save this Case ID. You can use it to track your case status.</p>
        
        <div className="bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl p-6 flex flex-col items-center mb-8 w-full max-w-md">
          <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Your Unique Case ID:</span>
          <div className="flex items-center gap-3">
            <span className="text-[32px] font-bold text-[#2563EB] tracking-wider font-mono">{generatedId}</span>
            <button 
              onClick={copyToClipboard}
              className="p-2 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 text-[#64748B] transition-colors shadow-sm"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={() => setView('track')}
            className="px-6 py-3 bg-[#2563EB] text-white text-[14px] font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Track My Case
          </button>
          <button 
            onClick={() => { setStatus('idle'); setFormData({hasUnhcr: 'No'}); setFiles({}); setDeclLegal(false); setDeclTruth(false); }}
            className="px-6 py-3 bg-white border border-[#E2E8F0] text-[#0F172A] text-[14px] font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Submit Another Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <div className="bg-[#EFF6FF] border border-blue-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-[#1E40AF] shrink-0 mt-0.5" />
        <p className="text-[13px] text-[#1E40AF] font-medium leading-relaxed">
          This portal is for individuals seeking asylum in India. All submitted information is reviewed by border authorities. Providing false documents is a criminal offense.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden">
        
        {/* Section 1: Personal Info */}
        <div className="p-8 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-6 border-b border-[#E2E8F0] pb-3">
            <User className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-[15px] font-bold text-[#0F172A]">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Full Name *" name="fullName" value={formData.fullName} onChange={handleInputChange} error={errors.fullName} />
            <InputField label="Date of Birth *" name="dob" type="date" value={formData.dob} onChange={handleInputChange} error={errors.dob} />
            <SelectField label="Gender *" name="gender" options={['Male', 'Female', 'Other']} value={formData.gender} onChange={handleInputChange} error={errors.gender} />
            <InputField label="Nationality *" name="nationality" value={formData.nationality} onChange={handleInputChange} error={errors.nationality} />
            <SelectField 
              label="Country of Origin *" 
              name="country" 
              options={['Myanmar', 'Bangladesh', 'Afghanistan', 'Sri Lanka', 'Pakistan', 'Nepal', 'Bhutan', 'Other']} 
              value={formData.country} 
              onChange={handleInputChange} 
              error={errors.country} 
            />
            <InputField label="Primary Language" name="language" value={formData.language} onChange={handleInputChange} />
            <InputField label="Contact Number (Optional)" name="phone" value={formData.phone} onChange={handleInputChange} />
          </div>
        </div>

        {/* Section 2: Asylum Details */}
        <div className="p-8 border-b border-[#E2E8F0] bg-[#F8F9FC]">
          <div className="flex items-center gap-2 mb-6 border-b border-[#E2E8F0] pb-3">
            <FileText className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-[15px] font-bold text-[#0F172A]">Asylum Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SelectField 
              label="Reason for Seeking Asylum *" 
              name="reason" 
              options={['Armed Conflict', 'Political Persecution', 'Religious Persecution', 'Natural Disaster', 'Ethnic Violence', 'Other']} 
              value={formData.reason} 
              onChange={handleInputChange} 
              error={errors.reason} 
            />
            <InputField label="Date of Entry into India *" name="entryDate" type="date" value={formData.entryDate} onChange={handleInputChange} error={errors.entryDate} />
            <div className="md:col-span-2">
              <InputField label="Entry Point / Border Location *" name="entryPoint" value={formData.entryPoint} onChange={handleInputChange} error={errors.entryPoint} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[13px] font-bold text-[#0F172A] mb-2">Brief Description of Situation *</label>
              <textarea 
                name="description"
                rows="4"
                className={`w-full px-4 py-3 bg-white border ${errors.description ? 'border-[#EF4444] focus:ring-[#EF4444]' : 'border-[#E2E8F0] focus:ring-[#2563EB]'} rounded-lg text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none shadow-sm`}
                placeholder="Describe your situation in brief..."
                value={formData.description}
                onChange={handleInputChange}
              />
              {errors.description && <span className="text-[#EF4444] text-[11px] font-bold mt-1">This field is required</span>}
            </div>
            
            <div className="md:col-span-2 flex flex-col gap-2 mt-2">
              <label className="block text-[13px] font-bold text-[#0F172A]">Do you have UNHCR Registration? *</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hasUnhcr" value="Yes" checked={formData.hasUnhcr === 'Yes'} onChange={handleInputChange} className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-[14px] text-[#374151] font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hasUnhcr" value="No" checked={formData.hasUnhcr === 'No'} onChange={handleInputChange} className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-[14px] text-[#374151] font-medium">No</span>
                </label>
              </div>
            </div>

            {formData.hasUnhcr === 'Yes' && (
              <div className="md:col-span-2 animate-in slide-in-from-top-2 fade-in duration-200 mt-2">
                <InputField label="UNHCR Registration Number *" name="unhcrNumber" value={formData.unhcrNumber || ''} onChange={handleInputChange} error={errors.unhcrNumber} />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Document Upload */}
        <div className="p-8 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-[15px] font-bold text-[#0F172A]">Document Upload</h3>
          </div>
          <p className="text-[13px] text-[#64748B] mb-6 pb-4 border-b border-[#E2E8F0]">
            Upload any identity or supporting documents you have. Accepted formats: JPG, PNG, PDF (max 5MB each).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UploadSlot label="1. Passport / Travel Document" slotId="passport" file={files.passport} onChange={handleFileChange} />
            <UploadSlot label="2. UNHCR Card (if available)" slotId="unhcr" file={files.unhcr} onChange={handleFileChange} />
            <UploadSlot label="3. Identity Proof (any govt ID)" slotId="identity" file={files.identity} onChange={handleFileChange} />
            <UploadSlot label="4. Supporting Evidence / Other" slotId="evidence" file={files.evidence} onChange={handleFileChange} />
          </div>
        </div>

        {/* Section 4: Declaration & Submit */}
        <div className="p-8 bg-[#F8F9FC]">
          <div className="mb-6 pb-3 border-b border-[#E2E8F0]">
            <h3 className="text-[15px] font-bold text-[#0F172A]">Declaration</h3>
          </div>
          
          <div className="flex flex-col gap-4 mb-8">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={declTruth} onChange={e => setDeclTruth(e.target.checked)} className="w-4 h-4 mt-0.5 text-[#2563EB] rounded border-gray-300" />
              <span className="text-[13px] text-[#374151] font-medium leading-relaxed">I declare that all information provided is true and accurate to the best of my knowledge.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={declLegal} onChange={e => setDeclLegal(e.target.checked)} className="w-4 h-4 mt-0.5 text-[#2563EB] rounded border-gray-300" />
              <span className="text-[13px] text-[#374151] font-medium leading-relaxed">I understand that providing false information may result in rejection and legal action.</span>
            </label>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!declTruth || !declLegal || status === 'loading'}
            className={`w-full py-4 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              (!declTruth || !declLegal) 
                ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed' 
                : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {status === 'loading' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
            ) : 'Submit Case for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Input Helpers
const InputField = ({ label, name, type="text", value, onChange, error }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[13px] font-bold text-[#0F172A]">{label}</label>
    <input 
      type={type} 
      name={name}
      value={value}
      onChange={onChange}
      className={`px-4 py-2.5 bg-white border ${error ? 'border-[#EF4444] focus:ring-[#EF4444]' : 'border-[#E2E8F0] focus:ring-[#2563EB]'} rounded-lg text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
    />
    {error && <span className="text-[#EF4444] text-[11px] font-bold">This field is required</span>}
  </div>
);

const SelectField = ({ label, name, options, value, onChange, error }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[13px] font-bold text-[#0F172A]">{label}</label>
    <select 
      name={name}
      value={value}
      onChange={onChange}
      className={`px-4 py-2.5 bg-white border ${error ? 'border-[#EF4444] focus:ring-[#EF4444]' : 'border-[#E2E8F0] focus:ring-[#2563EB]'} rounded-lg text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm appearance-none`}
    >
      <option value="" disabled>Select an option</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    {error && <span className="text-[#EF4444] text-[11px] font-bold">This field is required</span>}
  </div>
);

const UploadSlot = ({ label, slotId, file, onChange }) => {
  const fileInputRef = useRef(null);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-[#0F172A]">{label}</span>
      <div 
        onClick={() => !file && fileInputRef.current.click()}
        className={`w-full h-[100px] border-2 border-dashed rounded-xl flex items-center justify-center transition-all ${
          file ? 'border-[#22C55E] bg-green-50/50' : 'border-[#CBD5E1] bg-[#F8F9FC] hover:bg-[#F1F5F9] cursor-pointer'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onChange(slotId, e.target.files[0]);
            }
          }}
          accept=".jpg,.jpeg,.png,.pdf"
        />
        
        {!file ? (
          <div className="flex flex-col items-center gap-2 text-[#64748B]">
            <Upload className="w-6 h-6 opacity-70" />
            <span className="text-[12px] font-medium">Click to upload or drag & drop</span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full px-6">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-[#22C55E] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[13px] font-bold text-[#0F172A] truncate">{file.name}</span>
                <span className="text-[11px] text-[#64748B] font-medium">{formatSize(file.size)}</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(slotId, null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="p-1.5 hover:bg-red-100 text-[#64748B] hover:text-[#EF4444] rounded-md transition-colors shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


/* =========================================
   TRACK EXISTING CASE VIEW
========================================= */
function TrackView() {
  const [searchInput, setSearchInput] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [searchStatus, setSearchStatus] = useState('idle'); // idle, loading, found, error
  const [trackedCase, setTrackedCase] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const q = searchInput.trim().toUpperCase();
    
    setSearchStatus('loading');
    
    const result = await trackRefugeeCase(q);
    
    if (result.success) {
      setSearchedId(q);
      setTrackedCase(result.case);
      setSearchStatus('found');
    } else {
      setSearchedId(q);
      setTrackedCase(null);
      setSearchStatus('error');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] p-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="w-6 h-6 text-[#2563EB]" />
          <h3 className="text-[18px] font-bold text-[#0F172A]">Track Your Case</h3>
        </div>
        <p className="text-[14px] text-[#64748B] mb-6">Enter your unique Case ID to check the status of your application</p>
        
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter Case ID (e.g. R-2024-00421)" 
            className="flex-1 px-5 py-3.5 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl text-[15px] font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all uppercase tracking-wide"
          />
          <button 
            type="submit"
            disabled={searchStatus === 'loading'}
            className="px-8 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white text-[15px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
          >
            {searchStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            Track Case
          </button>
        </form>
        <p className="text-[12px] font-medium text-[#94A3B8] mt-3">Your Case ID was provided when you submitted your application.</p>
      </div>

      {/* ERROR STATE */}
      {searchStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mb-4" />
          <h3 className="text-[20px] font-bold text-[#0F172A] mb-2">Case Not Found</h3>
          <p className="text-[14px] text-[#64748B] max-w-md">No case found with ID '<span className="font-bold text-[#0F172A]">{searchedId}</span>'. Please check your Case ID and try again.</p>
          <button 
            onClick={() => {setSearchStatus('idle'); setSearchInput('');}}
            className="mt-6 px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] text-[13px] font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* FOUND STATE */}
      {searchStatus === 'found' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Main Details Card */}
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden">
            
            {/* Header */}
            <div className="p-8 border-b border-[#E2E8F0] bg-[#F8F9FC]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h2 className="text-[32px] font-bold text-[#0F172A] tracking-wider mb-2">{trackedCase.case_id}</h2>
                  <div className="flex items-center gap-4 text-[#64748B] font-medium text-[14px]">
                    <span>Applicant: <strong className="text-[#0F172A]">{trackedCase.full_name}</strong></span>
                    <span className="hidden sm:inline">&bull;</span>
                    <span>Submitted: <strong className="text-[#0F172A]">{trackedCase.submitted_at ? new Date(trackedCase.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown'}</strong></span>
                  </div>
                </div>
                <div className="px-5 py-2 bg-amber-100 border border-amber-200 text-amber-700 rounded-full text-[14px] font-bold uppercase tracking-widest shadow-sm">
                  {trackedCase.status || 'UNDER REVIEW'}
                </div>
              </div>

              {/* Progress Tracker Stepper */}
              <div className="mt-12 mb-4">
                <div className="flex items-center justify-between relative max-w-3xl mx-auto">
                  {/* Connecting Line */}
                  <div className="absolute top-[18px] left-[10%] right-[10%] h-1 bg-[#E2E8F0] -z-10 rounded-full">
                    <div className="h-full bg-[#22C55E] rounded-full w-[40%]"></div>
                  </div>

                  {/* Steps */}
                  <Step icon={<Check className="w-5 h-5 text-white" />} label="Registered" state="completed" />
                  <Step icon={<Check className="w-5 h-5 text-white" />} label="Docs Verified" state="completed" />
                  <Step icon={<div className="w-3 h-3 bg-white rounded-full"></div>} label={trackedCase.status || "Under Review"} state="current" />
                  <Step text="4" label="Decision" state="upcoming" />
                  <Step text="5" label="Resolved" state="upcoming" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 p-8 gap-8">
              {/* LEFT - Case Details */}
              <div className="flex flex-col gap-6">
                <h3 className="text-[16px] font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">Case Details</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <DetailItem label="Country of Origin" value={trackedCase.country_of_origin} />
                  <DetailItem label="Reason for Asylum" value={trackedCase.reason_for_asylum} />
                  <DetailItem label="Entry Point" value={trackedCase.entry_point} />
                  <DetailItem label="UNHCR Registered" value={trackedCase.unhcr_registered === 'yes' || trackedCase.unhcr_registered === 'Yes' ? 'Yes' : 'No'} />
                  <DetailItem label="Documents Submitted" value={`${trackedCase.docs_submitted || 0}/4`} />
                  <DetailItem label="Entry Date" value={trackedCase.entry_date} />
                </div>
              </div>

              {/* RIGHT - ML Assessment */}
              <div className="flex flex-col gap-4 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl p-6 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#2563EB]" /> Preliminary Assessment
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded uppercase tracking-wider">AI-Generated</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className={`text-[32px] font-bold leading-none ${trackedCase.ml_score >= 80 ? 'text-[#22C55E]' : trackedCase.ml_score >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                      {Math.round(trackedCase.ml_score || 0)}<span className="text-[18px] text-[#64748B]">/100</span>
                    </span>
                    <span className="text-[13px] font-bold text-[#0F172A] mt-1">
                      {trackedCase.ml_score >= 80 ? 'High Credibility' : trackedCase.ml_score >= 50 ? 'Moderate Credibility' : 'Low Credibility'}
                    </span>
                  </div>
                  <div className="w-16 h-16 rounded-full border-[6px] border-[#F8F9FC] flex items-center justify-center relative shadow-[0_0_0_2px_#E2E8F0]">
                    <svg className="w-full h-full -rotate-90 absolute top-0 left-0">
                      <circle cx="32" cy="32" r="28" fill="none" stroke={trackedCase.ml_score >= 80 ? '#22C55E' : trackedCase.ml_score >= 50 ? '#F59E0B' : '#EF4444'} strokeWidth="6" strokeDasharray="175" strokeDashoffset={175 - (175 * (trackedCase.ml_score || 0) / 100)} className="transition-all duration-1000 ease-out" />
                    </svg>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${trackedCase.ml_score >= 80 ? 'bg-[#22C55E]' : trackedCase.ml_score >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`} style={{width: `${trackedCase.ml_score || 0}%`}}></div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between text-[12px] font-bold bg-white px-3 py-2 border border-[#E2E8F0] rounded-lg">
                    <span className="text-[#0F172A]">UNHCR Registration</span>
                    <span className="text-[#22C55E]">+HIGH IMPACT</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] font-bold bg-white px-3 py-2 border border-[#E2E8F0] rounded-lg">
                    <span className="text-[#0F172A]">Document Completeness</span>
                    <span className="text-[#F59E0B]">MEDIUM</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] font-bold bg-white px-3 py-2 border border-[#E2E8F0] rounded-lg">
                    <span className="text-[#0F172A]">Country Risk Index</span>
                    <span className="text-[#EF4444]">HIGH RISK</span>
                  </div>
                </div>

                <p className="text-[11px] font-medium text-[#64748B] mt-4 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100">
                  ⚠ This score is generated by ML model and is only used to assist officer review. Final decision is made by a human officer.
                </p>
              </div>
            </div>
          </div>

          {/* Activity Log / Timeline */}
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] p-8 mb-8">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-6 border-b border-[#E2E8F0] pb-4">Case Activity</h3>
            
            <div className="flex flex-col gap-6 relative px-4">
              {/* Vertical line */}
              <div className="absolute top-2 bottom-8 left-[23px] w-0.5 bg-[#E2E8F0]"></div>
              
              <TimelineItem time="10 Nov 2024, 09:15 AM" text="Case registered successfully" state="done" />
              <TimelineItem time="10 Nov 2024, 02:30 PM" text="Documents received and logged" state="done" />
              <TimelineItem time="11 Nov 2024, 10:00 AM" text="Initial document verification complete" state="done" />
              <TimelineItem time="12 Nov 2024, 03:45 PM" text="Case assigned to Officer ID: BCU-047" state="done" />
              <TimelineItem time="Pending" text="Awaiting officer review and decision" state="pending" />
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// Subcomponents for Track View
const Step = ({ icon, text, label, state }) => {
  const getStyle = () => {
    if (state === 'completed') return 'bg-[#22C55E] border-transparent shadow-md';
    if (state === 'current') return 'bg-[#2563EB] border-transparent ring-4 ring-blue-100 shadow-md relative';
    return 'bg-white border-2 border-[#CBD5E1] text-[#94A3B8]';
  };
  
  return (
    <div className="flex flex-col items-center gap-3 z-10 w-24">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-all duration-300 ${getStyle()}`}>
        {icon || text}
        {state === 'current' && (
           <div className="absolute inset-0 rounded-full border-2 border-[#2563EB] animate-ping opacity-50"></div>
        )}
      </div>
      <span className={`text-[12px] font-bold text-center ${state === 'current' ? 'text-[#0F172A]' : state === 'completed' ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
        {label}
      </span>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</span>
    <span className="text-[14px] font-bold text-[#0F172A]">{value}</span>
  </div>
);

const TimelineItem = ({ time, text, state }) => (
  <div className="flex items-start gap-5 relative z-10">
    <div className={`w-[11px] h-[11px] rounded-full mt-1.5 outline outline-4 outline-white ${state === 'done' ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'}`}></div>
    <div className="flex flex-col">
      <span className={`text-[12px] font-bold uppercase tracking-wider mb-0.5 ${state === 'done' ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{time}</span>
      <span className={`text-[14px] font-medium ${state === 'done' ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>{text}</span>
    </div>
  </div>
);
