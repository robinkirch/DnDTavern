'use client';

import type { User } from '@/lib/types';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, registerUser } from '../lib/authService';
import { useRouter, usePathname } from 'next/navigation';
import { getCharacterData } from '@/lib/data-service';

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

    const router = useRouter();
    const pathname = usePathname();

    const fetchFullUserData = async (basicUser: User): Promise<User> => {
        try {
            if(basicUser.role == "dm")
                return { ...basicUser, characterData: {} };
            const charData = await getCharacterData(basicUser.username);
            return { ...basicUser, characterData: charData };
        } catch (error) {
            console.error("Failed to fetch character data:", error);
            return { ...basicUser, characterData: {} };
        }
    };

    useEffect(() => {
        const publicPaths = ['/login']; 

        if (!loading && !user && !publicPaths.includes(pathname)) {
            router.push('/login');
        }
    }, [user, loading, pathname, router]);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedUser = localStorage.getItem('tavern-user');
                if (storedUser) {
                    const basicUser = JSON.parse(storedUser);
                    const fullUser = await fetchFullUserData(basicUser);
                    setUser(fullUser);
                }
            } catch (error) {
                localStorage.removeItem('tavern-user');
            } finally {
                setLoading(false);
            }
        };
        initializeAuth();
    }, []);

    const login = async (username: string, password: string): Promise<void> => {
        try {
            const basicUser = await loginUser({ username, password });
            
            const fullUser = await fetchFullUserData(basicUser);
            
            localStorage.setItem('tavern-user', JSON.stringify(basicUser));
            setUser(fullUser);
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };
    
    const register = async (username: string, password: string, role: 'player' | 'dm', avatar: string | null): Promise<void> => {
        try {
            await registerUser({ username, password, role: role === 'dm' ? 'DM' : 'Player', avatar });
            
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