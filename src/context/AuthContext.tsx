import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'cliente' | 'conductor';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  role: UserRole;
  loading: boolean;
  loginWithGoogleMock: (overrideRole?: UserRole) => Promise<void>;
  loginAsDriverMock: () => Promise<void>;
  switchRole: () => void;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
}

const DEFAULT_CLIENT_USER: AppUser = {
  uid: 'usr-client-oruro-01',
  email: 'ciudadano.oruro@recicla.bo',
  displayName: 'Ciudadano Oruro (Cliente)',
  role: 'cliente',
  photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
};

const DEFAULT_DRIVER_USER: AppUser = {
  uid: 'usr-driver-oruro-01',
  email: 'conductor.camion1@raee-oruro.bo',
  displayName: 'Conductor Camión #1 (Recolector)',
  role: 'conductor',
  photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializamos con el usuario cliente para acceso inmediato fluido
  const [user, setUser] = useState<AppUser | null>(DEFAULT_CLIENT_USER);
  const [role, setRole] = useState<UserRole>('cliente');
  const [loading, setLoading] = useState(false);

  const loginWithGoogleMock = async (overrideRole: UserRole = 'cliente'): Promise<void> => {
    setLoading(true);
    // Simula latencia de Google Sign-In
    await new Promise((r) => setTimeout(r, 400));
    const targetUser = overrideRole === 'conductor' ? DEFAULT_DRIVER_USER : DEFAULT_CLIENT_USER;
    setUser(targetUser);
    setRole(overrideRole);
    setLoading(false);
  };

  const loginAsDriverMock = async (): Promise<void> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setUser(DEFAULT_DRIVER_USER);
    setRole('conductor');
    setLoading(false);
  };

  const switchRole = (): void => {
    const nextRole: UserRole = role === 'cliente' ? 'conductor' : 'cliente';
    setRole(nextRole);
    if (user) {
      setUser(nextRole === 'conductor' ? DEFAULT_DRIVER_USER : DEFAULT_CLIENT_USER);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    setUser(null);
    setLoading(false);
  };

  const signIn = async (email: string): Promise<void> => {
    const isDriver = email.toLowerCase().includes('conductor') || email.toLowerCase().includes('chofer');
    const targetRole: UserRole = isDriver ? 'conductor' : 'cliente';
    await loginWithGoogleMock(targetRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginWithGoogleMock,
        loginAsDriverMock,
        switchRole,
        signOut,
        signIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
