import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { InternshipsView } from './components/InternshipsView.tsx';
import { InternshipDetailsView } from './components/InternshipDetailsView.tsx';
import { AddInternshipModal } from './components/AddInternshipModal.tsx';
import { SkillAnalysisView } from './components/SkillAnalysisView.tsx';
import { ResumeAnalysisView } from './components/ResumeAnalysisView.tsx';
import { InterviewPrepView } from './components/InterviewPrepView.tsx';
import { LearningRoadmapsView } from './components/LearningRoadmapsView.tsx';
import { ProfileView } from './components/ProfileView.tsx';

function MainApp() {
  const { user, isLoading, demoLogin } = useAuth();

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedInternshipId, setSelectedInternshipId] = useState<string | null>(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-md" />
          <p className="text-xs font-bold text-slate-700">Loading InternReady AI...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Landing Page
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setIsAuthModalOpen(true);
          }}
          onTryDemo={async () => {
            await demoLogin();
          }}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // Handle drill down into internship details
  const handleSelectInternship = (id: string) => {
    setSelectedInternshipId(id);
    setActiveView('details');
  };

  const handleBackToInternships = () => {
    setSelectedInternshipId(null);
    setActiveView('internships');
  };

  const handleAddSuccess = (newId: string, shouldViewDetails: boolean) => {
    if (shouldViewDetails) {
      setSelectedInternshipId(newId);
      setActiveView('details');
    } else {
      setActiveView('internships');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          if (view !== 'details') {
            setSelectedInternshipId(null);
          }
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeView={activeView}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeView === 'dashboard' && (
              <DashboardView
                onSelectInternship={handleSelectInternship}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onNavigateToView={(view) => setActiveView(view)}
              />
            )}

            {activeView === 'internships' && (
              <InternshipsView
                onSelectInternship={handleSelectInternship}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            )}

            {activeView === 'details' && selectedInternshipId && (
              <InternshipDetailsView
                internshipId={selectedInternshipId}
                onBack={handleBackToInternships}
                onNavigateToRoadmap={() => setActiveView('learning')}
              />
            )}

            {activeView === 'skill-analysis' && (
              <SkillAnalysisView
                onNavigateToRoadmap={() => setActiveView('learning')}
              />
            )}

            {activeView === 'resume-analysis' && <ResumeAnalysisView />}

            {activeView === 'interview-prep' && <InterviewPrepView />}

            {activeView === 'learning' && <LearningRoadmapsView />}

            {activeView === 'profile' && <ProfileView />}
          </div>
        </main>
      </div>

      {/* Add Internship Modal */}
      <AddInternshipModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
