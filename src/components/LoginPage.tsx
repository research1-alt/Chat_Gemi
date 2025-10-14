import React, { useState } from 'react';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';

interface LoginPageProps {
    onLogin: (email: string, password: string) => void;
    error: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg animate-fade-in-up">
                <div className="flex flex-col items-center space-y-3">
                    <WrenchScrewdriverIcon className="h-12 w-12 text-brand-primary" />
                    <h1 className="text-3xl font-bold text-gray-900">User & Admin Login</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="relative">
                        <input
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                            placeholder="Email"
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                            placeholder="Password"
                        />
                    </div>
                    
                    {error && (
                        <div className="text-sm text-center text-red-600 font-medium" role="alert">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors"
                        >
                           Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};