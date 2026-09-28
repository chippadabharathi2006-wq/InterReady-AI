import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile, UserSkill, UserProject, UserCertification } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  skills: UserSkill[];
  projects: UserProject[];
  certifications: UserCertification[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [certifications, setCertifications] = useState<UserCertification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile);
      setSkills(data.skills || []);
      setProjects(data.projects || []);
      setCertifications(data.certifications || []);
    } catch (err) {
      console.warn('Auto auth check failed:', err);
      clearStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.token) {
      setStoredToken(res.token);
      await fetchCurrentUser();
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string) => {
    const res = await api.register({ name, email, password, confirmPassword });
    if (res.token) {
      setStoredToken(res.token);
      await fetchCurrentUser();
    }
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    if (res.token) {
      setStoredToken(res.token);
      await fetchCurrentUser();
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    clearStoredToken();
    setUser(null);
    setProfile(null);
    setSkills([]);
    setProjects([]);
    setCertifications([]);
  };

  const refreshProfile = async () => {
    try {
      const data = await api.getCurrentUser();
      setProfile(data.profile);
      setSkills(data.skills || []);
      setProjects(data.projects || []);
      setCertifications(data.certifications || []);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        skills,
        projects,
        certifications,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
