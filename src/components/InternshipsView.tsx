import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Building2,
  Calendar,
  ExternalLink,
  Trash2,
  Clock,
  Sparkles,
  ChevronRight,
  Database,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { Internship, InternshipStatus, WorkType } from '../types/index.ts';

interface InternshipsViewProps {
  onSelectInternship: (id: string) => void;
  onOpenAddModal: () => void;
}

export const InternshipsView: React.FC<InternshipsViewProps> = ({
  onSelectInternship,
  onOpenAddModal,
}) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'deadline' | 'match' | 'newest' | 'oldest'>('deadline');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const data = await api.getInternships();
      setInternships(data || []);
    } catch (err) {
      console.error('Failed to fetch internships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleStatusChange = async (id: string, newStatus: InternshipStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateInternship(id, { status: newStatus });
      setInternships((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this internship?')) return;
    try {
      await api.deleteInternship(id);
      setInternships((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSeedSamples = async () => {
    try {
      setSeeding(true);
      await api.seedSamples();
      await fetchInternships();
    } catch (err: any) {
      alert('Failed to seed samples: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  // Filter & Search Logic
  const filtered = internships
    .filter((item) => {
      const matchQuery =
        item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.job_description && item.job_description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchWorkType = workTypeFilter === 'All' || item.work_type === workTypeFilter;

      return matchQuery && matchStatus && matchWorkType;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return a.daysRemaining - b.daysRemaining;
      }
      if (sortBy === 'match') {
        return (b.match_percentage || 0) - (a.match_percentage || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.application_date).getTime() - new Date(a.application_date).getTime();
      }
      return new Date(a.application_date).getTime() - new Date(b.application_date).getTime();
    });

  const getUrgencyBadge = (urgency: string, daysRemaining: number) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approaching':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getStatusBadge = (status: InternshipStatus) => {
    switch (status) {
      case 'Selected':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Interview':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Shortlisted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Applied':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Withdrawn':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Internship Tracker</h2>
          <p className="text-xs text-slate-500">
            {internships.length} opportunities logged across all pipeline stages
          </p>
        </div>

        <div className="flex items-center gap-2">
          {internships.length === 0 && (
            <button
              onClick={handleSeedSamples}
              disabled={seeding}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Database className="h-3.5 w-3.5 text-indigo-600" />
              <span>{seeding ? 'Loading...' : 'Load Sample Internships'}</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Internship</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search company, role, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Work Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Work Types</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="deadline">Closest Deadline</option>
              <option value="match">Highest Skill Match</option>
              <option value="newest">Newest Application</option>
              <option value="oldest">Oldest Application</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pt-1 pb-0.5">
          {['All', 'Interested', 'Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Withdrawn'].map((status) => {
            const count =
              status === 'All'
                ? internships.length
                : internships.filter((i) => i.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    statusFilter === status ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List / Grid View */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No Internships Found</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            {searchTerm || statusFilter !== 'All'
              ? 'Try adjusting your filters or search terms.'
              : 'Add your first internship to begin tracking deadlines and extracting required skills.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
            >
              Add Internship
            </button>
            {internships.length === 0 && (
              <button
                onClick={handleSeedSamples}
                disabled={seeding}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                {seeding ? 'Loading...' : 'Load Sample Internships'}
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectInternship(item.id)}
              className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header: Company & Work Type */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base shadow-sm">
                      {item.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate max-w-[160px]">
                        {item.role}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">{item.company}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                    {item.work_type}
                  </span>
                </div>

                {/* Location and Stipend */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {item.location}
                  </span>
                  {item.salary && <span>• {item.salary}</span>}
                </div>

                {/* Deadline & Status Badges */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${getUrgencyBadge(item.deadlineUrgency, item.daysRemaining)}`}>
                      {item.daysRemaining < 0
                        ? 'Expired'
                        : item.daysRemaining === 0
                        ? 'Due Today'
                        : `${item.daysRemaining}d left`}
                    </span>
                  </div>

                  <select
                    value={item.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as InternshipStatus, e as any)}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${getStatusBadge(item.status)} focus:outline-none`}
                  >
                    <option value="Interested">Interested</option>
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview">Interview</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              {/* Bottom Card Footer: Match Score & Action */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                {item.match_percentage !== null ? (
                  <div className="flex items-center gap-1 text-slate-700">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-extrabold text-blue-700">{item.match_percentage}%</span>
                    <span className="text-[10px] text-slate-400">Match</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Analysis Pending</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete internship"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center font-bold text-blue-600 group-hover:translate-x-0.5 transition text-xs">
                    <span>View</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-6 pr-3">Company</th>
                  <th className="px-3 py-3.5">Role</th>
                  <th className="px-3 py-3.5">Deadline</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Skill Match</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectInternship(item.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    <td className="py-3.5 pl-6 pr-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                        {item.company.charAt(0).toUpperCase()}
                      </div>
                      <span>{item.company}</span>
                    </td>
                    <td className="px-3 py-3.5 font-medium text-slate-700">{item.role}</td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${getUrgencyBadge(item.deadlineUrgency, item.daysRemaining)}`}>
                        {item.deadline} ({item.daysRemaining < 0 ? 'Expired' : `${item.daysRemaining}d`})
                      </span>
                    </td>
                    <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as InternshipStatus, e as any)}
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold border ${getStatusBadge(item.status)}`}
                      >
                        <option value="Interested">Interested</option>
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview">Interview</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </td>
                    <td className="px-3 py-3.5">
                      {item.match_percentage !== null ? (
                        <span className="font-extrabold text-blue-700">{item.match_percentage}%</span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectInternship(item.id)}
                          className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
