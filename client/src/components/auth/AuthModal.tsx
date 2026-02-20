import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import type { AuthFormData, User } from '../../types';

const API_URL = 'http://localhost:8000/api';

export function AuthModal({ onClose }: { onClose: () => void }) {
    const { login } = useAuth();
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [authForm, setAuthForm] = useState<AuthFormData>({ username: '', password: '' });

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
            const { data } = await axios.post<User>(`${API_URL}${endpoint}`, authForm);
            login(data);
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
                <form onSubmit={handleAuth}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={authForm.username}
                        onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                        required
                    />
                    <button type="submit" className="btn-primary">
                        {authMode === 'login' ? 'Login' : 'Create Account'}
                    </button>
                </form>
                <p className="auth-switch">
                    {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                        {authMode === 'login' ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}
