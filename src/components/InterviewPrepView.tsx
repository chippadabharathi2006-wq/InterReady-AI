import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  Building2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { Internship, InterviewQuestion } from '../types/index.ts';

export const InterviewPrepView: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customFocus, setCustomFocus] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInternships = async () => {
      try {
        setLoading(true);
        const data = await api.getInternships();
        setInternships(data || []);
        if (data && data.length > 0) {
          // Prioritize internship with status 'Interview'
          const interviewItem = data.find((i: Internship) => i.status === 'Interview') || data[0];
          setSelectedInternshipId(interviewItem.id);
          loadQuestionsForInternship(interviewItem.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInternships();
  }, []);

  const loadQuestionsForInternship = async (id: string) => {
    try {
      const details = await api.getInternship(id);
      setQuestions(details.interviewQuestions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectInternship = async (id: string) => {
    setSelectedInternshipId(id);
    await loadQuestionsForInternship(id);
  };

  const handleGenerate = async (refresh = false) => {
    if (!selectedInternshipId) return;
    setError(null);
    setGenerating(true);

    try {
      const res = await api.generateInterviewQuestions(selectedInternshipId, {
        customFocus: customFocus.trim(),
        refresh,
      });
      setQuestions(res.questions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate interview questions');
    } finally {
      setGenerating(false);
    }
  };

  const filtered = questions.filter((q) => {
    if (selectedCategory === 'All') return true;
    return q.category === selectedCategory;
  });

  const currentInternship = internships.find((i) => i.id === selectedInternshipId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">AI Interview Preparation Coach</h2>
        <p className="text-xs text-slate-500">
          Realistic Technical, HR, Project-based, and Role-specific interview questions aligned with your actual resume and target role.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-xs text-red-700 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Selector & Generator Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Internship</label>
            <select
              value={selectedInternshipId}
              onChange={(e) => handleSelectInternship(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {internships.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.company} — {i.role} ({i.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Topic Focus (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. System Design, PyTorch CNNs, SQL Joins, Culture Fit"
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {currentInternship && (
              <span>
                Preparing for <strong className="text-slate-800">{currentInternship.company}</strong> ({currentInternship.role})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerate(false)}
              disabled={generating || !selectedInternshipId}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{generating ? 'Generating with Gemini...' : 'Generate Questions'}</span>
            </button>
            {questions.length > 0 && (
              <button
                onClick={() => handleGenerate(true)}
                disabled={generating || !selectedInternshipId}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'Technical', 'HR', 'Project', 'Role-Specific'].map((cat) => {
          const count =
            cat === 'All'
              ? questions.length
              : questions.filter((q) => q.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedCategory === cat ? 'bg-white/20' : 'bg-slate-100'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Questions List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <HelpCircle className="mx-auto mb-3 h-8 w-8 text-blue-500 animate-bounce" />
          <h3 className="text-base font-bold text-slate-900">No Questions Prepared Yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Click "Generate Questions" to synthesize high-impact questions crafted specifically for this internship's job description.
          </p>
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? 'Generating with Gemini...' : 'Generate Interview Questions'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {item.category}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.difficulty === 'Easy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.difficulty === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.question}</h4>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                    {item.tips && (
                      <div className="rounded-2xl bg-amber-50/70 p-3.5 text-xs border border-amber-100">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                          <span>Evaluation Insight (What Interviewers Want):</span>
                        </span>
                        <p className="text-amber-800 leading-relaxed">{item.tips}</p>
                      </div>
                    )}

                    {item.sample_answer && (
                      <div className="rounded-2xl bg-slate-50 p-4 text-xs border border-slate-100">
                        <span className="font-bold text-slate-900 block mb-1.5">
                          🎯 Structured Answer Model (STAR Technique):
                        </span>
                        <p className="text-slate-700 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                          {item.sample_answer}
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
  );
};
