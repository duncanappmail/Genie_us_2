import React, { useState } from 'react';
import { LeftArrowIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export const SubscriptionScreen: React.FC = () => {
    const { 
        user, 
        setUser, 
        handleReactivateSubscription 
    } = useAuth();
    const { 
        goBack, 
        navigateTo, 
        setIsCancelModalOpen 
    } = useUI();
    const [offerCode, setOfferCode] = useState('');
    const [offerMessage, setOfferMessage] = useState('');

    if (!user) return null;

    const addCredits = (amount: number) => {
        if (!user.credits) return;
        setUser({
            ...user,
            credits: {
                ...user.credits,
                current: user.credits.current + amount,
                total: user.subscription?.plan === 'Free' ? user.credits.total + amount : user.credits.total
            }
        });
    };

    const handleRedeem = () => {
        if (offerCode.toUpperCase() === 'FREE50') {
            addCredits(50);
            setOfferMessage('Success! 50 credits have been added to your account.');
            setOfferCode('');
        } else {
            setOfferMessage('Invalid offer code. Please try again.');
        }
        setTimeout(() => setOfferMessage(''), 3000);
    };

    const creditPacks = [{ credits: 50, price: 5 }, { credits: 120, price: 10 }];
    const canBuyCredits = user.subscription?.plan !== 'Free';
    const isCanceled = user.subscription?.cancelAtPeriodEnd;

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 hover:text-blue-600"><LeftArrowIcon className="w-4 h-4"/> Back</button>
            <h2 className="text-3xl font-bold">Subscription & Billing</h2>

            {isCanceled && (
                <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/30">
                    Your plan is scheduled to cancel on <strong>{new Date(user.subscription.renewsOn).toLocaleDateString()}</strong>. You can use your benefits until then.
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Current Plan */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
                        <h3 className="text-xl font-bold">My Plan</h3>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex justify-between items-center">
                            <div>
                                <span className="text-lg font-bold">{user.subscription?.plan}</span>
                                <span className="text-sm text-gray-500"> - Billed {user.subscription?.billingCycle}</span>
                                <p className="text-sm text-gray-500 mt-1">
                                    {isCanceled ? 'Expires on' : 'Renews on'} {new Date(user.subscription?.renewsOn || 0).toLocaleDateString()}
                                </p>
                            </div>
                            {isCanceled ? (
                                <button onClick={handleReactivateSubscription} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm">Reactivate</button>
                            ) : (
                                <button onClick={() => navigateTo('PLAN_SELECT')} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm">Change Plan</button>
                            )}
                        </div>
                        {!isCanceled && user.subscription?.plan !== 'Free' && (
                             <div className="mt-4 text-right">
                                <button onClick={() => setIsCancelModalOpen(true)} className="text-sm text-gray-500 hover:text-red-600 dark:hover:text-red-400">Cancel subscription</button>
                            </div>
                        )}
                    </div>
                    {/* Payment & Billing */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-bold">Payment Method</h3>
                                {user.paymentMethod ? (
                                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                        <p className="font-semibold">{user.paymentMethod.brand} **** {user.paymentMethod.last4}</p>
                                        <p>Expires {user.paymentMethod.expiry}</p>
                                    </div>
                                ): <p className="mt-4 text-sm text-gray-500">No payment method on file.</p>}
                                <button onClick={() => navigateTo('PAYMENT_DETAILS')} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">Manage</button>
                            </div>
                             <div>
                                <h3 className="text-xl font-bold">Billing History</h3>
                                <p className="mt-4 text-sm text-gray-500">View your past invoices and charges.</p>
                                <button onClick={() => navigateTo('BILLING_HISTORY')} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">View history</button>
                            </div>
                         </div>
                    </div>
                </div>
                {/* Right Column */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
                         <h3 className="text-lg font-bold mb-2">Credit Balance</h3>
                         <p className="text-4xl font-extrabold">{user.credits?.current}</p>
                         <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(user.credits?.current || 0) / (user.credits?.total || 1) * 100}%` }}></div>
                         </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
                         <h3 className="text-lg font-bold">Buy More Credits</h3>
                         <p className="text-sm text-gray-500 mt-1">Need a top-up?</p>
                         <button onClick={() => addCredits(creditPacks[1].credits)} disabled={!canBuyCredits} className="mt-3 w-full p-3 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <p className="font-bold">{creditPacks[1].credits} Credits for ${creditPacks[1].price}.00</p>
                         </button>
                         {!canBuyCredits && <p className="text-xs mt-2 text-yellow-600">Available on Basic and Pro plans.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};