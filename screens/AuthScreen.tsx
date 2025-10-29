import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';

const OAuthButton: React.FC<{ provider: string, onClick: () => void }> = ({ provider, onClick }) => {
    const Icon = () => {
        // In a real app, you'd use logos. Here, we'll use simple text.
        if (provider === 'Google') return <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.057 4.844C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.356-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.572 36.833 48 30.817 48 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>;
        if (provider === 'Apple') return <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.225.36c-.305-.01-1.31.33-2.16.94-.65.46-1.18 1.12-1.63 1.95-.53.94-.83 1.83-.93 2.7-.01.1.02.19.08.26.06.07.16.12.26.11.83-.09 1.9-.49 2.92-1.15.93-.6 1.57-1.27 1.94-2.02.1-.22.1-.38-.05-.59-.14-.2-.33-.31-.54-.3zM9.44 5.48c-1.64.04-3.15.82-4.14 2.03-1.2 1.48-1.89 3.23-1.85 5.13.25 1.52.92 2.89 1.92 3.99.78.86 1.74 1.43 2.87 1.58.18.01.31-.1.35-.25.04-.15.01-.3-.09-.43-.53-.62-1-1.33-1.34-2.12-.47-1.1-.64-2.28-.48-3.53.16-1.3.69-2.45 1.53-3.37.5-.54 1.12-.91 1.8-1.07.15-.04.26-.15.29-.31.03-.16-.03-.32-.16-.42-.31-.22-.64-.4-1-.53-.1-.03-.2-.04-.3-.04zM16.42 6.5c-1.1-.18-2.24.23-3.1.93-.9.72-1.46 1.78-1.64 2.98-.21 1.34.02 2.7.67 3.86.63 1.14 1.63 1.93 2.83 2.23 1.12.28 2.26-.01 3.23-.74.98-.74 1.6-1.87 1.74-3.12.19-1.57-.32-3.15-1.3-4.32-.4-.48-.89-.85-1.43-1.09-.13-.06-.28-.05-.4.03z"></path></svg>;
        return null;
    };
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
            <Icon />
            <span className="font-semibold text-sm">Continue with {provider}</span>
        </button>
    );
};

export const AuthScreen: React.FC = () => {
    const { handleLogin } = useAuth();
    const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');
    const [view, setView] = useState<'form' | 'forgotPassword' | 'resetConfirmation'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            <div className="flex flex-col sm:flex-row gap-4">
                <OAuthButton provider="Google" onClick={() => handleLogin('user@google.com')} />
                <OAuthButton provider="Apple" onClick={() => handleLogin('user@apple.com')} />
            </div>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span>
                </div>
            </div>
            <div>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('signIn')}
                            className={`${activeTab === 'signIn' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setActiveTab('signUp')}
                            className={`${activeTab === 'signUp' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            Sign Up
                        </button>
                    </nav>
                </div>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {activeTab === 'signUp' && (
                        <div>
                            <label htmlFor="name" className="sr-only">Full name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} name="name" id="name" placeholder="Full name" required className="auth-input" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} name="email" id="email" placeholder="Email address" required className="auth-input" />
                    </div>
                    <div>
                        <label htmlFor="password"className="sr-only">Password</label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} name="password" id="password" placeholder="Password" required className="auth-input pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    {activeTab === 'signIn' && (
                        <div className="text-right text-sm">
                            <button type="button" onClick={() => setView('forgotPassword')} className="font-medium text-blue-600 hover:text-blue-500">
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button type="submit" className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        {activeTab === 'signIn' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
            </div>
        </>
    );

    const renderForgotPassword = () => (
        <div>
            <h3 className="text-xl font-bold text-center">Reset your password</h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-2 text-sm">Enter your email and we'll send you a link to get back into your account.</p>
            <form onSubmit={handleForgotPasswordSubmit} className="mt-8 space-y-6">
                 <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="auth-input"
                />
                <button type="submit" className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    Send Reset Link
                </button>
                 <div className="text-center">
                    <button type="button" onClick={() => setView('form')} className="font-medium text-blue-600 hover:text-blue-500 text-sm">
                        Back to Sign In
                    </button>
                </div>
            </form>
        </div>
    );
    
    const renderResetConfirmation = () => (
        <div className="text-center">
            <h3 className="text-xl font-bold">Check your email</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">We've sent a password reset link to <strong>{email}</strong>.</p>
            <button
                onClick={() => {
                    setView('form');
                    setActiveTab('signIn');
                }}
                className="w-full mt-8 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
                Back to Sign In
            </button>
        </div>
    );


    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-3xl font-bold text-center">Welcome to GenieUs</h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                    {view === 'form' ? (activeTab === 'signIn' ? 'Sign in to your account' : 'Create a new account') : ''}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-200 dark:border-gray-700">
                    {view === 'form' && renderMainForm()}
                    {view === 'forgotPassword' && renderForgotPassword()}
                    {view === 'resetConfirmation' && renderResetConfirmation()}
                </div>
                 <style>{`
                    .auth-input {
                        display: block;
                        width: 100%;
                        padding: 0.75rem;
                        border-width: 1px;
                        border-radius: 0.5rem;
                        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                        transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
                    }
                    .dark .auth-input {
                        background-color: #1f2937;
                        border-color: #4b5563;
                    }
                    .auth-input:focus {
                        outline: 2px solid transparent;
                        outline-offset: 2px;
                        border-color: #3b82f6;
                        --tw-ring-color: #3b82f6;
                        box-shadow: 0 0 0 2px var(--tw-ring-color);
                    }
                `}</style>
            </div>
        </div>
    );
};