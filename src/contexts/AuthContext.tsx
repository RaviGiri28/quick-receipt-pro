import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, defaultBusinessInfo } from '@/types/receipt';

interface SignupData {
  name: string;
  email: string;
  password: string;
  businessName?: string;
  phone?: string;
  businessAddress?: string;
  businessPhone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => boolean;
  signup: (data: SignupData) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('qr_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('qr_users') || '{}');
    const userData = users[email];
    if (userData && userData.password === password) {
      const { password: _, ...profile } = userData;
      setUser(profile);
      localStorage.setItem('qr_user', JSON.stringify(profile));
      return true;
    }
    return false;
  };

  const signup = (data: SignupData) => {
    const users = JSON.parse(localStorage.getItem('qr_users') || '{}');
    if (users[data.email]) return false;

    const profile: UserProfile = {
      email: data.email,
      name: data.name,
      phone: data.phone || '',
      business: {
        ...defaultBusinessInfo,
        name: data.businessName || 'My Business',
        address: data.businessAddress || '',
        phone: data.businessPhone || '',
      },
    };

    users[data.email] = { ...profile, password: data.password };
    localStorage.setItem('qr_users', JSON.stringify(users));
    setUser(profile);
    localStorage.setItem('qr_user', JSON.stringify(profile));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('qr_user');
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('qr_user', JSON.stringify(updated));
    const users = JSON.parse(localStorage.getItem('qr_users') || '{}');
    if (users[user.email]) {
      const pwd = users[user.email].password;
      users[user.email] = { ...updated, password: pwd };
      localStorage.setItem('qr_users', JSON.stringify(users));
    }
  };

  const loginAsDemo = () => {
    const demoUser: UserProfile = {
      email: 'demo@quickreceipt.in',
      name: 'Demo User',
      phone: '+91 98765 43210',
      business: {
        ...defaultBusinessInfo,
        name: 'Demo Business',
        address: '123 Main Street, Mumbai, MH 400001',
        phone: '+91 98765 43210',
      },
    };
    setUser(demoUser);
    localStorage.setItem('qr_user', JSON.stringify(demoUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
