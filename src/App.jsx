import React, { useState, useEffect } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  NavLink, 
  useLocation,
  Navigate
} from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  Video, 
  Brain, 
  Archive, 
  Users, 
  ClipboardCheck, 
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';

/* =========================================
   REUSABLE COMPONENTS
========================================= */

// Shell for individual pages holding placeholders
const PageShell = ({ title, description, icon: Icon }) => (
  // Fade-in transition for smooth page changes
  <div className="animate-in fade-in duration-200 opacity-100">
    {/* Page Header */}
    <div className="mb-6">
      <h2 className="text-[22px] font-bold text-[#0F172A]">{title}</h2>
      <p className="text-sm font-medium text-[#64748B] mt-1">{description}</p>
    </div>
    
    {/* Content Placeholder Card */}
    <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="h-12 w-12 rounded-full bg-[#F8F9FC] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[#2563EB]" />
      </div>
      <h3 className="text-lg font-bold text-[#0F172A] mb-2">{title} Application</h3>
      <p className="text-[#64748B] font-medium max-w-md">
        This is the structural shell for the {title} module. Replace this card with your functional components and real data.
      </p>
    </div>
  </div>
);

/* =========================================
   PAGE COMPONENTS
========================================= */

import OverviewPage from './OverviewPage';
import LiveFeedPage from './LiveFeedPage';
import IntelligenceCenterPage from './IntelligenceCenterPage';
import EvidenceVaultPage from './EvidenceVaultPage';
import RefugeePortalPage from './RefugeePortalPage';
import OfficerReviewPage from './OfficerReviewPage';
import SettingsPage from './SettingsPage';

const Overview = () => <OverviewPage />;
const LiveFeed = () => <LiveFeedPage />;
const IntelligenceCenter = () => <IntelligenceCenterPage />;
const EvidenceVault = () => <EvidenceVaultPage />;
const RefugeePortal = () => <RefugeePortalPage />;
const OfficerReview = () => <OfficerReviewPage />;

/* =========================================
   LAYOUT COMPONENT
========================================= */

// Sidebar Navigation Configuration
const NAV_ITEMS = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/live-feed', label: 'Live Feed', icon: Video },
  { path: '/intelligence', label: 'Intelligence Center', icon: Brain },
  { path: '/evidence', label: 'Evidence Vault', icon: Archive },
  { path: '/refugees', label: 'Refugee Portal', icon: Users },
  { path: '/review', label: 'Officer Review', icon: ClipboardCheck },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const AppLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Determine title for mobile/topbar based on current route
  const currentNavItem = NAV_ITEMS.find(item => item.path === location.pathname);
  const pageTitle = currentNavItem ? currentNavItem.label : 'Seema Setu';

  return (
    // Application Root Container
    <div className="flex h-screen bg-[#F8F9FC] font-['Inter',sans-serif] overflow-hidden text-[#374151]">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-[240px] bg-[#0F172A] flex flex-col transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header (Logo) */}
        <div className="h-[64px] flex items-center px-6 mb-4 shrink-0">
          <Shield className="w-6 h-6 text-[#2563EB] mr-3" />
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-bold text-[18px] leading-tight">Seema Setu</span>
            <span className="text-[#94A3B8] text-[11px] uppercase tracking-wider font-medium">Border Intelligence</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150
                ${isActive 
                  ? 'bg-[#1E3A5F] text-[#FFFFFF] border-l-[3px] border-[#2563EB] rounded-l-none' 
                  : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#FFFFFF] border-l-[3px] border-transparent'}
              `}
            >
              <item.icon className="w-5 h-5 mr-3 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer (User Profile) */}
        <div className="p-4 mt-auto border-t border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-[#FFFFFF] flex items-center justify-center text-xs font-bold shrink-0">
                AD
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-[13px] font-medium text-[#FFFFFF] truncate">Admin Officer</p>
                <p className="text-[11px] text-[#94A3B8] truncate">Border Control Unit</p>
              </div>
            </div>
            <button className="p-1.5 text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-white/10 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-[64px] bg-[#F8F9FC] border-b border-[#E2E8F0] px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          {/* Left Side (Mobile menu + Dynamic Title) */}
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 text-[#0F172A] hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* The page title updates dynamically but hides on mobile to save space if needed */}
            <h1 className="text-[22px] font-bold text-[#0F172A] hidden md:block">
              {pageTitle}
            </h1>
          </div>

          {/* Right Side Tools (Live Indicator, Search, Notifications) */}
          <div className="flex items-center space-x-4 md:space-x-6">
            
            {/* LIVE Badge */}
            <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-green-100 border border-green-200">
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse mr-1.5" />
              <span className="text-[10px] font-bold text-[#22C55E] tracking-wider">LIVE</span>
            </div>

            {/* Global Search Bar */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-1.5 bg-[#E2E8F0] border-transparent rounded-lg text-sm text-[#0F172A] focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all w-[200px] lg:w-[300px]"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-1.5 text-[#64748B] hover:bg-[#E2E8F0] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {/* Notification Dot */}
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-[#F8F9FC] flex items-center justify-center">
                {/* Visual cue for notifications without cramming the number */}
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8F9FC]">
          {children}
        </main>
      </div>
    </div>
  );
};

/* =========================================
   MAIN APP ROUTER
========================================= */

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Default Redirect to Overview */}
          <Route path="/" element={<Navigate to="/overview" replace />} />
          
          {/* Module Routes */}
          <Route path="/overview" element={<Overview />} />
          <Route path="/live-feed" element={<LiveFeed />} />
          <Route path="/intelligence" element={<IntelligenceCenter />} />
          <Route path="/evidence" element={<EvidenceVault />} />
          <Route path="/refugees" element={<RefugeePortal />} />
          <Route path="/review" element={<OfficerReview />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
