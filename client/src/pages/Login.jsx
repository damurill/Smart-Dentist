import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    // Fallback password just in caseenv var is missed, or strictly use env var.
    // User asked for "Smart2026".
    const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'Smart2026';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('token', data.token); // Store JWT
                navigate('/');
            } else {
                setError(true);
                setTimeout(() => setError(false), 2000);
            }
        } catch (err) {
            console.error("Login failed", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo / Brand Area */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Smart Medical</h1>
                    <p className="text-gray-500">Acceso Seguro</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña Maestra
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${error
                                        ? 'border-red-300 bg-red-50 focus:ring-red-500'
                                        : 'border-gray-200 bg-white/50 focus:border-blue-500'
                                        }`}
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-red-600 animate-pulse">
                                    Contraseña incorrecta
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span>Ingresar al Sistema</span>
                            <ArrowRight size={18} />
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    &copy; 2026 Smart Medical System
                </p>
            </div>
        </div>
    );
};

export default Login;
