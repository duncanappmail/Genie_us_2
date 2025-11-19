
import React, { useState } from 'react';
import type { PlanName } from '../types';
import { PLANS } from '../constants';
import { CheckIcon, LeftArrowIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export const PlanSelectScreen: React.FC = () => {
    const { user, handleSelectPlan } = useAuth();
    const { goBack } = useUI();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
    const cameFromSubscriptionPage = !!user?.subscription;

    const PlanCard: React.FC<{ planName: PlanName }> = ({ planName }) => {
        const plan = PLANS[planName];
        const isPro = planName === 'Pro';
        const price = billingCycle === 'annually' ? plan.price.annually / 12 : plan.price.monthly;
        const isCurrentPlan = user?.subscription?.plan === planName;

        const displayPrice = (price: number) => {
            if (price === 0) return '0';
            const fixed = price.toFixed(2);
            return fixed.endsWith('.00') ? price.toFixed(0) : fixed;
        };

        return (
            <div className={`p-6 border rounded-xl flex flex-col bg-white shadow-sm relative dark:border-gray-700 ${isCurrentPlan ? 'ring-1 ring-brand-accent' : 'border-gray-200'}`}>
                {isPro && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-accent text-on-accent text-xs font-bold px-3 py-1 rounded-full">Recommended</div>}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">{plan.name}</h3>
                <div className="my-4">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${displayPrice(price)}</span>
                    <span className="text-sm text-gray-500 dark:text-white ml-2">{planName !== 'Free' && '/ month'}</span>
                </div>
                <div className="min-h-[3.5rem]">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.name === 'Free' ? `${plan.credits} one-time credits` : `${plan.credits} credits / month`}
                    </p>
                    {plan.name !== 'Free' && (
                        <p className="text-xs text-gray-500 mt-1">Credits do not roll over.</p>
                    )}
                </div>
                <button
                    onClick={() => handleSelectPlan(planName, billingCycle)}
                    disabled={isCurrentPlan}
                    className="w-full py-2.5 mt-6 font-semibold rounded-lg transition-colors bg-brand-accent text-on-accent hover:bg-brand-accent-hover disabled:cursor-not-allowed"
                >
                    {isCurrentPlan ? 'Current Plan' : (planName === 'Free' ? 'Start for Free' : 'Choose Plan')}
                </button>
                <ul className="mt-6 space-y-3 text-sm flex-grow">
                    {plan.features.map(feat => (
                        <li key={feat} className="flex items-start gap-3">
                            <CheckIcon className="w-5 h-5 mt-0.5 shrink-0 text-gray-600 dark:text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{feat}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
             {cameFromSubscriptionPage && (
                <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 hover:text-[#3f6212] dark:hover:text-[#91EB23]">
                    <LeftArrowIcon className="w-4 h-4"/> Back
                </button>
            )}
            <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-300">Start creating for free, or unlock more features with a subscription.</p>

                <div className="mt-8 flex justify-center items-center gap-4">
                    <span className={`font-medium ${billingCycle === 'monthly' ? 'text-brand-accent' : ''}`}>Monthly</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={billingCycle === 'annually'} onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                    </label>
                    <span className={`font-medium ${billingCycle === 'annually' ? 'text-brand-accent' : ''}`}>Annually</span>
                    <span className="text-xs bg-[#EDC600] text-black font-semibold px-2.5 py-0.5 rounded-full">SAVE 30%</span>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <PlanCard planName="Free" />
                <PlanCard planName="Basic" />
                <PlanCard planName="Pro" />
            </div>
        </div>
    );
};
