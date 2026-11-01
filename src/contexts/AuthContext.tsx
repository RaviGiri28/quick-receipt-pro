import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CustomFieldDef, Subscription, UserProfile } from '@/types/receipt';
import {
  authApi, clearToken, getToken, setToken, setUnauthorizedHandler, setDeactivatedHandler,
  ApiError, ProfileUpdate, SignupData,
} from '@/lib/api';
import { getSettings, saveSettings } from '@/lib/storage';
import { TERMS_VERSION } from '@/lib/legal';
import { clearUnlocked, markUnlocked } from '@/lib/appLock';

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
  signup: (data: SignupData) => Promise<number>;
  logout: () => void;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  updateCustomFields: (defs: CustomFieldDef[]) => Promise<void>;
  acceptTerms: () => Promise<void>;
  // Cancels a pending account deletion and logs in.
  restoreAccount: (email: string, password: string, remember: boolean) => Promise<void>;
  // Starts the deletion (recovery period) and logs out; returns when it will be erased.
  deleteAccount: (password: string) => Promise<string>;
  // App passcode: set or change (the current one is needed to change it), or remove with the password.
  setPasscode: (passcode: string, currentPasscode?: string) => Promise<void>;
  removePasscode: (password: string) => Promise<void>;
  // Reloads the profile in the background (e.g. to pick up an admin deactivating the account).
  refreshProfile: () => void;
  // Stores a subscription the server just returned (e.g. after applying a coupon).
  setSubscription: (subscription: Subscription) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearToken();
    clearUnlocked();
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

  // Background refresh that never logs out or shows an error; at most every 30 seconds.
  const lastRefresh = useRef(0);
  const refreshProfile = useCallback(() => {
    if (!getToken() || Date.now() - lastRefresh.current < 30_000) return;
    lastRefresh.current = Date.now();
    authApi.profile()
      .then(profile => setUser(prev => (prev && prev.id === profile.id
        ? { ...prev, deactivatedAt: profile.deactivatedAt, subscription: profile.subscription }
        : prev)))
      .catch(() => {});
  }, []);

  // An admin can deactivate or reactivate the account while it is open: pick that up when
  // the server refuses a request because of it, and whenever the user comes back to the tab.
  useEffect(() => {
    const onDeactivated = () => {
      lastRefresh.current = 0;
      refreshProfile();
    };
    setDeactivatedHandler(onDeactivated);
    window.addEventListener('focus', refreshProfile);
    return () => {
      setDeactivatedHandler(null);
      window.removeEventListener('focus', refreshProfile);
    };
  }, [refreshProfile]);

  const startSession = async (token: string, remember: boolean) => {
    setToken(token, remember);
    setSessionError(null);
    queryClient.clear();
    try {
      // Login only returns a subset of the profile; fetch the full one.
      const profile = await loadProfile();
      // A new login always starts locked: the passcode is asked after the password too.
      clearUnlocked();
      setUser(profile);
    } catch (err) {
      clearToken();
      throw err;
    }
  };

  const login = async (email: string, password: string, remember: boolean) => {
    const { token } = await authApi.login(email, password);
    await startSession(token, remember);
  };

  const restoreAccount = async (email: string, password: string, remember: boolean) => {
    const { token } = await authApi.restoreAccount(email, password);
    await startSession(token, remember);
  };

  const acceptTerms = async () => {
    await authApi.acceptTerms(TERMS_VERSION);
    setUser(prev => (prev ? { ...prev, termsAccepted: true } : prev));
  };

  const deleteAccount = async (password: string) => {
    const deleteOn = await authApi.deleteAccount(password);
    logout();
    return deleteOn;
  };

  // No auto-login: the signup page redirects to the login page. Returns the trial days.
  const signup = async (data: SignupData) => (await authApi.register(data)).trial_days;

  const setSubscription = useCallback((subscription: Subscription) => {
    setUser(prev => (prev ? { ...prev, subscription } : prev));
  }, []);

  const updateProfile = async (data: ProfileUpdate) => {
    setUser(await authApi.updateProfile(data));
  };

  const updateCustomFields = async (defs: CustomFieldDef[]) => {
    const saved = await authApi.updateCustomFields(defs);
    setUser(prev => (prev ? { ...prev, customFields: saved } : prev));
  };

  const setPasscode = async (passcode: string, currentPasscode?: string) => {
    await authApi.setPasscode(passcode, currentPasscode);
    // Whoever just set it knows it: don't lock this tab.
    if (user) markUnlocked(user.id);
    setUser(prev => (prev ? { ...prev, hasPasscode: true } : prev));
  };

  const removePasscode = async (password: string) => {
    await authApi.removePasscode(password);
    setUser(prev => (prev ? { ...prev, hasPasscode: false } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionError, retrySession: restoreSession, login, signup, logout, updateProfile, updateCustomFields, acceptTerms, restoreAccount, deleteAccount, setPasscode, removePasscode, refreshProfile, setSubscription }}>
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
      signup: async () => 0,
      logout: () => {},
      updateProfile: async () => {},
      updateCustomFields: async () => {},
      acceptTerms: async () => {},
      restoreAccount: async () => {},
      deleteAccount: async () => '',
      setPasscode: async () => {},
      removePasscode: async () => {},
      refreshProfile: () => {},
      setSubscription: () => {},
    } as AuthContextType;
  }
  return ctx;
}
