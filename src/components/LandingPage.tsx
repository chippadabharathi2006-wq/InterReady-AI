import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  Clock,
  Cpu,
  Target,
  FileCheck2,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  XCircle,
  Compass,
  GraduationCap,
  Shield,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onTryDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onTryDemo }) => {
  const features = [
    {
      icon: Briefcase,
      title: 'Internship Tracking',
      description: 'Manage all company applications, job roles, links, stipends, and real-time statuses from a unified portal.',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Clock,
      title: 'Deadline Management',
      description: 'Dynamic countdowns and urgency alerts (Upcoming, Approaching, Urgent, Critical) so you never miss a cutoff.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: Cpu,
      title: 'AI Job Analysis',
      description: 'Real Gemini AI extracts technical skills, soft skills, tools, and education qualifications straight from raw JDs.',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      icon: Target,
      title: 'Skill Gap Detection',
      description: 'Compare your student profile skills against job requirements with transparent match percentages and actionable summaries.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: FileCheck2,
      title: 'Resume Analysis',
      description: 'Screen your resume against target internships without invented details. Get concrete advice on what projects to highlight.',
      color: 'from-sky-500 to-blue-600',
    },
    {
      icon: HelpCircle,
      title: 'Interview Preparation',
      description: 'Generate high-impact Technical, HR, Project-based, and Role-specific questions with evaluation rubrics and sample answers.',
      color: 'from-rose-500 to-pink-600',
    },
    {
      icon: BarChart3,
      title: 'Progress Dashboard',
      description: 'Interactive analytics tracking applications by status, monthly momentum, and the most common skill gaps in your field.',
      color: 'from-violet-500 to-purple-600',
    },
  ];

  const workflowSteps = [
    { num: '01', title: 'Add Internship', desc: 'Save role, company, link & application deadline.' },
    { num: '02', title: 'Paste Job Description', desc: 'Input the actual JD or requirements text.' },
    { num: '03', title: 'AI Analyzes Requirements', desc: 'Gemini extracts tech stacks, soft skills & tools.' },
    { num: '04', title: 'Compare Your Skills', desc: 'Matches against your declared student profile.' },
    { num: '05', title: 'Identify Skill Gaps', desc: 'Pinpoints missing proficiencies with match %.' },
    { num: '06', title: 'Learn & Prepare', desc: 'Follow AI 5-step roadmaps & generate interview Qs.' },
    { num: '07', title: 'Track Application', desc: 'Log timeline updates from Applied to Selected!' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">InternReady</span>
              <span className="ml-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
            >
              Get Started
            </button>
            <button
              onClick={onTryDemo}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Zap className="h-4 w-4 text-indigo-600" />
              <span>Instant Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/70 via-slate-50 to-slate-50" />
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-800 shadow-sm backdrop-blur mb-6">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <span>Built for B.Tech & College Students Seeking Technical Internships</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.15]">
            InternReady <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg sm:text-xl font-medium text-slate-600">
            “Track your applications. Understand your skill gaps. Prepare for your next internship.”
          </p>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            A real full-stack internship operating system powered by Gemini 3.8 Flash. No generic mockups—real skill extraction, resume comparison, and tailored interview prep.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 transition"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onTryDemo}
              className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          {/* Hero Preview Card */}
          <div className="mt-14 mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">Google</span>
                  <span className="text-xs text-slate-400">Bengaluru • Hybrid</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">AI / ML Research Intern</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-500">Skill Alignment</div>
                  <div className="text-lg font-black text-emerald-600">78% Match</div>
                </div>
                <div className="h-10 w-10 rounded-full border-4 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-700">
                  78%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Matching Skills (Candidate Has)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Python', 'SQL', 'Machine Learning', 'Data Structures', 'Git'].map((s) => (
                    <span key={s} className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-rose-50/60 p-4 border border-rose-100">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 mb-2">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <span>Missing Skills (Need to Learn)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['TensorFlow', 'Docker', 'Statistics'].map((s) => (
                    <span key={s} className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800">
                      ✗ {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Deadline: 15 Oct 2026 (Approaching – 17 days remaining)</span>
              </div>
              <span className="font-semibold text-blue-600">Status: Shortlisted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Comprehensive Suite</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Land Your Dream Internship
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Designed specifically for engineering students to overcome multi-portal application chaos and prepare with targeted precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${feature.color} text-white shadow-md`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Proven Process</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How InternReady AI Works
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              From finding an opportunity to clearing your final interview round.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((step) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="text-2xl font-black text-blue-600/30">{step.num}</span>
                <h4 className="mt-1 text-sm font-bold text-slate-900">{step.title}</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Box */}
          <div className="mt-16 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-600/20">
            <h3 className="text-2xl sm:text-3xl font-bold">Ready to take control of your internship search?</h3>
            <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-blue-100">
              Join thousands of B.Tech students who analyze job requirements, close skill gaps, and prepare for interviews with confidence.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => onOpenAuth('register')}
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-md hover:bg-blue-50 transition"
              >
                Start Tracking Free
              </button>
              <button
                onClick={onTryDemo}
                className="rounded-xl border border-blue-300 bg-blue-800/40 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800/60 transition"
              >
                Launch Demo Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>© 2026 InternReady AI. Built for college students & freshers preparing for technical roles.</p>
      </footer>
    </div>
  );
};
