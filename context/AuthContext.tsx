import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, PlanName } from '../types';
import { useUI } from './UIContext';

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    handleLogin: (email: string) => void;
    handleLogout: () => void;
    handleSelectPlan: (plan: PlanName, billingCycle: 'monthly' | 'annually') => void;
    handleCancelSubscription: () => void;
    handleReactivateSubscription: () => void;
    handleUpdatePaymentDetails: (details: { brand: string, last4: string, expiry: string }) => void;
    deductCredits: (amount: number) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const { navigateTo, goBack } = useUI();

    const handleLogin = useCallback((email: string) => {
        const mockUser: User = { email, subscription: null, credits: null, paymentMethod: null };
        setUser(mockUser);
        navigateTo('PLAN_SELECT');
    }, [navigateTo]);

    const handleLogout = useCallback(() => {
        setUser(null);
        navigateTo('AUTH');
    }, [navigateTo]);

    const handleSelectPlan = useCallback((plan: PlanName, billingCycle: 'monthly' | 'annually') => {
        if (!user) return;
        const isUpdate = !!user.subscription;
        const credits = {
            'Free': { current: 20, total: 20 },
            'Basic': { current: 150, total: 150 },
            'Pro': { current: 450, total: 450 },
        }[plan];
        
        const renewsOn = new Date();
        if (billingCycle === 'annually') renewsOn.setFullYear(renewsOn.getFullYear() + 1);
        else renewsOn.setMonth(renewsOn.getMonth() + 1);

        setUser({
            ...user,
            subscription: { plan, billingCycle, renewsOn: renewsOn.getTime() },
            credits,
            paymentMethod: plan !== 'Free' ? { brand: 'Visa', last4: '4242', expiry: '12/26' } : null,
        });
        
        if (isUpdate) {
            navigateTo('SUBSCRIPTION');
        } else {
            navigateTo('HOME');
        }
    }, [user, navigateTo]);

    const handleCancelSubscription = useCallback(() => {
        if (!user?.subscription) return;
        setUser({ ...user, subscription: { ...user.subscription, cancelAtPeriodEnd: true } });
    }, [user]);

    const handleReactivateSubscription = useCallback(() => {
        if (!user?.subscription) return;
        setUser({ ...user, subscription: { ...user.subscription, cancelAtPeriodEnd: false } });
    }, [user]);

    const handleUpdatePaymentDetails = useCallback((details: { brand: string, last4: string, expiry: string }) => {
        if (!user) return;
        setUser({ ...user, paymentMethod: details });
        goBack();
    }, [user, goBack]);

    const deductCredits = useCallback((amount: number) => {
        setUser(prevUser => {
            if (!prevUser || !prevUser.credits) return prevUser;
            return {
                ...prevUser,
                credits: {
                    ...prevUser.credits,
                    current: Math.max(0, prevUser.credits.current - amount),
                }
            };
        });
    }, []);

    const value: AuthContextType = {
        user, setUser, handleLogin, handleLogout, handleSelectPlan,
        handleCancelSubscription, handleReactivateSubscription, handleUpdatePaymentDetails,
        deductCredits
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};