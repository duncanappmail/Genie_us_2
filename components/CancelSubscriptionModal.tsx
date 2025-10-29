import React from 'react';

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    planName: string;
    renewsOn: number;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({ isOpen, onClose, onConfirm, planName, renewsOn }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cancel Subscription</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Are you sure you want to cancel your <strong>{planName}</strong> plan? Your plan will remain active until {new Date(renewsOn).toLocaleDateString()}.
                    </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button onClick={onConfirm} className="w-full sm:flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">Confirm Cancellation</button>
                    <button onClick={onClose} className="w-full sm:flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Keep My Plan</button>
                </div>
            </div>
        </div>
    );
};