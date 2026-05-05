import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';
import { apiFetch } from '../lib/api';

interface UserProfile {
  fullName?: string;
  mobileNumber?: string;
  gender?: string;
  city?: string;
  studyDestination?: string;
  currentStatus?: string;
  courseInterested?: string;
  educationDetails?: any;
  experienceDetails?: any;
}

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiFetch<User>(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data);
      } catch (err) {
        console.error('Auth check failed:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
