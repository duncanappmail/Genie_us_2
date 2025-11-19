import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

const OAuthButton: React.FC<{ provider: string, onClick: () => void }> = ({ provider, onClick }) => {
    const Icon = () => {
        if (provider === 'Google') return <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.057 4.844C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.356-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.572 36.833 48 30.817 48 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>;
        if (provider === 'Apple') return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01,16.32c-1.34,0-2.67-0.5-3.76-1.5c-2.22-2.04-2.41-5.46-0.5-7.65c1.01-1.17,2.5-1.86,4.03-1.86 c1.33,0,2.58,0.5,3.6,1.47c-1.92,1.19-1.88,3.23,0.08,4.34c1.17,0.66,2.51,0.54,3.64-0.35c-1.13,2.58-3.32,4.38-5.91,4.41 C12.79,16.3,12.4,16.32,12.01,16.32z M14.55,3.02c0.97-1.23,2.62-2.08,4.34-2.08c0.23,0,0.45,0.02,0.67,0.06 c-1.77,0.21-3.36,1.07-4.34,2.23c-1.01,1.21-1.89,2.68-2.13,4.16c0.25,0.02,0.5,0.02,0.74,0.02c1.48,0,2.88-0.66,3.72-1.89 C17.96,5.29,17.43,3.29,14.55,3.02z"/></svg>;
        return null;
    };
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
            <Icon />
            <span className="font-semibold text-sm">Continue with {provider}</span>
        </button>
    );
};

export const AuthScreen: React.FC = () => {
    const { handleLogin } = useAuth();
    const { theme } = useUI();
    const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');
    const [view, setView] = useState<'form' | 'forgotPassword' | 'resetConfirmation'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Force light mode for this screen
        document.documentElement.classList.remove('dark');
        // Restore original theme on unmount
        return () => {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            }
        };
    }, [theme]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) handleLogin(email);
    };
    
    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically call an API to send the reset link
        setView('resetConfirmation');
    };

    const renderMainForm = () => (
        <>
            <div className="flex flex-col gap-4">
                <OAuthButton provider="Google" onClick={() => handleLogin('user@google.com')} />
                <OAuthButton provider="Apple" onClick={() => handleLogin('user@apple.com')} />
            </div>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
            </div>
            <div>
                 <div className="border-b border-gray-200 mb-6">
                    <div className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('signIn')}
                            className={`px-4 py-3 text-sm font-semibold transition-colors ${
                                activeTab === 'signIn' ? 'border-b-2 border-brand-accent text-gray-900' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setActiveTab('signUp')}
                            className={`px-4 py-3 text-sm font-semibold transition-colors ${
                                activeTab === 'signUp' ? 'border-b-2 border-brand-accent text-gray-900' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'signUp' && (
                        <div>
                            <label htmlFor="name" className="sr-only">Full name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} name="name" id="name" placeholder="Full name" required className="auth-input input-focus-brand" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} name="email" id="email" placeholder="Email address" required className="auth-input input-focus-brand" />
                    </div>
                    <div>
                        <label htmlFor="password"className="sr-only">Password</label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} name="password" id="password" placeholder="Password" required className="auth-input input-focus-brand pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    {activeTab === 'signIn' && (
                        <div className="text-right text-sm">
                            <button type="button" onClick={() => setView('forgotPassword')} className="font-medium text-gray-500 hover:text-brand-accent">
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button type="submit" className="w-full py-3 px-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors">
                        {activeTab === 'signIn' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
            </div>
        </>
    );

    const renderForgotPassword = () => (
        <div>
            <h3 className="text-xl font-bold text-center">Reset your password</h3>
            <p className="text-center text-gray-600 mt-2 text-sm">Enter your email and we'll send you a link to get back into your account.</p>
            <form onSubmit={handleForgotPasswordSubmit} className="mt-8 space-y-6">
                 <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="auth-input input-focus-brand"
                />
                <button type="submit" className="w-full py-3 px-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors">
                    Send Reset Link
                </button>
                 <div className="text-center">
                    <button type="button" onClick={() => setView('form')} className="font-medium text-gray-500 hover:text-brand-accent text-sm">
                        Back to Sign In
                    </button>
                </div>
            </form>
        </div>
    );
    
    const renderResetConfirmation = () => (
        <div className="text-center">
            <h3 className="text-xl font-bold">Check your email</h3>
            <p className="text-gray-600 mt-2 text-sm">We've sent a password reset link to <strong>{email}</strong>.</p>
            <button
                onClick={() => {
                    setView('form');
                    setActiveTab('signIn');
                }}
                className="w-full mt-8 py-3 px-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors"
            >
                Back to Sign In
            </button>
        </div>
    );


    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-900">Welcome to GenieUs</h2>
                <p className="text-center text-gray-600 mt-2">
                    Where all your marketing wishes come true
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-200">
                    {view === 'form' && renderMainForm()}
                    {view === 'forgotPassword' && renderForgotPassword()}
                    {view === 'resetConfirmation' && renderResetConfirmation()}
                </div>
                 <style>{`
                    .auth-input {
                        display: block;
                        width: 100%;
                        padding: 1rem;
                        border-width: 1px;
                        border-color: #d1d5db; /* border-gray-300 */
                        border-radius: 0.5rem;
                        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                        transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
                    }
                `}</style>
            </div>
        </div>
    );
};
