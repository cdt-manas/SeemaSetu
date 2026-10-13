import React, { useState, useEffect } from 'react';
import { 
  Video, AlertTriangle, ShieldAlert, Users, 
  ChevronRight, TrendingUp, TrendingDown,
  Activity, CheckCircle2, Shield, AlertCircle, Database, Brain, UploadCloud, RefreshCw
} from 'lucide-react';
import { subscribeToAlerts, fetchRefugeeCases, checkHealth } from './api';

/* --- HELPER COMPONENTS --- */

// Number counter animation component
const AnimatedNumber = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}</span>;
};

// Bar Chart Component (Div-based)
const ActivityChart = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const data = [3, 7, 2, 9, 4, 6, 7];
  const max = 10; // slightly above max value of 9
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="flex items-end justify-between h-[120px] mt-4 px-2">
      {data.map((val, idx) => {
        const heightPercent = isLoaded ? (val / max) * 100 : 0;
        return (
          <div key={idx} className="flex flex-col items-center group relative w-full">
            <span className="text-[11px] font-medium text-[#64748B] mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6">
              {val}
            </span>
            <div className="w-8 sm:w-10 bg-[#E2E8F0] rounded-t-sm overflow-hidden h-full flex items-end">
              <div 
                className="w-full bg-[#2563EB] group-hover:bg-[#1E3A5F] transition-all duration-700 ease-out rounded-t-sm"
                style={{ height: `${heightPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-[#64748B] mt-2">
              {days[idx]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* --- MAIN COMPONENT --- */

export default function OverviewPage() {
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);
  const [systemOnline, setSystemOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // CSV summary from localStorage
  const [analysisSummary, setAnalysisSummary] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const saved = localStorage.getItem('lastAnalysisSummary');
    if (saved) {
      try {
        setAnalysisSummary(JSON.parse(saved));
      } catch (e) {}
    }

    // Subscribe to real-time alerts
    const unsubscribe = subscribeToAlerts((realTimeAlerts) => {
      setAlerts(realTimeAlerts);
    }, 10);
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // Run APIs in parallel (alerts handled via real-time subscription)
    const [healthResult, casesResult] = await Promise.all([
      checkHealth(),
      fetchRefugeeCases()
    ]);
  
    // System status
    setSystemOnline(!!healthResult.status);
  
    // Refugee cases
    if (casesResult.success) {
      setCases(casesResult.cases);
    }
  
    setLoading(false);
  };

  // Dynamic stat values
  const alertsToday = alerts.filter(a => {
    const today = new Date().toDateString();
    return new Date(a.timestamp).toDateString() === today;
  }).length;

  const threatsDetected = alerts.filter(
    a => a.threat_level === 'HIGH' || a.status === 'Confirmed'
  ).length;

  const totalCases = cases.length;

  return (
    <div className="animate-in fade-in duration-200 opacity-100 flex flex-col gap-5">
      
      {/* Page Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-[#0F172A]">Overview</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">System overview and live statistics</p>
        </div>
      </div>

      {/* Row 1 — Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1 */}
        <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150 relative">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-[32px] font-bold text-[#0F172A] leading-none mb-1">
            <AnimatedNumber end={0} />
          </div>
          <div className="text-[13px] font-medium text-[#64748B]">Datasets Loaded</div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150 relative">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-[32px] font-bold text-[#0F172A] leading-none mb-1">
            <AnimatedNumber end={alertsToday} />
          </div>
          <div className="text-[13px] font-medium text-[#64748B]">Alerts Today</div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150 relative">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-[32px] font-bold text-[#0F172A] leading-none mb-1">
            <AnimatedNumber end={threatsDetected} />
          </div>
          <div className="text-[13px] font-medium text-[#64748B]">Threats Detected</div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150 relative">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-[32px] font-bold text-[#0F172A] leading-none mb-1">
            <AnimatedNumber end={totalCases} />
          </div>
          <div className="text-[13px] font-medium text-[#64748B]">Refugee Cases</div>
        </div>
      </div>

      {/* Row 2 — 60/40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* LEFT (60%) — Recent Alerts */}
        <div className="lg:col-span-3 bg-[#FFFFFF] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150 flex flex-col">
          <div className="p-6 pb-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-[16px] font-bold text-[#0F172A]">Recent Alerts</h3>
              <span className="flex items-center gap-1 text-[11px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
                LIVE
              </span>
            </div>
            <button className="text-[13px] font-medium text-[#2563EB] hover:underline">View All</button>
          </div>
          <div className="flex flex-col p-4">
            {alerts.length === 0 ? (
              // Empty state
              <div className="text-center py-8 text-[#94A3B8]">
                <AlertTriangle className="mx-auto mb-2" size={24} />
                <p className="text-sm font-medium">No alerts yet</p>
                <p className="text-xs mt-1">Alerts will appear when detection runs</p>
              </div>
            ) : (
              // Real alerts
              alerts.slice(0, 5).map(alert => (
                <div key={alert.id}
                  className={`flex items-center justify-between py-3 px-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors border-b border-[#E2E8F0] last:border-0 ${alert.threat_level === 'HIGH' ? 'bg-red-50/40' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full w-20 text-center uppercase tracking-wider
                      ${alert.threat_level === 'HIGH' 
                        ? 'bg-red-100 text-red-700'
                        : alert.threat_level === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'}`}>
                      {alert.threat_level || 'LOW'}
                    </span>
                    <div>
                      <p className="text-[14px] font-bold text-[#0F172A]">
                        {alert.location || 'Demo — Laptop Camera'}
                      </p>
                      <p className="text-[12px] text-[#64748B]">
                        {alert.camera_id} &bull; {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#64748B]" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT (40%) — System Status */}
        <div className="lg:col-span-2 bg-[#FFFFFF] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150 flex flex-col">
          <div className="p-6 pb-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#0F172A]">System Status</h3>
          </div>
          <div className="flex flex-col p-2">
            {[
              { name: 'Detection Model', status: systemOnline ? 'Operational' : 'Offline', state: systemOnline ? 'green' : 'amber', icon: Brain },
              { name: 'Alert Pipeline', status: alerts.length >= 0 ? 'Active' : 'Failed', state: alerts.length >= 0 ? 'green' : 'gray', icon: Activity },
              { name: 'Database', status: cases.length >= 0 ? 'Connected' : 'Failed', state: cases.length >= 0 ? 'green' : 'gray', icon: Database },
              { name: 'Refugee Portal', status: cases.length >= 0 ? 'Operational' : 'Failed', state: cases.length >= 0 ? 'green' : 'gray', icon: Users },
              { name: 'Risk Engine', status: 'Initializing', state: 'amber', icon: ShieldAlert },
            ].map((sys, i) => {
              const Icon = sys.icon;
              return (
                <div key={i} className="flex items-center justify-between p-3 px-4 border-b border-[#E2E8F0] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Icon className="w-4 h-4 text-[#64748B]" />
                    </div>
                    <span className="text-[14px] font-medium text-[#0F172A]">{sys.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${sys.state === 'green' ? 'bg-[#22C55E]' : sys.state === 'amber' ? 'bg-[#F59E0B]' : 'bg-[#94A3B8]'}`} />
                    <span className="text-[13px] font-medium text-[#64748B]">{sys.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3 — 50/50 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* LEFT — Alert Activity */}
        <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150">
          <div className="mb-4">
            <h3 className="text-[16px] font-bold text-[#0F172A]">Alert Activity</h3>
            <p className="text-[13px] text-[#64748B]">Last 7 Days</p>
          </div>
          <ActivityChart />
        </div>

        {/* RIGHT — Latest CSV Analysis */}
        <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150">
          <div className="mb-4">
            <h3 className="text-[16px] font-bold text-[#0F172A]">Latest CSV Analysis</h3>
            <p className="text-[13px] text-[#64748B]">Upload a dataset in Intelligence Center to see insights</p>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            {!analysisSummary ? (
              <div className="text-[13px] font-medium text-[#94A3B8] p-4 text-center bg-slate-50 border border-slate-200 border-dashed rounded-lg mt-2">
                No CSV analysis found. Go to Intelligence Center to upload and analyze data.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <span className="text-[13px] font-medium text-[#64748B]">Total Records</span>
                  <span className="text-[13px] font-bold text-[#0F172A]">{analysisSummary.total_records.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <span className="text-[13px] font-medium text-[#64748B]">Date Range</span>
                  <span className="text-[13px] font-bold text-[#0F172A]">{analysisSummary.date_range.start} — {analysisSummary.date_range.end}</span>
                </div>
                <div className="flex flex-col gap-1 pb-3">
                  <span className="text-[13px] font-medium text-[#64748B]">Key Finding</span>
                  <span className="text-[13px] font-bold text-[#0F172A] p-2 bg-blue-50 text-blue-700 rounded-lg">Highest activity: {analysisSummary.top_zone}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 4 — Full Width Refugee Cases */}
      <div className="bg-[#FFFFFF] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] hover:shadow-md transition duration-150 overflow-hidden">
        <div className="p-6 pb-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-[16px] font-bold text-[#0F172A]">Recent Refugee Cases</h3>
            <button onClick={loadDashboardData} className="text-[#64748B] hover:text-[#0F172A] transition-colors" title="Refresh Data">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <button className="text-[13px] font-medium text-[#2563EB] hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E2E8F0]">
                <th className="px-6 py-3 text-[13px] font-semibold text-[#64748B]">Case ID</th>
                <th className="px-6 py-3 text-[13px] font-semibold text-[#64748B]">Name</th>
                <th className="px-6 py-3 text-[13px] font-semibold text-[#64748B]">Country of Origin</th>
                <th className="px-6 py-3 text-[13px] font-semibold text-[#64748B]">Submitted Date</th>
                <th className="px-6 py-3 text-[13px] font-semibold text-[#64748B]">ML Score</th>
                <th className="px-6 py-3 text-[13px] font-semibold text-[#64748B]">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="animate-pulse h-8 bg-slate-100 rounded" />
                    </td>
                  </tr>
                ))
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#94A3B8] text-[14px] font-medium">
                    No refugee cases yet
                  </td>
                </tr>
              ) : (
                cases.slice(0, 5).map(c => (
                  <tr key={c.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-mono font-bold text-[#0F172A]">{c.case_id}</td>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#374151]">{c.full_name}</td>
                    <td className="px-6 py-4 text-[13px] text-[#64748B]">{c.country_of_origin}</td>
                    <td className="px-6 py-4 text-[13px] text-[#64748B]">
                      {new Date(c.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                        c.ml_score >= 80 ? 'bg-green-100 text-green-700' :
                        c.ml_score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {Math.round(c.ml_score || 0)}/100
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                        c.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                        c.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                        c.status === 'Under Review' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                        'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
