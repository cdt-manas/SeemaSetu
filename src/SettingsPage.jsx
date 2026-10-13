import React, { useState, useRef } from 'react';
import { 
  Globe, Cpu, Video, Bell, Users, Shield, Info,
  Save, Eye, EyeOff, Plus, Pencil, Trash, X, Check,
  Power, AlertTriangle, Monitor, Smartphone, AlertCircle,
  FileText, CheckCircle2, Bot, Database
} from 'lucide-react';

const INITIAL_CAMERAS = [
  { id: "CAM-01", name: "North Gate Alpha", zone: "Sector 2 - Mizoram Belt", status: "Online", lastActive: "Just now" },
  { id: "CAM-02", name: "River Crossing Point", zone: "Sector 4 - North Bengal", status: "Online", lastActive: "Just now" },
  { id: "CAM-03", name: "Jungle Perimeter East", zone: "Sector 7 - Assam Corridor", status: "Alert", lastActive: "1 min ago" },
  { id: "CAM-04", name: "Highway Checkpoint", zone: "Sector 1 - Tripura Border", status: "Online", lastActive: "Just now" },
  { id: "CAM-05", name: "Mountain Pass South", zone: "Sector 5 - Manipur Sector", status: "Offline", lastActive: "2 hrs ago" },
  { id: "CAM-06", name: "Border Fence West", zone: "Sector 6 - Arunachal Zone", status: "Online", lastActive: "Just now" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { title, text, onConfirm }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const navItems = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'detection', label: 'Detection Settings', icon: Cpu },
    { id: 'alerts', label: 'Alert Configuration', icon: Bell },
    { id: 'refugee', label: 'Refugee Portal Settings', icon: Users },
    { id: 'security', label: 'System & Security', icon: Shield },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden animate-in fade-in duration-200">
      
      {/* LEFT MENU */}
      <div className="w-full md:w-[280px] bg-[#F8F9FC] border-r border-[#E2E8F0] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-5 border-b border-[#E2E8F0] shrink-0">
          <h2 className="text-[18px] font-bold text-[#0F172A]">Settings</h2>
          <p className="text-[12px] font-medium text-[#64748B] mt-1">Manage system preferences</p>
        </div>
        <div className="flex-1 py-4 px-3 flex flex-col gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                activeSection === item.id 
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]' 
                  : 'text-[#64748B] border-l-4 border-transparent hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 overflow-y-auto bg-white p-6 md:p-10 relative scroll-smooth">
        {activeSection === 'general' && <GeneralSettings onSave={() => showToast('General settings saved successfully')} />}
        {activeSection === 'detection' && <DetectionSettings onSave={() => showToast('Detection settings saved')} />}
        {activeSection === 'alerts' && <AlertConfiguration onSave={() => showToast('Alert configuration saved')} />}
        {activeSection === 'refugee' && <RefugeeSettings onSave={() => showToast('Refugee portal settings saved')} onShowToast={showToast} />}
        {activeSection === 'security' && <SystemSecurity onShowToast={showToast} onShowConfirm={setConfirmModal} />}
        {activeSection === 'about' && <AboutSection onShowToast={showToast} />}
      </div>

      {/* MODALS & TOASTS */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 animate-in fade-in" onClick={() => setConfirmModal(null)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[16px] shadow-2xl p-6 animate-in zoom-in-95 flex flex-col text-center">
            <AlertTriangle className="w-12 h-12 text-[#EF4444] mb-3 mx-auto" />
            <h2 className="text-[18px] font-bold text-[#0F172A] mb-2">{confirmModal.title}</h2>
            <p className="text-[13px] text-[#64748B] mb-6">{confirmModal.text}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] text-[13px] font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                className="flex-1 py-2.5 bg-[#EF4444] text-white text-[13px] font-bold rounded-lg hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 bg-green-50 border-green-200">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-[13px] font-bold text-green-800">{toast.msg}</p>
        </div>
      )}

    </div>
  );
}

/* ==============================================
   SECTIONS
============================================== */

