import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || null; }
        catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);

    const login = useCallback(async (email, password) => {
        const res = await api.post('/api/auth/login', { email, password });
        const { token: newToken, data } = res.data;
        const userData = data?.user || data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken); setUser(userData);
        return userData;
    }, []);

    const register = useCallback(async (formData) => {
        const res = await api.post('/api/auth/register', formData);
        const { token: newToken, data } = res.data;
        const userData = data?.user || data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken); setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null); setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get('/api/auth/me');
            const userData = res.data?.data?.user || res.data?.data;
            if (userData) { localStorage.setItem('user', JSON.stringify(userData)); setUser(userData); }
        } catch { }
    }, []);

    return (
        <AuthContext.Provider value={{
            user, token,
            isAdmin: user?.role === 'admin',
            isLoggedIn: !!token && !!user,
            login, register, logout, refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}