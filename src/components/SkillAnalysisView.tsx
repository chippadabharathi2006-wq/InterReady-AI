import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Building2,
  Briefcase,
  Layers,
  Compass,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { Internship } from '../types/index.ts';

interface SkillAnalysisViewProps {
  onNavigateToRoadmap?: (skillName: string) => void;
}

export const SkillAnalysisView: React.FC<SkillAnalysisViewProps> = ({ onNavigateToRoadmap }) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('custom');
  const [customRole, setCustomRole] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInternships = async () => {
      try {
        setLoading(true);
        const data = await api.getInternships();
        setInternships(data || []);

        // Default to first internship if available
        if (data && data.length > 0) {
          const first = data[0];
          setSelectedInternshipId(first.id);
          setJobDescription(first.job_description || '');
          if (first.analysis) {
            setAnalysisResult({
              extracted: {
                roleSummary: `${first.role} at ${first.company}`,
                technicalSkills: (first.extractedSkills || []).filter((s: any) => s.skill_type === 'technical').map((s: any) => s.skill_name),
                softSkills: (first.extractedSkills || []).filter((s: any) => s.skill_type === 'soft').map((s: any) => s.skill_name),
                toolsAndTech: (first.extractedSkills || []).filter((s: any) => s.skill_type === 'tool').map((s: any) => s.skill_name),
                educationRequirements: (first.extractedSkills || []).filter((s: any) => s.skill_type === 'education').map((s: any) => s.skill_name),
              },
              matchingSkills: first.analysis.matching_skills,
              missingSkills: first.analysis.missing_skills,
              additionalSkills: first.analysis.additional_skills || [],
              matchPercentage: first.analysis.match_percentage,
              gapSummary: first.analysis.summary,
              recommendedLearning: [],
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInternships();
  }, []);

  const handleSelectInternship = (id: string) => {
    setSelectedInternshipId(id);
    setError(null);
    if (id === 'custom') {
      setJobDescription('');
      setCustomRole('');
      setCustomCompany('');
      setAnalysisResult(null);
      return;
    }

    const found = internships.find((i) => i.id === id);
    if (found) {
      setJobDescription(found.job_description || '');
      if (found.analysis) {
        setAnalysisResult({
          extracted: {
            roleSummary: `${found.role} at ${found.company}`,
            technicalSkills: (found.extractedSkills || []).filter((s) => s.skill_type === 'technical').map((s) => s.skill_name),
            softSkills: (found.extractedSkills || []).filter((s) => s.skill_type === 'soft').map((s) => s.skill_name),
            toolsAndTech: (found.extractedSkills || []).filter((s) => s.skill_type === 'tool').map((s) => s.skill_name),
            educationRequirements: (found.extractedSkills || []).filter((s) => s.skill_type === 'education').map((s) => s.skill_name),
          },
          matchingSkills: found.analysis.matching_skills,
          missingSkills: found.analysis.missing_skills,
          additionalSkills: found.analysis.additional_skills || [],
          matchPercentage: found.analysis.match_percentage,
          gapSummary: found.analysis.summary,
          recommendedLearning: [],
        });
      } else {
        setAnalysisResult(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description to analyze.');
      return;
    }

    setError(null);
    setAnalyzing(true);

    try {
      if (selectedInternshipId !== 'custom') {
        const res = await api.analyzeJobDescription(selectedInternshipId, jobDescription.trim());
        setAnalysisResult(res.analysis);
      } else {
        const res = await api.analyzeJobStandalone({
          jobDescription: jobDescription.trim(),
          roleName: customRole.trim() || 'Software Engineer Intern',
          companyName: customCompany.trim() || 'Target Company',
        });
        setAnalysisResult(res);
      }
    } catch (err: any) {
      setError(err.message || 'AI Job Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateRoadmap = async (skillName: string) => {
    try {
      const role = selectedInternshipId !== 'custom'
        ? internships.find((i) => i.id === selectedInternshipId)?.role
        : customRole;
      await api.generateRoadmap(skillName, role || 'Intern');
      if (onNavigateToRoadmap) {
        onNavigateToRoadmap(skillName);
      } else {
        alert(`Learning roadmap for ${skillName} generated! View it under Learning Roadmaps.`);
      }
    } catch (err: any) {
      alert('Failed to generate roadmap: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">AI Job Description & Skill Gap Analyzer</h2>
        <p className="text-xs text-slate-500">
          Paste any internship job posting to automatically extract tech requirements, identify missing competencies, and calculate readiness.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-xs text-red-700 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Selector Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source Opportunity</label>
            <select
              value={selectedInternshipId}
              onChange={(e) => handleSelectInternship(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="custom">Paste Custom Job Description</option>
              {internships.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.company} — {i.role}
                </option>
              ))}
            </select>
          </div>

          {selectedInternshipId === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI, Meta, Uber"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AI / ML Intern"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">Internship Job Description</label>
            <span className="text-[11px] text-slate-400">{jobDescription.length} characters</span>
          </div>
          <textarea
            rows={6}
            placeholder="Paste the full job description, requirements, qualification bullet points, and responsibilities here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !jobDescription.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing with Gemini AI...' : 'Analyze Requirements & Detect Gaps'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Results View */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Readiness Meter Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Percentage</span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  Internship Readiness: {analysisResult.matchPercentage}%
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {analysisResult.extracted?.roleSummary || 'Role requirements analyzed against declared student skills.'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center rounded-2xl bg-emerald-50 px-4 py-2 border border-emerald-100">
                  <p className="text-xl font-black text-emerald-700">{analysisResult.matchingSkills?.length || 0}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Matching</p>
                </div>
                <div className="text-center rounded-2xl bg-rose-50 px-4 py-2 border border-rose-100">
                  <p className="text-xl font-black text-rose-700">{analysisResult.missingSkills?.length || 0}</p>
                  <p className="text-[10px] font-bold text-rose-600 uppercase">Missing</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    analysisResult.matchPercentage >= 75
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : analysisResult.matchPercentage >= 50
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${analysisResult.matchPercentage}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 italic">
                * Based on actual extracted skills and declared profile data. Does not guarantee job selection.
              </p>
            </div>
          </div>

          {/* Side by Side Skills Match View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matching */}
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <h4 className="text-sm font-bold text-slate-900">
                  Matching Skills ({analysisResult.matchingSkills?.length || 0})
                </h4>
              </div>
              <p className="text-xs text-slate-500 mb-4">Required skills you already possess:</p>

              <div className="flex flex-wrap gap-2">
                {(!analysisResult.matchingSkills || analysisResult.matchingSkills.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No matching skills detected.</p>
                ) : (
                  analysisResult.matchingSkills.map((s: string) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{s}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Missing */}
            <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-rose-700">
                <XCircle className="h-5 w-5" />
                <h4 className="text-sm font-bold text-slate-900">
                  Missing Skills ({analysisResult.missingSkills?.length || 0})
                </h4>
              </div>
              <p className="text-xs text-slate-500 mb-4">Important skills you should acquire for this role:</p>

              <div className="space-y-2">
                {(!analysisResult.missingSkills || analysisResult.missingSkills.length === 0) ? (
                  <p className="text-xs text-emerald-600 font-semibold">
                    ✨ Perfect score! No missing technical skills detected.
                  </p>
                ) : (
                  analysisResult.missingSkills.map((s: string) => (
                    <div
                      key={s}
                      className="flex items-center justify-between rounded-xl bg-rose-50/70 p-2.5 border border-rose-100"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-950">
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                        {s}
                      </span>
                      <button
                        onClick={() => handleCreateRoadmap(s)}
                        className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-600 border border-blue-200 shadow-2xs hover:bg-blue-50 transition"
                      >
                        <Compass className="h-3 w-3 text-blue-500" />
                        <span>Build Roadmap</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AI Gap Explanation */}
          {analysisResult.gapSummary && (
            <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6">
              <div className="flex items-center gap-2 mb-2 text-blue-900">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">AI Skill Gap Assessment</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                {analysisResult.gapSummary}
              </p>
            </div>
          )}

          {/* Extracted Inventory */}
          {analysisResult.extracted && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Full Extracted Requirement Categories</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Technical Skills</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.extracted.technicalSkills?.map((s: string) => (
                      <span key={s} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
                        {s}
                      </span>
                    )) || <span className="text-xs text-slate-400">None</span>}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tools & Tech</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.extracted.toolsAndTech?.map((s: string) => (
                      <span key={s} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
                        {s}
                      </span>
                    )) || <span className="text-xs text-slate-400">None</span>}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Soft Skills</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.extracted.softSkills?.map((s: string) => (
                      <span key={s} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
                        {s}
                      </span>
                    )) || <span className="text-xs text-slate-400">None</span>}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Education</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.extracted.educationRequirements?.map((s: string) => (
                      <span key={s} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
                        {s}
                      </span>
                    )) || <span className="text-xs text-slate-400">None</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
