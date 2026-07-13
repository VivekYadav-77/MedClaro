"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const SESSION_KEY = "medclaro.session";

export type SessionUser = {
  id?: number;
  username?: string;
  email?: string;
  name?: string;
};

type StoredSession = {
  token: string;
  user?: SessionUser | null;
};

type SessionContextValue = {
  token: string | null;
  user: SessionUser | null;
  isReady: boolean;
  isSignedIn: boolean;
  signIn: (token: string, user?: SessionUser | null) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readStoredSession();
    setToken(stored?.token ?? null);
    setUser(stored?.user ?? null);
    setIsReady(true);
  }, []);

  const signIn = useCallback((nextToken: string, nextUser?: SessionUser | null) => {
    const trimmedToken = nextToken.trim();
    setToken(trimmedToken);
    setUser(nextUser ?? null);
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ token: trimmedToken, user: nextUser ?? null })
    );
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      isSignedIn: Boolean(token),
      signIn,
      signOut
    }),
    [isReady, signIn, signOut, token, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
