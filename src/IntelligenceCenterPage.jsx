import React, { useState, useMemo, useRef } from 'react';
import { 
  Database, BarChart2, TrendingUp, UploadCloud, 
  Settings, AlertTriangle, FileText, Check, X, FileSpreadsheet, Loader2, TrendingDown
} from 'lucide-react';
import { uploadCSV, analyzeCSV } from './api';

export default function IntelligenceCenterPage() {
  const [activeTab, setActiveTab] = useState('data');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Upload & Mapping State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filepath, setFilepath] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showMapping, setShowMapping] = useState(false);
  
  const [headers, setHeaders] = useState([]);
  const [samples, setSamples] = useState({});
  const [columnMapping, setColumnMapping] = useState({});
  
  // Analysis State
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a valid CSV file');
      return;
    }
  
    setUploadedFile(file);
    setUploading(true);
    setUploadStatus('Uploading...');
  
    // Upload to Flask backend
    const uploadResult = await uploadCSV(file);
  
    if (!uploadResult.success) {
      setUploading(false);
      setUploadFile(null);
      setUploadStatus('Upload failed. Please try again.');
      return;
    }
  
    setFilepath(uploadResult.filepath);
    setUploadStatus('Analyzing columns...');
  
    // Read file locally just for column detection
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.trim().split('\n');
      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      // Get sample values for each column
      const sampleRows = lines.slice(1, 4);
      const csvSamples = {};
      csvHeaders.forEach((header, i) => {
        csvSamples[header] = sampleRows
          .map(row => {
            const vals = row.split(',');
            return vals[i] ? vals[i].trim().replace(/^"|"$/g, '') : '';
          })
          .filter(Boolean);
      });
  
      // Auto detect column types
      const autoMapping = {};
      csvHeaders.forEach(header => {
        const lowerHeader = header.toLowerCase();
        const sampleVals = csvSamples[header] || [];
        
        if (lowerHeader.includes('date') || 
            lowerHeader.includes('time') || 
            lowerHeader.includes('timestamp')) {
          autoMapping[header] = 'date';
        } else if (
          lowerHeader.includes('zone') ||
          lowerHeader.includes('location') ||
          lowerHeader.includes('area') ||
          lowerHeader.includes('sector') ||
          lowerHeader.includes('region')) {
          autoMapping[header] = 'location';
        } else if (sampleVals.length > 0 && sampleVals.every(v => !isNaN(parseFloat(v)) && isFinite(v))) {
          autoMapping[header] = 'numeric';
        } else {
          autoMapping[header] = 'category';
        }
      });
  
      setHeaders(csvHeaders);
      setSamples(csvSamples);
      setColumnMapping(autoMapping);
      setUploading(false);
      setUploadStatus(`✓ Ready — ${lines.length - 1} rows, ${csvHeaders.length} columns detected`);
      setShowMapping(true);
    };
    reader.readAsText(file);
  };

  const handleMapChange = (header, val) => {
    setColumnMapping(prev => ({ ...prev, [header]: val }));
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFilepath(null);
    setShowMapping(false);
    setHeaders([]);
    setSamples({});
    setColumnMapping({});
    setAnalysisReady(false);
    setAnalysisData(null);
    setUploadStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!filepath) {
      alert('Please upload a file first');
      return;
    }
  
    setAnalyzing(true);
  
    const result = await analyzeCSV(filepath, columnMapping);
  
    setAnalyzing(false);
  
    if (result.success) {
      setAnalysisData(result.data);
      setAnalysisReady(true);
      
      localStorage.setItem('lastAnalysisSummary', JSON.stringify({
        total_records: result.data.summary.total_records,
        date_range: result.data.summary.date_range,
        top_zone: result.data.forecast.top_zone
      }));

      setActiveTab('analytics');
    } else {
      alert('Analysis failed: ' + result.error);
    }
  };

  const dismissAlert = (id) => setAnalysisData(prev => ({...prev, alerts: prev.alerts.filter(a => a.id !== id)}));
  const ackAlert = (id) => setAnalysisData(prev => ({...prev, alerts: prev.alerts.map(a => a.id === id ? { ...a, ack: true } : a)}));

  // Derived max for time series chart
  const timeSeriesMax = useMemo(() => {
    if (!analysisData || !analysisData.time_series.length) return 1;
    return Math.max(...analysisData.time_series.map(d => d.count)) || 1;
  }, [analysisData]);

  // Tabs layout mapping
  const TABS = [
    { id: 'data', label: 'Data & Alerts', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'forecast', label: 'Risk Forecast', icon: TrendingUp },
  ];

  return (
    <div className="animate-in fade-in duration-200">
      
      {/* Page Header & Tabs */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#0F172A]">Intelligence Center</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">Dynamic data analysis and risk forecasting</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-[#E2E8F0] shadow-sm shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-bold transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-[#EFF6FF] text-[#2563EB] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================== */}
      {/* TAB 1: DATA & ALERTS           */}
      {/* ============================== */}
      {activeTab === 'data' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
          
          {/* Section 1: Upload */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-3">
              <UploadCloud className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A]">Dataset Upload</h3>
                <p className="text-[12px] text-[#64748B]">Upload any CSV file — system will automatically detect columns and generate analysis</p>
              </div>
            </div>
            
            <div className="p-6 bg-[#F8F9FC]">
              {!uploadedFile && !uploading && uploadStatus !== 'Upload failed. Please try again.' && (
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#CBD5E1] bg-white hover:bg-slate-50'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className={`w-12 h-12 mb-3 ${isDragging ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
                  <h4 className="text-[15px] font-bold text-[#0F172A] mb-1">Drop your CSV file here</h4>
                  <p className="text-[13px] font-medium text-[#64748B] mb-2">or click to browse</p>
                  <p className="text-[11px] text-[#94A3B8]">Supported format: .CSV — any structure</p>
                  <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileSelect} />
                </div>
              )}
              {uploading && (
                <div className="border border-[#E2E8F0] bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2563EB] rounded-full animate-spin mb-3"></div>
                  <h4 className="text-[14px] font-bold text-[#0F172A]">{uploadStatus}</h4>
                </div>
              )}
              {uploadStatus === 'Upload failed. Please try again.' && (
                <div className="border border-red-200 bg-red-50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-red-100 transition-colors" onClick={() => {setUploadStatus(''); setUploadedFile(null);}}>
                   <AlertTriangle className="w-12 h-12 mb-3 text-red-500" />
                   <h4 className="text-[15px] font-bold text-red-700 mb-1">{uploadStatus}</h4>
                   <p className="text-[12px] text-red-600">Click to try again</p>
                </div>
              )}
              {uploadedFile && showMapping && !uploading && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-green-800">{uploadedFile.name}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-200 text-green-800">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <p className="text-[12px] text-green-700 mt-0.5">{uploadStatus}</p>
                    </div>
                  </div>
                  <button onClick={removeFile} className="p-2 bg-white rounded-lg text-[#64748B] hover:text-[#EF4444] shadow-sm"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Mapping */}
          {showMapping && !analysisReady && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in slide-in-from-top-4">
              <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-3">
                <Settings className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="text-[15px] font-bold text-[#0F172A]">Column Mapping</h3>
                  <p className="text-[12px] text-[#64748B]">Help us understand your data — map columns to their types</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {headers.map(h => (
                    <div key={h} className="border border-[#E2E8F0] bg-[#F8F9FC] rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[13px] font-bold text-[#0F172A] truncate">{h}</span>
                        <select 
                          value={columnMapping[h] || 'ignore'} 
                          onChange={(e) => handleMapChange(h, e.target.value)}
                          className="input-std text-[11px] py-1 pl-2 pr-6 h-auto w-32 shrink-0 bg-white border border-[#E2E8F0] rounded"
                        >
                          <option value="date">Date / Time</option>
                          <option value="location">Location / Zone</option>
                          <option value="numeric">Numeric Value</option>
                          <option value="category">Category</option>
                          <option value="ignore">Ignore this column</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-[#94A3B8] font-medium truncate">
                        e.g. {samples[h] ? samples[h].join(', ') : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg shadow-sm transition-colors font-bold text-[14px] ${analyzing ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed' : 'bg-[#2563EB] hover:bg-blue-700 text-white'}`}
                >
                  {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {analyzing ? 'Running analysis on backend...' : 'Confirm Mapping & Analyze'}
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Alerts */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A]">Generated Alerts</h3>
                <p className="text-[12px] text-[#64748B]">Alerts are automatically generated based on anomalies detected in uploaded dataset</p>
              </div>
            </div>
            <div className="p-6">
              {!analysisReady || !analysisData ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-[#F8F9FC] border border-[#E2E8F0] border-dashed rounded-xl">
                  <AlertTriangle className="w-12 h-12 text-[#CBD5E1] mb-3" />
                  <h4 className="text-[15px] font-bold text-[#0F172A]">No alerts yet</h4>
                  <p className="text-[13px] text-[#64748B] max-w-sm mt-1">Upload a CSV dataset above to generate intelligent alerts based on your data</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {analysisData.alerts.map(a => (
                    <div key={a.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl shadow-sm transition-all animate-in fade-in duration-300 ${a.ack ? 'border-l-4 border-l-green-500 bg-green-50/30' : a.threat === 'HIGH' || a.threat === 'CRITICAL' ? 'border-l-4 border-l-[#EF4444] bg-white' : a.threat === 'MEDIUM' ? 'border-l-4 border-l-[#F59E0B] bg-white' : 'border-l-4 border-l-[#22C55E] bg-white'}`}>
                      <div className="flex-1 mb-4 sm:mb-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className={`text-[14px] font-bold ${a.ack ? 'text-green-800' : 'text-[#0F172A]'}`}>{a.title}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-500 border border-slate-200`}>Confidence: {a.confidence}%</span>
                        </div>
                        <p className="text-[12px] font-medium text-[#64748B] mb-1">{a.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {a.ack ? (
                          <span className="text-[12px] font-bold text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Acknowledged</span>
                        ) : (
                          <>
                            <button onClick={() => dismissAlert(a.id)} className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 text-[12px] font-bold rounded-lg transition-colors shadow-sm">Dismiss</button>
                            <button onClick={() => ackAlert(a.id)} className={`px-4 py-2 text-white text-[12px] font-bold rounded-lg transition-colors shadow-sm ${a.threat === 'HIGH' || a.threat === 'CRITICAL' ? 'bg-[#EF4444] hover:bg-red-600' : a.threat === 'MEDIUM' ? 'bg-[#F59E0B] hover:bg-amber-600' : 'bg-[#2563EB] hover:bg-blue-600'}`}>Acknowledge</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {analysisData.alerts.length === 0 && <p className="text-center text-[13px] text-[#64748B] p-4 font-medium">All alerts dismissed or no alerts triggered for this dataset.</p>}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ============================== */}
      {/* TAB 2: ANALYTICS               */}
      {/* ============================== */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
          
          {!analysisReady || !analysisData ? (
            <EmptyState tab="analytics" onGo={() => setActiveTab('data')} />
          ) : (
            <>
              {/* Summary Row */}
              <div className="flex flex-wrap items-center gap-4">
                <StatChip label="Total Records" value={analysisData.summary.total_records.toLocaleString()} />
                <StatChip label="Date Range" value={`${analysisData.summary.date_range.start} — ${analysisData.summary.date_range.end}`} />
                <StatChip label="Columns Analyzed" value={analysisData.summary.total_columns} />
                <StatChip label="Alerts Generated" value={analysisData.alerts.length} />
              </div>

              {/* Row 1: Time Chart */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                <div className="mb-6">
                  <h3 className="text-[15px] font-bold text-[#0F172A]">Records Over Time</h3>
                  <p className="text-[12px] text-[#64748B]">Chronological dataset distribution</p>
                </div>
                {!analysisData.time_series.length ? <NoData text="No date data detected or mapped" /> : (
                  <div className="flex items-end h-[200px] w-full gap-1 sm:gap-2 px-2 mt-4">
                    {analysisData.time_series.map((item, idx) => {
                      const h = (item.count / timeSeriesMax) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#0F172A] text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity whitespace-nowrap z-10">
                            Count: {item.count}
                          </div>
                          <div className="w-full bg-[#E2E8F0] rounded-t flex items-end h-full">
                            <div className="w-full bg-[#2563EB] hover:bg-[#1E3A5F] transition-colors rounded-t animate-in slide-in-from-bottom" style={{ height: `${h}%` }}></div>
                          </div>
                          <span className="text-[9px] text-[#94A3B8] mt-2 truncate w-full text-center hidden sm:block">{item.period}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Row 2: Location and Category */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Location Chart */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-[15px] font-bold text-[#0F172A]">Distribution by Location/Zone</h3>
                  </div>
                  {!analysisData.zone_distribution.length ? <NoData text="No Location/Zone column mapped" /> : (
                    <div className="flex flex-col gap-3 flex-1 justify-center mt-2">
                      {analysisData.zone_distribution.map((item, i) => {
                        const locMax = analysisData.zone_distribution[0]?.count || 1;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-[11px] font-medium text-[#0F172A] w-[120px] truncate">{item.zone}</span>
                            <div className="flex-1 bg-[#E2E8F0] h-4 rounded-sm overflow-hidden">
                              <div className={`h-full animate-in slide-in-from-left duration-500 rounded-sm ${i%2===0 ? 'bg-[#2563EB]' : 'bg-[#3B82F6]'}`} style={{ width: `${(item.count/locMax)*100}%` }}></div>
                            </div>
                            <span className="text-[11px] font-bold text-[#64748B] w-8 text-right">{item.count}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Category Breakdown */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-[15px] font-bold text-[#0F172A]">Category Breakdown</h3>
                  </div>
                  {!analysisData.category_breakdown.length ? <NoData text="No Category column mapped" /> : (
                    <div className="flex flex-col gap-4 flex-1 justify-center mt-2">
                      {analysisData.category_breakdown.map((item, i) => {
                        const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-slate-400'];
                        const bg = colors[i % colors.length];
                        return (
                          <div key={i} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[12px]">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${bg}`}></div>
                                <span className="font-bold text-[#0F172A] truncate max-w-[150px]">{item.category}</span>
                              </div>
                              <span className="font-bold text-[#64748B]">{item.count} <span className="text-[10px] font-medium opacity-70">({item.percentage}%)</span></span>
                            </div>
                            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full ${bg} rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Row 3: Numeric Analysis */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="p-6 pb-4 border-b border-[#E2E8F0]">
                  <h3 className="text-[15px] font-bold text-[#0F172A]">Numeric Column Statistics</h3>
                </div>
                {!analysisData.numeric_stats.length ? <div className="p-6"><NoData text="No Numeric columns mapped" /></div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8F9FC] border-b border-[#E2E8F0]">
                        <tr>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase">Column Name</th>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase">Min</th>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase">Max</th>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase">Average</th>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase text-right">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.numeric_stats.map((st, i) => (
                          <tr key={i} className="border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-[13px] font-bold text-[#0F172A]">{st.column}</td>
                            <td className="px-6 py-4 text-[13px] text-[#64748B]">{st.min}</td>
                            <td className="px-6 py-4 text-[13px] text-[#64748B]">{st.max}</td>
                            <td className="px-6 py-4 text-[13px] text-[#64748B]">{st.average}</td>
                            <td className="px-6 py-4 text-right">
                              {st.trend === 'up' ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded"><TrendingUp className="w-3 h-3" /> UP</span> : 
                               st.trend === 'down' ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><TrendingDown className="w-3 h-3" /> DOWN</span> :
                               <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">STABLE</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================== */}
      {/* TAB 3: RISK FORECAST           */}
      {/* ============================== */}
      {activeTab === 'forecast' && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
          
          {!analysisReady || !analysisData ? (
            <EmptyState tab="forecast" onGo={() => setActiveTab('data')} />
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <RiskCard title="Overall Risk Level" value={analysisData.forecast.overall_risk} color={analysisData.forecast.overall_risk === 'CRITICAL' || analysisData.forecast.overall_risk === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : analysisData.forecast.overall_risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'} />
                <RiskCard title="Peak Activity Period" value="Dataset Timeline" color="bg-white border-[#E2E8F0] text-[#0F172A]" />
                <RiskCard title="Hotspot Zone" value={analysisData.forecast.top_zone || 'Unknown'} color="bg-white border-[#E2E8F0] text-[#0F172A]" />
                <RiskCard title="Trend Direction" value={analysisData.forecast.trend === 'increasing' ? 'Increasing ↑' : analysisData.forecast.trend === 'decreasing' ? 'Decreasing ↓' : 'Stable →'} color={analysisData.forecast.trend === 'increasing' ? "bg-red-50 text-red-700 border-red-200" : analysisData.forecast.trend === 'decreasing' ? "bg-green-50 text-green-700 border-green-200" : "bg-white border-[#E2E8F0] text-[#0F172A]"} />
              </div>

              {/* Risk Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="p-6 pb-4 border-b border-[#E2E8F0]">
                  <h3 className="text-[15px] font-bold text-[#0F172A]">Zone Risk Assessment</h3>
                </div>
                {!analysisData.risk_scores.length ? <div className="p-6"><NoData text="Location/Zone column must be mapped for Risk Assessment" /></div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-[#F8F9FC] border-b border-[#E2E8F0]">
                        <tr>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase">Zone / Location</th>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase">Records</th>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase">Risk Score</th>
                          <th className="px-6 py-3 text-[12px] font-bold text-[#64748B] uppercase text-right">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.risk_scores.map((r, i) => {
                          const level = r.level === 'CRITICAL' ? { t: 'CRITICAL', c: 'bg-red-100 text-red-700', b: 'bg-red-500' } :
                                        r.level === 'HIGH' ? { t: 'HIGH', c: 'bg-amber-100 text-amber-700', b: 'bg-amber-500' } :
                                        r.level === 'MEDIUM' ? { t: 'MEDIUM', c: 'bg-blue-100 text-blue-700', b: 'bg-blue-500' } :
                                        { t: 'LOW', c: 'bg-green-100 text-green-700', b: 'bg-green-500' };
                          return (
                            <tr key={i} className="border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-[13px] font-bold text-[#0F172A]">{r.zone}</td>
                              <td className="px-6 py-4 text-[13px] text-[#64748B]">{r.count}</td>
                              <td className="px-6 py-4 text-[13px] text-[#0F172A] font-bold">
                                <div className="flex items-center gap-2 w-32">
                                  <span>{r.score}</span>
                                  <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                                    <div className={`h-full ${level.b}`} style={{ width: `${r.score}%` }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${level.c}`}>{level.t}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recommendation Card */}
              <div className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#2563EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">System Recommendation</h3>
                <p className="text-[14px] text-[#374151] leading-relaxed mb-6 font-medium">
                  Based on <span className="font-bold text-[#0F172A]">{analysisData.summary.total_records}</span> records analyzed spanning <span className="font-bold text-[#0F172A]">{analysisData.summary.date_range.start}</span> to <span className="font-bold text-[#0F172A]">{analysisData.summary.date_range.end}</span>, the system has identified <span className="font-bold text-red-600">{analysisData.risk_scores.length}</span> risk zones. 
                  <span className="font-bold text-[#0F172A]"> {analysisData.forecast.top_zone}</span> shows the highest activity. Trend is <span className="font-bold text-red-600">{analysisData.forecast.trend}</span>. Recommend increased monitoring of <span className="font-bold">{analysisData.forecast.top_zone}</span> and <span className="font-bold">{analysisData.forecast.second_zone}</span>.
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-[12px] font-bold rounded-lg shadow-sm">Focus on {analysisData.forecast.top_zone}</span>
                  <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[12px] font-bold rounded-lg shadow-sm">Monitor {analysisData.forecast.second_zone}</span>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-[12px] font-bold rounded-lg shadow-sm">{analysisData.forecast.trend} activity trend</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Forecast generated from uploaded dataset via Flask backend ML engines.</p>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

/* --- SMALL REUSABLES --- */
const EmptyState = ({ tab, onGo }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-[#E2E8F0] rounded-xl shadow-sm h-[400px]">
    {tab === 'analytics' ? <BarChart2 className="w-16 h-16 text-[#CBD5E1] mb-4" /> : <TrendingUp className="w-16 h-16 text-[#CBD5E1] mb-4" />}
    <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">{tab === 'analytics' ? 'No data to analyze' : 'Upload dataset to generate risk forecast'}</h3>
    <p className="text-[13px] text-[#64748B] mb-6 max-w-sm">Upload and map a CSV dataset in the Data & Alerts tab to see analytics</p>
    <button onClick={onGo} className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-[13px] rounded-lg transition-colors shadow-sm">Go to Upload</button>
  </div>
);

const StatChip = ({ label, value }) => (
  <div className="bg-white border border-[#E2E8F0] px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm min-w-[180px]">
    <div className="flex flex-col">
      <span className="text-[11px] font-bold text-[#64748B] uppercase">{label}</span>
      <span className="text-[15px] font-bold text-[#0F172A] leading-tight mt-0.5">{value}</span>
    </div>
  </div>
);

const NoData = ({ text }) => (
  <div className="flex items-center justify-center h-[200px] w-full text-[13px] font-medium text-[#94A3B8] bg-[#F8F9FC] rounded-lg border border-dashed border-[#CBD5E1]">
    {text}
  </div>
);

const RiskCard = ({ title, value, color }) => (
  <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-center min-h-[100px] ${color}`}>
    <span className="text-[12px] font-bold opacity-70 mb-1">{title}</span>
    <span className="text-[18px] font-bold leading-tight capitalize">{value}</span>
  </div>
);