function GeneralSettings({ onSave }) {
  const [data, setData] = useState({
    name: 'Seema Setu — BCU North',
    tz: 'IST (UTC +5:30)',
    format: 'DD MMM YYYY',
    lang: 'English',
    autoLogout: '30 minutes',
    darkMode: false
  });

  return (
    <SectionLayout title="General Settings" subtitle="Configure basic system preferences" onSave={onSave}>
      <SettingRow label="System Name" desc="Display name for this installation">
        <input type="text" value={data.name} onChange={e=>setData({...data, name: e.target.value})} className="input-std w-[250px]" />
      </SettingRow>
      <SettingRow label="Timezone" desc="System timezone for timestamps">
        <select value={data.tz} onChange={e=>setData({...data, tz: e.target.value})} className="input-std w-[250px]">
          <option>IST (UTC +5:30)</option>
          <option>UTC</option>
        </select>
      </SettingRow>
      <SettingRow label="Date Format" desc="How dates are displayed across the system">
        <select value={data.format} onChange={e=>setData({...data, format: e.target.value})} className="input-std w-[250px]">
          <option>DD MMM YYYY</option>
          <option>MM/DD/YYYY</option>
          <option>YYYY-MM-DD</option>
        </select>
      </SettingRow>
      <SettingRow label="Language" desc="Interface language">
        <select value={data.lang} onChange={e=>setData({...data, lang: e.target.value})} className="input-std w-[250px]">
          <option>English</option>
          <option>Hindi</option>
        </select>
      </SettingRow>
      <SettingRow label="Auto Logout" desc="Automatically log out after inactivity" hideBorder>
        <select value={data.autoLogout} onChange={e=>setData({...data, autoLogout: e.target.value})} className="input-std w-[250px]">
          <option>15 minutes</option>
          <option>30 minutes</option>
          <option>1 hour</option>
        </select>
      </SettingRow>
    </SectionLayout>
  );
}

