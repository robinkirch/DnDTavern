// src/context/auth-context.tsx
'use client';

import type { User } from '@/lib/types';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Import the new service functions
import { loginUser, registerUser } from '../lib/authService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, role: 'player' | 'dm', avatar: string | null) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
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

    const login = async (username: string, password: string): Promise<void> => {
        try {
            const userData = await loginUser({ username, password });
            localStorage.setItem('tavern-user', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };
    
    const register = async (username: string, password: string, role: 'player' | 'dm', avatar: string | null): Promise<void> => {
        try {
            const registeredUser = await registerUser({ username, password, role: role === 'dm' ? 'DM' : 'Player', avatar });
            
            // Log in the new user after successful registration to get the token
            const userData = await loginUser({ username, password });
            localStorage.setItem('tavern-user', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
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
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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