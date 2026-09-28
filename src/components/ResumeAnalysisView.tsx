import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  FileCheck2,
  ListFilter,
  Lightbulb,
  Check,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { Internship, ResumeAnalysisData } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const ResumeAnalysisView: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  const [resumeText, setResumeText] = useState(profile?.resume_text || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInternships = async () => {
      try {
        const data = await api.getInternships();
        setInternships(data || []);
        if (data && data.length > 0) {
          setSelectedInternshipId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadInternships();
  }, []);

  useEffect(() => {
    if (profile?.resume_text && !resumeText) {
      setResumeText(profile.resume_text);
    }
  }, [profile?.resume_text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // If it's a text/markdown file, read preview text
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setResumeText(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() && !selectedFile) {
      setError('Please upload a resume file or paste your resume content below.');
      return;
    }

    setError(null);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('resumeFile', selectedFile);
      }
      formData.append('resumeText', resumeText.trim());
      if (selectedInternshipId) {
        formData.append('internshipId', selectedInternshipId);
      }

      const res = await api.analyzeResume(formData);
      setResult(res.result);
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'AI Resume screening failed. Please check inputs.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">AI Resume Screening & Comparison</h2>
        <p className="text-xs text-slate-500">
          Upload or paste your resume to extract validated competencies and screen your credentials against target internship criteria.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-xs text-red-700 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Job & File Upload Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Internship for Screening
          </label>
          <select
            value={selectedInternshipId}
            onChange={(e) => setSelectedInternshipId(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {internships.map((i) => (
              <option key={i.id} value={i.id}>
                {i.company} — {i.role}
              </option>
            ))}
          </select>
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Upload Resume File</label>
          <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition cursor-pointer">
            <input
              type="file"
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <UploadCloud className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              {selectedFile ? selectedFile.name : 'Click or drag resume file (PDF, TXT, DOCX)'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size 5MB</p>
          </div>
        </div>

        {/* Or Paste Raw Resume Text */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Or Edit / Paste Resume Text Directly
            </label>
            <span className="text-[11px] text-slate-400">{resumeText.length} characters</span>
          </div>
          <textarea
            rows={7}
            placeholder="Paste plain text of your resume (Education, Projects, Skills, Work Experience)..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing Resume with Gemini...' : 'Analyze Resume Against Role'}</span>
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (() => {
        const matchingSkillsList = result.matchingSkills || result.matching_skills || [];
        const missingSkillsList = result.missingSkills || result.missing_skills || [];
        return (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Match Score Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Screening Score</span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  Resume Match Score: {result.score}%
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {result.parsedResume?.candidateName ? `Candidate: ${result.parsedResume.candidateName} • ` : ''}
                  Grounded strictly in stated resume data without hallucinating unlisted achievements.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center rounded-2xl bg-emerald-50 px-4 py-2 border border-emerald-100">
                  <p className="text-xl font-black text-emerald-700">{matchingSkillsList.length}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Matching</p>
                </div>
                <div className="text-center rounded-2xl bg-rose-50 px-4 py-2 border border-rose-100">
                  <p className="text-xl font-black text-rose-700">{missingSkillsList.length}</p>
                  <p className="text-[10px] font-bold text-rose-600 uppercase">Missing</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    result.score >= 75
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : result.score >= 50
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Resume vs Job Description Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <h4 className="text-sm font-bold text-slate-900">Found on Resume & Matching JD</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {(!matchingSkillsList || matchingSkillsList.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No matching keywords detected.</p>
                ) : (
                  matchingSkillsList.map((s: string) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{s}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-rose-700">
                <XCircle className="h-5 w-5" />
                <h4 className="text-sm font-bold text-slate-900">Missing from Resume vs JD Requirements</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {(!missingSkillsList || missingSkillsList.length === 0) ? (
                  <p className="text-xs text-emerald-600 font-semibold">
                    Awesome! All core requirements detected in your resume.
                  </p>
                ) : (
                  missingSkillsList.map((s: string) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 border border-rose-200"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      <span>{s}</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-bold">Resume Strengths for this Role</h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {result.strengths?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-bold">Recommended Resume Improvements</h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {result.recommendations?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};