function DetectionSettings({ onSave }) {
  const [data, setData] = useState({
    conf: 0.60,
    iou: 0.45,
    unauth: true,
    auth: true,
    behavior: true,
    night: true
  });

  return (
    <SectionLayout title="Detection Settings" subtitle="Configure YOLOv8 model parameters" onSave={onSave} extraBtn="Reset to Defaults">
      <SettingRow label="Confidence Threshold" desc="Minimum confidence for detection alert">
        <div className="flex flex-col items-end gap-1 w-[250px]">
          <div className="flex items-center gap-3 w-full">
            <input type="range" min="0.40" max="0.95" step="0.05" value={data.conf} onChange={e=>setData({...data, conf: parseFloat(e.target.value)})} className="flex-1 accent-[#2563EB]" />
            <span className="text-[14px] font-bold text-[#0F172A] w-10 text-right">{data.conf.toFixed(2)}</span>
          </div>
          {data.conf < 0.50 && <span className="text-[11px] font-bold text-[#F59E0B]">Low threshold may cause excessive false alarms</span>}
        </div>
      </SettingRow>
      <SettingRow label="IoU Threshold" desc="Intersection over Union threshold">
        <div className="flex items-center gap-3 w-[250px]">
          <input type="range" min="0.30" max="0.70" step="0.05" value={data.iou} onChange={e=>setData({...data, iou: parseFloat(e.target.value)})} className="flex-1 accent-[#2563EB]" />
          <span className="text-[14px] font-bold text-[#0F172A] w-10 text-right">{data.iou.toFixed(2)}</span>
        </div>
      </SettingRow>
      <SettingRow label="Detection Classes" desc="Which classes to monitor">
        <div className="flex flex-col gap-3 w-[250px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#0F172A]">Unauthorized Individual</span>
            <Toggle checked={data.unauth} onChange={() => setData({...data, unauth: !data.unauth})} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#0F172A]">Authorized Personnel (BSF)</span>
            <Toggle checked={data.auth} onChange={() => setData({...data, auth: !data.auth})} />
          </div>
        </div>
      </SettingRow>
      <SettingRow label="Behavior Analysis" desc="Enable MediaPipe pose-based behavior detection">
        <Toggle checked={data.behavior} onChange={() => setData({...data, behavior: !data.behavior})} />
      </SettingRow>
      <SettingRow label="Night Mode Enhancement" desc="Apply CLAHE preprocessing for low-light feeds" hideBorder>
        <Toggle checked={data.night} onChange={() => setData({...data, night: !data.night})} />
      </SettingRow>
      <SettingRow label="Model Version" desc="Currently loaded model" hideBorder>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-[#0F172A]">YOLOv8s — v2.1 (Nov 2024)</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full">Update Available</span>
        </div>
      </SettingRow>
    </SectionLayout>
  );
}


function AlertConfiguration({ onSave }) {
  const [data, setData] = useState({
    sound: true,
    desktop: true,
    minThreat: 'LOW',
    autoConfirm: false,
    retention: '60 days'
  });

  return (
    <SectionLayout title="Alert Configuration" subtitle="Configure how and when alerts are triggered" onSave={onSave}>
      <SettingRow label="Alert Sound" desc="Play sound when new alert arrives">
        <Toggle checked={data.sound} onChange={() => setData({...data, sound: !data.sound})} />
      </SettingRow>
      <SettingRow label="Desktop Notifications" desc="Show browser notifications for HIGH alerts">
        <Toggle checked={data.desktop} onChange={() => setData({...data, desktop: !data.desktop})} />
      </SettingRow>
      <SettingRow label="Minimum Threat Level to Alert" desc="Only create alerts above this threat level">
        <select value={data.minThreat} onChange={e=>setData({...data, minThreat: e.target.value})} className="input-std w-[250px]">
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
        </select>
      </SettingRow>
      <SettingRow label="Auto-Confirm Low Threat" desc="Automatically mark LOW threat alerts as false alarm after 1 hour if not reviewed">
        <div className="flex flex-col items-end gap-1 w-[250px]">
          <Toggle checked={data.autoConfirm} onChange={() => setData({...data, autoConfirm: !data.autoConfirm})} />
          {data.autoConfirm && <span className="text-[11px] font-bold text-[#EF4444]">Use with caution</span>}
        </div>
      </SettingRow>
      <SettingRow label="Alert Retention Period" desc="How long to keep alert records" hideBorder>
        <select value={data.retention} onChange={e=>setData({...data, retention: e.target.value})} className="input-std w-[250px]">
          <option>30 days</option>
          <option>60 days</option>
          <option>90 days</option>
          <option>1 year</option>
        </select>
      </SettingRow>
    </SectionLayout>
  );
}

function RefugeeSettings({ onSave, onShowToast }) {
  const [data, setData] = useState({
    status: true,
    autoAssign: true,
    docVerify: true,
    expiry: '90 days',
    maxCases: 15
  });

  return (
    <SectionLayout title="Refugee Portal Settings" subtitle="Configure the refugee case management system" onSave={onSave}>
      <SettingRow label="Portal Status" desc="Enable or disable refugee registration portal">
        <Toggle checked={data.status} onChange={() => setData({...data, status: !data.status})} />
      </SettingRow>
      <SettingRow label="ML Scoring Model" desc="Model used for refugee case scoring">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-[#0F172A] px-3 py-1.5 bg-[#F8F9FC] border border-[#E2E8F0] rounded-lg">Random Forest v1.2.0</span>
          <button onClick={() => onShowToast('Model retraining scheduled. This may take 2-4 hours.', 'info')} className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[12px] font-bold text-[#0F172A] rounded-lg shadow-sm transition-colors">Retrain Model</button>
        </div>
      </SettingRow>
      <SettingRow label="Auto-Assignment" desc="Automatically assign new cases to available officers">
        <Toggle checked={data.autoAssign} onChange={() => setData({...data, autoAssign: !data.autoAssign})} />
      </SettingRow>
      <SettingRow label="Document Verification" desc="Require manual document verification before scoring">
        <Toggle checked={data.docVerify} onChange={() => setData({...data, docVerify: !data.docVerify})} />
      </SettingRow>
      <SettingRow label="Case Expiry" desc="Auto-close unresolved cases after">
        <select value={data.expiry} onChange={e=>setData({...data, expiry: e.target.value})} className="input-std w-[150px]">
          <option>30 days</option>
          <option>60 days</option>
          <option>90 days</option>
        </select>
      </SettingRow>
      <SettingRow label="Maximum Cases Per Officer" desc="Alert when officer exceeds this caseload" hideBorder>
        <input type="number" min="1" max="100" value={data.maxCases} onChange={e=>setData({...data, maxCases: parseInt(e.target.value)})} className="input-std w-[100px] text-right" />
      </SettingRow>
    </SectionLayout>
  );
}

function SystemSecurity({ onShowToast, onShowConfirm }) {
  const [sessions, setSessions] = useState([
    { id: 1, text: 'This Device — Chrome, Windows — Active Now', current: true },
    { id: 2, text: 'Mobile — Android App — 2 hrs ago', current: false }
  ]);
  const [showPwd, setShowPwd] = useState(false);

  const revoke = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    onShowToast('Session revoked');
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-[20px] font-bold text-[#0F172A]">System & Security</h2>
        <p className="text-[13px] font-medium text-[#64748B]">Security settings and system information</p>
      </div>

      <div className="flex flex-col gap-6 max-w-3xl">
        {/* Passwords */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[#E2E8F0]">
          <div className="flex flex-col gap-1 md:w-1/2">
            <h4 className="text-[14px] font-bold text-[#0F172A]">Change Password</h4>
            <p className="text-[12px] text-[#64748B]">Update your account password</p>
          </div>
          <div className="flex flex-col gap-3 md:w-1/2 relative">
            <input type={showPwd ? 'text' : 'password'} placeholder="Current Password" className="input-std w-full pr-10" />
            <input type={showPwd ? 'text' : 'password'} placeholder="New Password" className="input-std w-full pr-10" />
            <input type={showPwd ? 'text' : 'password'} placeholder="Confirm New Password" className="input-std w-full pr-10" />
            <button onClick={() => setShowPwd(!showPwd)} className="absolute top-3 right-3 text-[#94A3B8] hover:text-[#0F172A]"><Eye className="w-4 h-4" /></button>
            <button onClick={() => onShowToast('Password updated successfully')} className="mt-2 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors">Update Password</button>
          </div>
        </div>

        {/* 2FA */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E2E8F0]">
          <div className="flex flex-col gap-1">
            <h4 className="text-[14px] font-bold text-[#0F172A]">Two Factor Authentication</h4>
            <p className="text-[12px] text-[#64748B]">Add extra security to your account</p>
          </div>
          <div className="flex items-center gap-4">
            <button disabled className="text-[12px] font-bold text-[#94A3B8] cursor-not-allowed">Set Up 2FA</button>
            <Toggle checked={false} disabled={false} />
          </div>
        </div>

        {/* Sessions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[#E2E8F0]">
          <div className="flex flex-col gap-1 md:w-1/3">
            <h4 className="text-[14px] font-bold text-[#0F172A]">Session Management</h4>
            <p className="text-[12px] text-[#64748B]">Active sessions</p>
          </div>
          <div className="flex flex-col gap-3 md:w-2/3">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${s.current ? 'bg-[#22C55E]' : 'bg-[#94A3B8]'}`}></div>
                  <span className="text-[13px] font-medium text-[#0F172A]">{s.text}</span>
                </div>
                {!s.current && (
                  <button onClick={() => revoke(s.id)} className="px-3 py-1 border border-[#EF4444] text-[#EF4444] hover:bg-red-50 text-[11px] font-bold rounded transition-colors">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[#E2E8F0]">
          <div className="flex flex-col gap-1 md:w-1/3">
            <h4 className="text-[14px] font-bold text-[#0F172A]">Activity Log</h4>
            <p className="text-[12px] text-[#64748B]">Recent account activity</p>
          </div>
          <div className="flex flex-col gap-0 md:w-2/3 border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
             {[
               { i: <Shield className="w-4 h-4 text-blue-500" />, t: "Login — 14 Nov 2024, 08:30 AM — Chrome Windows" },
               { i: <CheckCircle2 className="w-4 h-4 text-green-500" />, t: "Case Approved — 13 Nov 2024, 04:15 PM" },
               { i: <Bell className="w-4 h-4 text-amber-500" />, t: "Alert Confirmed — 13 Nov 2024, 02:40 PM" },
               { i: <Shield className="w-4 h-4 text-blue-500" />, t: "Login — 13 Nov 2024, 08:00 AM" }
             ].map((l, i) => (
               <div key={i} className="flex items-center gap-3 p-3 border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 transition-colors">
                 {l.i}
                 <span className="text-[12px] font-medium text-[#374151]">{l.t}</span>
               </div>
             ))}
          </div>
        </div>



        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-4">
          <h4 className="text-[14px] font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h4>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => onShowConfirm({title: 'Clear All Alerts', text: 'This will permanently delete all alert history. Continue?', onConfirm: () => onShowToast('Alerts cleared')})}
              className="flex-1 py-2.5 bg-white border border-[#EF4444] text-[#EF4444] hover:bg-red-50 text-[13px] font-bold rounded-lg shadow-sm transition-colors"
            >
              Clear All Alerts
            </button>
            <button 
              onClick={() => onShowConfirm({title: 'Reset Refugee Cases', text: 'This will permanently delete all refugee case records. Continue?', onConfirm: () => onShowToast('Cases reset')})}
              className="flex-1 py-2.5 bg-white border border-[#EF4444] text-[#EF4444] hover:bg-red-50 text-[13px] font-bold rounded-lg shadow-sm transition-colors"
            >
              Reset Refugee Cases
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function AboutSection({ onShowToast }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 animate-in fade-in duration-200 max-w-2xl mx-auto py-10">
      
      <div className="text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-[#2563EB]" />
        </div>
        <h2 className="text-[28px] font-black text-[#0F172A] mb-2 tracking-tight">Seema Setu</h2>
        <p className="text-[15px] font-medium text-[#64748B] mb-4">AI-Powered Border Surveillance & Refugee Management System</p>
        <div className="flex items-center gap-3 justify-center mb-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full border border-[#E2E8F0]">Version: v1.0.0-beta</span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full border border-[#E2E8F0]">Build: Nov 2024</span>
        </div>
        <p className="text-[12px] font-bold text-[#2563EB]">Developed by: DSATM Information Science Dept</p>
      </div>

      <div className="w-full bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl p-6">
        <h3 className="text-[14px] font-bold text-[#0F172A] mb-4 border-b border-[#E2E8F0] pb-2">System Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailRow label="Detection Model" value="YOLOv8s" />
          <DetailRow label="ML Framework" value="Python / scikit-learn" />
          <DetailRow label="Frontend" value="React.js + Tailwind CSS" />
          <DetailRow label="Backend" value="Flask (Python)" />
          <DetailRow label="Database" value="Firebase" />
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-bold text-[#64748B]">Last System Check</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0F172A]">Just now</span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <h3 className="text-[14px] font-bold text-[#0F172A] mb-1">Built as Final Year Project</h3>
        <p className="text-[12px] font-medium text-[#64748B] mb-4">DSATM, Bengaluru — 2024-25</p>
        <div className="flex flex-col gap-2 text-[13px]">
          <div className="flex items-start gap-4">
            <span className="font-bold text-[#0F172A] w-12 shrink-0">Team:</span>
            <span className="font-medium text-[#374151] leading-relaxed">Manas Kumar, Manaswi K A, N Sujan, Priyansh Sinha</span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="font-bold text-[#0F172A] w-12 shrink-0">Guide:</span>
            <span className="font-medium text-[#374151]">[Faculty Name]</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => onShowToast('You are on the latest version', 'info')}
        className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white text-[14px] font-bold rounded-xl shadow-sm transition-colors"
      >
        Check for Updates
      </button>

    </div>
  );
}

// Subcomponents
const SectionLayout = ({ title, subtitle, onSave, extraBtn, children }) => (
  <div className="flex flex-col gap-8 animate-in fade-in duration-200">
    <div className="flex flex-col gap-1 mb-2">
      <h2 className="text-[20px] font-bold text-[#0F172A]">{title}</h2>
      <p className="text-[13px] font-medium text-[#64748B]">{subtitle}</p>
    </div>
    
    <div className="flex flex-col gap-0 max-w-3xl">
      {children}
    </div>

    <div className="flex items-center gap-4 mt-4 max-w-3xl justify-end border-t border-[#E2E8F0] pt-6">
      {extraBtn && <button className="px-5 py-2.5 border border-[#E2E8F0] text-[#0F172A] text-[13px] font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{extraBtn}</button>}
      <button onClick={onSave} className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors">
        <Save className="w-4 h-4" /> Save Changes
      </button>
    </div>
  </div>
);

const SettingRow = ({ label, desc, hideBorder, children }) => (
  <div className={`flex flex-col md:flex-row md:items-center justify-between py-6 gap-4 ${hideBorder ? '' : 'border-b border-[#E2E8F0]'}`}>
    <div className="flex flex-col gap-1 md:w-1/2 md:pr-4">
      <h4 className="text-[14px] font-bold text-[#0F172A]">{label}</h4>
      <p className="text-[12px] text-[#64748B] leading-relaxed">{desc}</p>
    </div>
    <div className="flex items-center justify-end md:w-1/2">
      {children}
    </div>
  </div>
);

const Toggle = ({ checked, onChange, disabled }) => (
  <button 
    onClick={onChange}
    disabled={disabled}
    className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${checked ? 'left-6' : 'left-1'}`}></div>
  </button>
);

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-[13px]">
    <span className="font-bold text-[#64748B]">{label}</span>
    <span className="font-bold text-[#0F172A] text-right">{value}</span>
  </div>
);
