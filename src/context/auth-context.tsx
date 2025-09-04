'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { username: string } | null;
  loading: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('tavern-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('tavern-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (username: string) => {
    const newUser = { username };
    try {
      localStorage.setItem('tavern-user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('tavern-user');
      setUser(null);
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
