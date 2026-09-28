import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Sparkles, Bell, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown.tsx';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, activeView }) => {
  const { user, profile, logout } = useAuth();

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Internship Dashboard';
      case 'internships':
        return 'Tracked Internships';
      case 'skill-analysis':
        return 'AI Skill Gap Analyzer';
      case 'resume-analysis':
        return 'AI Resume Analyzer';
      case 'interview-prep':
        return 'AI Interview Preparation';
      case 'learning':
        return 'Learning Roadmaps';
      case 'profile':
        return 'Student Profile';
      case 'details':
        return 'Internship Details';
      default:
        return 'InternReady AI';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-900">InternReady</span>
        </div>

        <div className="hidden lg:block">
          <h1 className="text-lg font-bold text-slate-900">{getViewTitle()}</h1>
          <p className="text-xs text-slate-500">Track applications, analyze skill gaps, and prepare for interviews</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <NotificationsDropdown />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-3.5 w-3.5" />}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'Student'}</p>
            <p className="text-[10px] text-slate-500 leading-tight">
              {profile?.college ? profile.college.slice(0, 20) + (profile.college.length > 20 ? '...' : '') : 'B.Tech Student'}
            </p>
          </div>
          <button
            onClick={logout}
            className="ml-1 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            title="Log Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
