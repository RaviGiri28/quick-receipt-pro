import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CustomFieldDef, UserProfile } from '@/types/receipt';
import {
  authApi, clearToken, getToken, setToken, setUnauthorizedHandler,
  ApiError, ProfileUpdate, SignupData,
} from '@/lib/api';
import { getSettings, saveSettings } from '@/lib/storage';

// Custom field definitions used to be kept per browser. If the account has never
// stored any, upload this browser's ones so receipts keep showing their values.
async function loadProfile(): Promise<UserProfile> {
  const profile = await authApi.profile();
  const settings = getSettings();
  const legacy = (settings.customFields || []).filter(cf => cf.label?.trim());
  if (profile.customFields === null && legacy.length > 0) {
    try {
      profile.customFields = await authApi.updateCustomFields(legacy);
      const { customFields: _moved, ...rest } = settings;
      saveSettings(rest);
    } catch {
      // Keep the local copy and try again on the next load.
    }
  }
  return profile;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  // Set when a saved session couldn't be checked (server down, network error);
  // the session is kept and retrySession() tries again.
  sessionError: string | null;
  retrySession: () => void;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  updateCustomFields: (defs: CustomFieldDef[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setSessionError(null);
    queryClient.clear();
  }, [queryClient]);

  // Expired or revoked token on any request -> back to logged-out state.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore the session from a saved token. Only an auth failure ends the session;
  // a server restart or network blip must not log the user out.
  const restoreSession = useCallback(() => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setSessionError(null);
    loadProfile()
      .then(setUser)
      .catch((err) => {
        // 401s are already handled by the unauthorized handler (logout).
        if (err instanceof ApiError && err.status === 401) return;
        setSessionError(err instanceof Error ? err.message : 'Could not reach the server.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email: string, password: string, remember: boolean) => {
    const { token } = await authApi.login(email, password);
    setToken(token, remember);
    setSessionError(null);
    queryClient.clear();
    try {
      // Login only returns a subset of the profile; fetch the full one.
      setUser(await loadProfile());
    } catch (err) {
      clearToken();
      throw err;
    }
  };

  const signup = async (data: SignupData) => {
    // No auto-login: the signup page redirects to the login page.
    await authApi.register(data);
  };

  const updateProfile = async (data: ProfileUpdate) => {
    setUser(await authApi.updateProfile(data));
  };

  const updateCustomFields = async (defs: CustomFieldDef[]) => {
    const saved = await authApi.updateCustomFields(defs);
    setUser(prev => (prev ? { ...prev, customFields: saved } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionError, retrySession: restoreSession, login, signup, logout, updateProfile, updateCustomFields }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Defensive fallback prevents blank screens from HMR/context mismatches.
    console.warn('useAuth called outside AuthProvider — returning safe defaults.');
    return {
      user: null,
      isLoading: false,
      sessionError: null,
      retrySession: () => {},
      login: async () => {},
      signup: async () => {},
      logout: () => {},
      updateProfile: async () => {},
      updateCustomFields: async () => {},
    } as AuthContextType;
  }
  return ctx;
}
