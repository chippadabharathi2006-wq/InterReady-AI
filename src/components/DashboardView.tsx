import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  FileCheck,
  PlusCircle,
  BarChart,
  Target,
  Compass,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { DashboardStats } from '../types/index.ts';

interface DashboardViewProps {
  onSelectInternship: (id: string) => void;
  onOpenAddModal: () => void;
  onNavigateToView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectInternship,
  onOpenAddModal,
  onNavigateToView,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const statusCounts = stats?.statusCounts || {
    Interested: 0,
    Applied: 0,
    Shortlisted: 0,
    Interview: 0,
    Selected: 0,
    Rejected: 0,
    Withdrawn: 0,
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approaching':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Overview & Analytics</h2>
          <p className="text-xs text-slate-500">
            Real-time pipeline tracking, deadline alerts, and aggregated skill gap intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToView('skill-analysis')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>AI Skill Analyzer</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Internship</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Tracked</span>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats?.totalApplications || 0}</p>
          <span className="text-[10px] text-blue-600 font-medium">All applications</span>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700">Applied</span>
          <p className="mt-1 text-2xl font-black text-blue-900">{statusCounts.Applied || 0}</p>
          <span className="text-[10px] text-blue-600 font-medium">In screening</span>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-700">Shortlisted</span>
          <p className="mt-1 text-2xl font-black text-indigo-900">{statusCounts.Shortlisted || 0}</p>
          <span className="text-[10px] text-indigo-600 font-medium">OA & Assessments</span>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-purple-700">Interviews</span>
          <p className="mt-1 text-2xl font-black text-purple-900">{statusCounts.Interview || 0}</p>
          <span className="text-[10px] text-purple-600 font-medium">Active rounds</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700">Selected / Offers</span>
          <p className="mt-1 text-2xl font-black text-emerald-900">{statusCounts.Selected || 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">🎉 Congratulations!</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Avg Skill Match</span>
          <p className="mt-1 text-2xl font-black text-blue-600">{stats?.averageMatchPercentage || 0}%</p>
          <span className="text-[10px] text-slate-400 font-medium">Profile alignment</span>
        </div>
      </div>

      {/* Grid: Upcoming Deadlines + Frequently Missing Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Upcoming Deadlines */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Upcoming Application Deadlines</h3>
              </div>
              <button
                onClick={() => onNavigateToView('internships')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View all
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {(!stats?.upcomingDeadlines || stats.upcomingDeadlines.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Calendar className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  No upcoming deadlines detected. Add internships with target deadlines.
                </div>
              ) : (
                stats.upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectInternship(item.id)}
                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-blue-50/50 hover:border-blue-200 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {item.company}
                        </span>
                        <span className="text-[10px] text-slate-400">• {item.role}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">Deadline: {item.deadline}</span>
                    </div>

                    <div className="text-right">
                      <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold border ${getUrgencyBadge(item.urgency)}`}>
                        {item.daysRemaining === 0
                          ? 'Today (Critical)'
                          : `${item.daysRemaining} days remaining`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Critical (0d) • Urgent (1-2d) • Approaching (3-7d)</span>
            <span className="font-semibold text-blue-600 cursor-pointer" onClick={() => onNavigateToView('internships')}>
              Sort by deadline →
            </span>
          </div>
        </div>

        {/* Section 2: Skill Gap Summary (Most frequently missing skills across all internships) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Skill Gap Summary</h3>
              </div>
              <span className="text-[11px] text-slate-400">Frequently Missing in Target Roles</span>
            </div>

            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              These technologies appear most frequently across your saved internships but are missing from your declared profile.
            </p>

            <div className="mt-4 space-y-2.5">
              {(!stats?.topMissingSkills || stats.topMissingSkills.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  No missing skill trends yet. Run AI Analysis on your internships!
                </div>
              ) : (
                stats.topMissingSkills.map((gap) => (
                  <div
                    key={gap.skill}
                    className="flex items-center justify-between rounded-2xl bg-rose-50/60 p-3 border border-rose-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-xs font-bold text-rose-700">
                        ✗
                      </span>
                      <span className="text-xs font-bold text-rose-950">{gap.skill}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-200 shadow-2xs">
                        Required in {gap.count} {gap.count === 1 ? 'internship' : 'internships'}
                      </span>
                      <button
                        onClick={() => onNavigateToView('learning')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Start Learning →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <button
              onClick={() => onNavigateToView('learning')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Browse all 5-step learning roadmaps →
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Role Domains & Pipeline Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roles Distribution */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Internship Roles Breakdown</h3>
          </div>

          <div className="space-y-3">
            {stats?.rolesFrequency && Object.keys(stats.rolesFrequency).length > 0 ? (
              Object.entries(stats.rolesFrequency).map(([role, count]) => {
                const total = stats.totalApplications || 1;
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={role} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{role}</span>
                      <span className="text-slate-500 font-mono">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">No roles recorded yet.</p>
            )}
          </div>
        </div>

        {/* Readiness & Roadmap Progress Summary */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Compass className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Preparation & Readiness Hub</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
              <span className="text-xs font-semibold text-indigo-800">Learning Roadmaps</span>
              <p className="mt-1 text-2xl font-black text-indigo-900">
                {stats?.completedRoadmaps || 0} / {stats?.totalRoadmaps || 0}
              </p>
              <p className="text-[11px] text-indigo-600 mt-1">Skills completed</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Profile Skills</span>
              <p className="mt-1 text-2xl font-black text-slate-900">{stats?.userSkillsCount || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Declared in profile</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <button
              onClick={() => onNavigateToView('resume-analysis')}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <span className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-sky-600" />
                <span>Screen Resume Against Tracked Job</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateToView('interview-prep')}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>AI Interview Question Practice</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
