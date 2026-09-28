import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  GraduationCap,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  Award,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/client.ts';

export const ProfileView: React.FC = () => {
  const { user, profile, skills, projects, certifications, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [degree, setDegree] = useState(profile?.degree || '');
  const [branch, setBranch] = useState(profile?.branch || '');
  const [gradYear, setGradYear] = useState(profile?.graduation_year || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [about, setAbout] = useState(profile?.about || '');
  const [resumeText, setResumeText] = useState(profile?.resume_text || '');

  // Add skill state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [catalogue, setCatalogue] = useState<Array<{ name: string; category: string }>>([]);

  // Add project state
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectTechStack, setProjectTechStack] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectLink, setProjectLink] = useState('');

  // Add cert state
  const [showAddCert, setShowAddCert] = useState(false);
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (profile) {
      setCollege(profile.college || '');
      setDegree(profile.degree || '');
      setBranch(profile.branch || '');
      setGradYear(profile.graduation_year || '');
      setLocation(profile.location || '');
      setAbout(profile.about || '');
      setResumeText(profile.resume_text || '');
    }
  }, [user, profile]);

  useEffect(() => {
    api.getSkillsCatalogue().then(setCatalogue).catch(console.error);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await api.updateProfile({
        name,
        college,
        degree,
        branch,
        graduation_year: gradYear,
        location,
        about,
        resume_text: resumeText,
      });
      await refreshProfile();
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await api.addSkill(newSkillName.trim(), newSkillProficiency);
      setNewSkillName('');
      await refreshProfile();
    } catch (err: any) {
      alert('Failed to add skill: ' + err.message);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await api.deleteSkill(id);
      await refreshProfile();
    } catch (err: any) {
      alert('Failed to remove skill: ' + err.message);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;
    try {
      await api.addProject({
        title: projectTitle.trim(),
        description: projectDesc.trim(),
        tech_stack: projectTechStack.trim(),
        link: projectLink.trim(),
      });
      setProjectTitle('');
      setProjectDesc('');
      setProjectTechStack('');
      setProjectLink('');
      setShowAddProject(false);
      await refreshProfile();
    } catch (err: any) {
      alert('Failed to add project: ' + err.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      await refreshProfile();
    } catch (err: any) {
      alert('Failed to delete project: ' + err.message);
    }
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim()) return;
    try {
      await api.addCertification({
        name: certName.trim(),
        issuer: certIssuer.trim(),
        issue_date: certDate,
      });
      setCertName('');
      setCertIssuer('');
      setCertDate('');
      setShowAddCert(false);
      await refreshProfile();
    } catch (err: any) {
      alert('Failed to add certification: ' + err.message);
    }
  };

  const handleDeleteCert = async (id: string) => {
    try {
      await api.deleteCertification(id);
      await refreshProfile();
    } catch (err: any) {
      alert('Failed to remove certification: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Student Profile & Competencies</h2>
        <p className="text-xs text-slate-500">
          Your declared skills and academic background are directly matched by AI against every internship opportunity.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-100 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs text-red-700 border border-red-100">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Personal & Academic Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Account)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">College / University</label>
            <input
              type="text"
              placeholder="e.g. National Institute of Technology"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Degree</label>
            <input
              type="text"
              placeholder="e.g. B.Tech / B.E."
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Specialization</label>
            <input
              type="text"
              placeholder="e.g. Computer Science & AI"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
            <input
              type="text"
              placeholder="e.g. 2026"
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. Bengaluru, India"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">About Me / Bio</label>
          <textarea
            rows={3}
            placeholder="Brief technical summary, interests, and target roles..."
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Saved Resume Text (for AI Screening)</label>
          <textarea
            rows={4}
            placeholder="Saved resume text used when comparing against target internships..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Skills Management Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Declared Skills & Proficiencies</h3>
            <p className="text-xs text-slate-500">
              {skills.length} skills listed. AI compares these directly against job descriptions.
            </p>
          </div>
        </div>

        {/* Add Skill Form */}
        <form onSubmit={handleAddSkill} className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              required
              placeholder="e.g. Python, SQL, React, Machine Learning, Docker..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              list="skills-list"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <datalist id="skills-list">
              {catalogue.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
          </div>

          <select
            value={newSkillProficiency}
            onChange={(e) => setNewSkillProficiency(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Skill</span>
          </button>
        </form>

        {/* Current Skills Tags */}
        <div className="flex flex-wrap gap-2 pt-2">
          {skills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No skills added yet.</p>
          ) : (
            skills.map((s) => (
              <div
                key={s.id}
                className="group flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1.5 text-xs transition hover:border-slate-300"
              >
                <span className="font-semibold text-slate-800">{s.skill_name}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold ${
                    s.proficiency === 'Advanced'
                      ? 'bg-purple-100 text-purple-700'
                      : s.proficiency === 'Intermediate'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {s.proficiency}
                </span>
                <button
                  onClick={() => handleDeleteSkill(s.id)}
                  className="rounded-md p-1 text-slate-400 hover:text-red-600 hover:bg-white transition"
                  title="Remove skill"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Projects & Portfolio</h3>
            <p className="text-xs text-slate-500">Highlighted during AI interview question synthesis.</p>
          </div>
          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Project</span>
          </button>
        </div>

        {showAddProject && (
          <form onSubmit={handleAddProject} className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Project Title (e.g. MediScan Disease Classifier)"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Tech Stack (e.g. Python, PyTorch, FastAPI)"
                value={projectTechStack}
                onChange={(e) => setProjectTechStack(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Description of what you built and technical challenges..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Save Project
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No projects added yet.</p>
          ) : (
            projects.map((proj) => (
              <div key={proj.id} className="flex items-start justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                  <p className="text-[11px] font-semibold text-blue-600 mt-0.5">{proj.tech_stack}</p>
                  <p className="text-xs text-slate-600 mt-1">{proj.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="rounded p-1 text-slate-400 hover:text-red-600 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Certifications & Credentials</h3>
            <p className="text-xs text-slate-500">Verified credentials bolstering your applications.</p>
          </div>
          <button
            onClick={() => setShowAddCert(!showAddCert)}
            className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Certification</span>
          </button>
        </div>

        {showAddCert && (
          <form onSubmit={handleAddCert} className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Certification Name (e.g. AWS Cloud Practitioner)"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Issuer (e.g. Amazon Web Services / Coursera)"
                value={certIssuer}
                onChange={(e) => setCertIssuer(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Date (e.g. Aug 2025)"
                value={certDate}
                onChange={(e) => setCertDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCert(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Save Certification
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {certifications.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No certifications added yet.</p>
          ) : (
            certifications.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {c.issuer} {c.issue_date ? `• ${c.issue_date}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCert(c.id)}
                  className="rounded p-1 text-slate-400 hover:text-red-600 transition"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
