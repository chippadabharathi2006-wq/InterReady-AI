import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  BookOpen,
  ArrowRight,
  PlusCircle,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { LearningRoadmap, LearningStep } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const LearningRoadmapsView: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineering Intern');
  const [error, setError] = useState<string | null>(null);
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(null);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const data = await api.getRoadmaps();
      setRoadmaps(data || []);
      if (data && data.length > 0 && !expandedRoadmapId) {
        setExpandedRoadmapId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setError(null);
    setGenerating(true);

    try {
      const res = await api.generateRoadmap(newSkillName.trim(), targetRole.trim());
      setNewSkillName('');
      await fetchRoadmaps();
      setExpandedRoadmapId(res.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStepStatus = async (
    roadmapId: string,
    stepNumber: number,
    newStatus: 'Not Started' | 'In Progress' | 'Completed'
  ) => {
    try {
      await api.updateRoadmapStep(roadmapId, stepNumber, newStatus);
      await fetchRoadmaps();
      await refreshProfile();
    } catch (err: any) {
      alert('Failed to update step: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Personalized AI Learning Roadmaps</h2>
        <p className="text-xs text-slate-500">
          Targeted 5-step learning paths for bridging missing technical skills. Mark off exercises as you build portfolio projects.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-xs text-red-700 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Add Custom Skill Roadmap */}
      <form onSubmit={handleCreateRoadmap} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Generate Roadmap for a Missing Skill</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="Skill to learn (e.g. TensorFlow, Docker, PyTorch, GraphQL)"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={generating || !newSkillName.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? 'Synthesizing...' : 'Generate 5-Step Path'}</span>
          </button>
        </div>
      </form>

      {/* Roadmaps List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Compass className="mx-auto mb-3 h-8 w-8 text-blue-500 animate-pulse" />
          <h3 className="text-base font-bold text-slate-900">No Learning Roadmaps Active</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Generate your first roadmap above or use the "Create Learning Roadmap" button on any missing skill in your tracked internships.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {roadmaps.map((roadmap) => {
            const isExpanded = expandedRoadmapId === roadmap.id;
            return (
              <div
                key={roadmap.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200"
              >
                {/* Roadmap Header Banner */}
                <div
                  onClick={() => setExpandedRoadmapId(isExpanded ? null : roadmap.id)}
                  className="flex cursor-pointer items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-bold text-sm">
                      {roadmap.skill_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{roadmap.skill_name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            roadmap.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {roadmap.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {roadmap.company ? `Target: ${roadmap.company} • ` : ''}
                        Progress: {roadmap.completedCount} of {roadmap.totalSteps} steps completed ({roadmap.progressPercent}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block w-32">
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${roadmap.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <button className="text-slate-400">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Steps Content */}
                {isExpanded && (
                  <div className="p-6 space-y-4 animate-in fade-in duration-150">
                    <div className="space-y-3">
                      {roadmap.steps.map((step: LearningStep) => (
                        <div
                          key={step.stepNumber}
                          className={`rounded-2xl border p-4 transition ${
                            step.status === 'Completed'
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : step.status === 'In Progress'
                              ? 'border-blue-200 bg-blue-50/30'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                                {step.stepNumber}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                  {step.description}
                                </p>
                              </div>
                            </div>

                            {/* Status Switcher Dropdown */}
                            <select
                              value={step.status}
                              onChange={(e) =>
                                handleUpdateStepStatus(roadmap.id, step.stepNumber, e.target.value as any)
                              }
                              className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border cursor-pointer focus:outline-none ${
                                step.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : step.status === 'In Progress'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed ✓</option>
                            </select>
                          </div>

                          {/* Practical Task & Hours */}
                          <div className="mt-3 pt-3 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <span className="font-semibold text-slate-800">Practical Task:</span>
                              <span className="font-mono text-slate-700">{step.practicalTask}</span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {step.estimatedHours} hrs
                              </span>
                              {step.freeResources && step.freeResources.length > 0 && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <BookOpen className="h-3 w-3" />
                                  {step.freeResources[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {roadmap.progressPercent === 100 && (
                      <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 p-3.5 text-xs text-emerald-900 font-bold border border-emerald-200">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span>
                          Skill Mastered! {roadmap.skill_name} has been verified and added to your student profile.
                        </span>
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
  );
};
