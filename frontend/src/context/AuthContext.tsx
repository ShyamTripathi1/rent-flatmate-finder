import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, tokenService, googleLogin as googleLoginApi } from '../services/api';

export interface User {
  id: string;
  email: string;
  role: 'TENANT' | 'OWNER' | 'ADMIN';
  name: string;
}

export interface TenantProfile {
  id: string;
  userId: string;
  preferredLocation: string;
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  lifestyleNotes: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: TenantProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (email: string, password?: string, role?: string, name?: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<TenantProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenService.getAccessToken();
      const savedUser = tokenService.getUser();
      if (token && savedUser) {
        setUser(savedUser);
        if (savedUser.role === 'TENANT') {
          try {
            const profileData = await api.get('/tenant/profile');
            setProfile(profileData);
          } catch (err) {
            console.error('Failed to load profile on init:', err);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    const data = await api.post('/auth/login', { email, password: password || '' });
    tokenService.setTokens(data.accessToken, data.refreshToken);
    tokenService.setUser(data.user);
    setUser(data.user);

    if (data.user.role === 'TENANT') {
      try {
        const profileData = await api.get('/tenant/profile');
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to load profile on login:', err);
      }
    } else {
      setProfile(null);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    const data = await googleLoginApi(idToken);
    tokenService.setTokens(data.accessToken, data.refreshToken);
    tokenService.setUser(data.user);
    setUser(data.user);

    if (data.user.role === 'TENANT') {
      try {
        const profileData = await api.get('/tenant/profile');
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to load profile after Google login:', err);
      }
    } else {
      setProfile(null);
    }
  };

  const register = async (email: string, password?: string, role?: string, name?: string) => {
    const data = await api.post('/auth/register', { email, password: password || '', role, name });
    tokenService.setTokens(data.accessToken, data.refreshToken);
    tokenService.setUser(data.user);
    setUser(data.user);

    if (data.user.role === 'TENANT') {
      try {
        const profileData = await api.get('/tenant/profile');
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to load profile on register:', err);
      }
    } else {
      setProfile(null);
    }
  };

  const logout = () => {
    tokenService.clear();
    setUser(null);
    setProfile(null);
  };

  const fetchProfile = async () => {
    if (user?.role !== 'TENANT') return;
    try {
      const data = await api.get('/tenant/profile');
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      throw err;
    }
  };

  const updateProfile = async (profileData: Partial<TenantProfile>) => {
    if (user?.role !== 'TENANT') return;
    try {
      const updated = await api.put('/tenant/profile', profileData);
      setProfile(updated);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        fetchProfile,
        updateProfile,
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
