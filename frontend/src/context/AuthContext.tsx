import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import {
  getMe,
  type AuthPayload,
  type AuthUser,
  type UsageSnapshot
} from "../lib/insightforgeApi";
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser
} from "../lib/http";

interface AuthContextValue {
  user: AuthUser | null;
  usage: UsageSnapshot | null;
  token: string | null;
  hydrated: boolean;
  applyAuth: (payload: AuthPayload) => void;
  refreshAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser<AuthUser>());
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [hydrated, setHydrated] = useState(false);

  function applyAuth(payload: AuthPayload) {
    setStoredToken(payload.token);
    setStoredUser(payload.user);
    setToken(payload.token);
    setUser(payload.user);
    setUsage(payload.usage);
  }

  async function refreshAuth() {
    if (!getStoredToken()) {
      setUser(null);
      setUsage(null);
      setToken(null);
      setHydrated(true);
      return;
    }

    try {
      const data = await getMe();
      setStoredUser(data.user);
      setUser(data.user);
      setUsage(data.usage);
      setToken(getStoredToken());
    } catch {
      clearStoredSession();
      setUser(null);
      setUsage(null);
      setToken(null);
    } finally {
      setHydrated(true);
    }
  }

  function logout() {
    clearStoredSession();
    setUser(null);
    setUsage(null);
    setToken(null);
  }

  useEffect(() => {
    void refreshAuth();
  }, []);

  const value = useMemo(
    () => ({
      user,
      usage,
      token,
      hydrated,
      applyAuth,
      refreshAuth,
      logout
    }),
    [hydrated, token, usage, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
