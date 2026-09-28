import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Layers,
  HelpCircle,
  Compass,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen,
  DollarSign,
  Info,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { Internship, InternshipStatus } from '../types/index.ts';

interface InternshipDetailsViewProps {
  internshipId: string;
  onBack: () => void;
  onNavigateToRoadmap?: (skillName: string) => void;
}

export const InternshipDetailsView: React.FC<InternshipDetailsViewProps> = ({
  internshipId,
  onBack,
  onNavigateToRoadmap,
}) => {
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'timeline' | 'interview' | 'resume' | 'jd'>('skills');

  // New timeline event form state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventNotes, setEventNotes] = useState('');

  // Expand state for interview questions
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState<string>('All');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getInternship(internshipId);
      setInternship(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load internship details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [internshipId]);

  const handleStatusChange = async (newStatus: InternshipStatus) => {
    if (!internship) return;
    try {
      await api.updateInternship(internship.id, { status: newStatus });
      setInternship({ ...internship, status: newStatus });
      await fetchDetails();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleRunAnalysis = async () => {
    if (!internship) return;
    try {
      setAnalyzing(true);
      setError(null);
      await api.analyzeJobDescription(internship.id, internship.job_description);
      await fetchDetails();
    } catch (err: any) {
      setError('AI Analysis failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateQuestions = async (refresh = false) => {
    if (!internship) return;
    try {
      setGeneratingQuestions(true);
      setError(null);
      await api.generateInterviewQuestions(internship.id, { refresh });
      await fetchDetails();
    } catch (err: any) {
      setError('Question generation failed: ' + err.message);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    try {
      await api.addTimelineEvent(internshipId, {
        title: eventTitle.trim(),
        date: eventDate,
        notes: eventNotes.trim(),
      });
      setEventTitle('');
      setEventNotes('');
      setShowAddEvent(false);
      await fetchDetails();
    } catch (err: any) {
      alert('Failed to add event: ' + err.message);
    }
  };

  const handleDeleteTimelineEvent = async (eventId: string) => {
    try {
      await api.deleteTimelineEvent(internshipId, eventId);
      await fetchDetails();
    } catch (err: any) {
      alert('Failed to remove event: ' + err.message);
    }
  };

  const handleCreateRoadmapForSkill = async (skillName: string) => {
    if (!internship) return;
    try {
      await api.generateRoadmap(skillName, internship.role, internship.id);
      if (onNavigateToRoadmap) {
        onNavigateToRoadmap(skillName);
      } else {
        alert(`Learning roadmap generated for "${skillName}"! View it in the Learning Roadmaps tab.`);
      }
    } catch (err: any) {
      alert('Failed to generate roadmap: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading internship details...</p>
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-600">Internship not found.</p>
        <button onClick={onBack} className="mt-4 text-xs font-semibold text-blue-600">
          Return to list
        </button>
      </div>
    );
  }

  const getUrgencyBadge = () => {
    switch (internship.deadlineUrgency) {
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

  const filteredQuestions = (internship.interviewQuestions || []).filter((q) => {
    if (questionCategoryFilter === 'All') return true;
    return q.category === questionCategoryFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Internships</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-xs text-red-700 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Internship Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl shadow-md">
              {internship.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{internship.role}</h1>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                  {internship.work_type}
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-600 mt-0.5">{internship.company}</p>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {internship.location}
                </span>
                {internship.salary && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    {internship.salary}
                  </span>
                )}
                {internship.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {internship.duration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Status changer & actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</span>
              <select
                value={internship.status}
                onChange={(e) => handleStatusChange(e.target.value as InternshipStatus)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

            {internship.application_link && (
              <a
                href={internship.application_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 sm:mt-0 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <span>Portal Link</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            )}
          </div>
        </div>

        {/* Deadline & Skill Match Pill Banner */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Application Deadline:</span>
            <span className="text-xs font-bold text-slate-800">{internship.deadline}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getUrgencyBadge()}`}>
              {internship.daysRemaining < 0
                ? 'Expired'
                : internship.daysRemaining === 0
                ? 'Deadline Today'
                : `${internship.daysRemaining} days remaining`}
            </span>
          </div>

          {internship.analysis ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Skill Alignment:</span>
              <span className="text-sm font-black text-blue-600">
                {internship.analysis.match_percentage}% Match
              </span>
            </div>
          ) : (
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{analyzing ? 'Analyzing with AI...' : 'Run First AI Skill Analysis'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'skills'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>AI Skill Gap Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Timeline ({internship.timeline?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('interview')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'interview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Interview Prep ({internship.interviewQuestions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('jd')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'jd'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Job Description</span>
        </button>
      </div>

      {/* TAB 1: AI Skill Gap Analysis */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Extracted Skills & Gap Comparison</h2>
              <p className="text-xs text-slate-500">
                Grounded comparison between your student profile and the requirements of this role.
              </p>
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Analyzing with Gemini...' : 'Re-run AI Analysis'}</span>
            </button>
          </div>

          {internship.analysis ? (
            <div className="space-y-6">
              {/* Match Gauge Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Match Metric</span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Internship Skill Match: {internship.analysis.match_percentage}%
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Calculated from your declared profile skills vs the {internship.analysis.matching_skills.length + internship.analysis.missing_skills.length} core technical requirements extracted from this JD.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center rounded-2xl bg-emerald-50 px-4 py-2 border border-emerald-100">
                      <p className="text-lg font-bold text-emerald-700">{internship.analysis.matching_skills.length}</p>
                      <p className="text-[10px] font-medium text-emerald-600 uppercase">Matching</p>
                    </div>
                    <div className="text-center rounded-2xl bg-rose-50 px-4 py-2 border border-rose-100">
                      <p className="text-lg font-bold text-rose-700">{internship.analysis.missing_skills.length}</p>
                      <p className="text-[10px] font-medium text-rose-600 uppercase">Missing</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-500 ${
                        internship.analysis.match_percentage >= 75
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : internship.analysis.match_percentage >= 50
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          : 'bg-gradient-to-r from-amber-500 to-rose-500'
                      }`}
                      style={{ width: `${internship.analysis.match_percentage}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400 italic">
                    * Note: This score indicates technical alignment and does not guarantee an interview or selection.
                  </p>
                </div>
              </div>

              {/* Skills Split View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matching Skills */}
                <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Matching Skills ({internship.analysis.matching_skills.length})
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Requirements in the job description that you already have in your profile:
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {internship.analysis.matching_skills.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No matching skills detected yet.</p>
                    ) : (
                      internship.analysis.matching_skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-100"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{skill}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Missing Skills ({internship.analysis.missing_skills.length})
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Important qualifications required by this company that you should learn:
                  </p>

                  <div className="space-y-2">
                    {internship.analysis.missing_skills.length === 0 ? (
                      <p className="text-xs text-emerald-600 font-medium">
                        🎉 Incredible! You match all extracted technical skills for this role.
                      </p>
                    ) : (
                      internship.analysis.missing_skills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between rounded-xl bg-rose-50/70 p-2.5 border border-rose-100"
                        >
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-900">
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            {skill}
                          </span>
                          <button
                            onClick={() => handleCreateRoadmapForSkill(skill)}
                            className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-600 border border-blue-200 shadow-sm hover:bg-blue-50 transition"
                          >
                            <Compass className="h-3 w-3 text-blue-500" />
                            <span>Create Learning Roadmap</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* AI Gap Explanation & Recruiter Summary */}
              {internship.analysis.summary && (
                <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6">
                  <div className="flex items-center gap-2 mb-2 text-blue-900">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">AI Skill Gap Assessment</h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                    {internship.analysis.summary}
                  </p>
                </div>
              )}

              {/* Extracted Categories Breakdown */}
              {internship.extractedSkills && internship.extractedSkills.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Complete Extracted Skill Inventory</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {['technical', 'soft', 'tool', 'education'].map((type) => {
                      const list = (internship.extractedSkills || []).filter((s) => s.skill_type === type);
                      return (
                        <div key={type} className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            {type === 'technical' ? '💻 Technical' : type === 'soft' ? '🤝 Soft Skills' : type === 'tool' ? '🛠️ Tools & Tech' : '🎓 Education'}
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {list.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic">None specified</span>
                            ) : (
                              list.map((item) => (
                                <span key={item.id} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
                                  {item.skill_name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-blue-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900">No Skill Analysis Performed Yet</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Click below to have Gemini extract requirements from this job description and compare them with your student profile.
              </p>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>{analyzing ? 'Analyzing with Gemini...' : 'Analyze Job Description Now'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Application Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Application Timeline</h2>
              <p className="text-xs text-slate-500">
                Keep a chronological journal of interview calls, assignments, and status updates.
              </p>
            </div>
            <button
              onClick={() => setShowAddEvent(!showAddEvent)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Event</span>
            </button>
          </div>

          {showAddEvent && (
            <form onSubmit={handleAddTimelineEvent} className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-900">Add Timeline Milestone</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Event Title (e.g. Technical Round 1 Cleared)"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                placeholder="Notes (optional, e.g. Asked DSA binary tree problem)"
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEvent(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Save Event
                </button>
              </div>
            </form>
          )}

          {/* Timeline visualization */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {(!internship.timeline || internship.timeline.length === 0) ? (
              <p className="text-center text-xs text-slate-400 py-8">No timeline milestones yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                {internship.timeline.map((event, index) => (
                  <div key={event.id} className="relative group">
                    {/* Circle Node */}
                    <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-sm" />

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {event.date}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{event.title}</h4>
                        {event.notes && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {event.notes}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTimelineEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition p-1"
                        title="Remove milestone"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Interview Prep */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tailored AI Interview Questions</h2>
              <p className="text-xs text-slate-500">
                Targeted questions generated specifically for {internship.company}'s {internship.role} requirements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerateQuestions(true)}
                disabled={generatingQuestions}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{generatingQuestions ? 'Generating...' : 'Generate New Questions'}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', 'Technical', 'HR', 'Project', 'Role-Specific'].map((cat) => (
              <button
                key={cat}
                onClick={() => setQuestionCategoryFilter(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  questionCategoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <HelpCircle className="mx-auto mb-3 h-8 w-8 text-blue-500 animate-bounce" />
              <h3 className="text-base font-bold text-slate-900">No Questions Generated Yet</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Generate real AI interview questions covering Technical algorithms, HR behavioral questions, your projects, and role-specific scenarios.
              </p>
              <button
                onClick={() => handleGenerateQuestions(false)}
                disabled={generatingQuestions}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>{generatingQuestions ? 'Generating with Gemini...' : 'Generate Interview Questions'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q, idx) => {
                const isExpanded = expandedQuestion === q.id;
                return (
                  <div
                    key={q.id || idx}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            {q.category}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.difficulty === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.question}</h4>
                      </div>

                      <button
                        onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-100">
                        {q.tips && (
                          <div className="rounded-xl bg-amber-50/70 p-3 text-xs border border-amber-100">
                            <span className="font-bold text-amber-900 block mb-0.5">💡 Interviewer Evaluation Tip:</span>
                            <span className="text-amber-800">{q.tips}</span>
                          </div>
                        )}
                        {q.sample_answer && (
                          <div className="rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-100">
                            <span className="font-bold text-slate-900 block mb-1">🎯 Model Answer Strategy (STAR Method):</span>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                              {q.sample_answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Job Description */}
      {activeTab === 'jd' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Job Description Stored</h3>
            <span className="text-xs text-slate-400">{internship.job_description.length} characters</span>
          </div>

          <pre className="rounded-2xl bg-slate-50 p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-100 overflow-x-auto">
            {internship.job_description || 'No job description text provided.'}
          </pre>
        </div>
      )}
    </div>
  );
};
