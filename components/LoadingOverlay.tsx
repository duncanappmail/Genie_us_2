import React, { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import { CheckIcon, LightbulbIcon, SparklesIcon } from './icons';

interface LoadingOverlayProps {}

const LOADING_MESSAGES = [
    "Working my magic...",
    "Your wish is taking shape!",
    "Mixing stardust and pixels...",
    "Polishing the lamp...",
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = () => {
    const { agentStatusMessages, generationStatusMessages } = useUI();
    const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentMessage(prevMessage => {
                const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
                return LOADING_MESSAGES[nextIndex];
            });
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);
    
    const showChecklist = agentStatusMessages.length > 0 || generationStatusMessages.length > 0;
    const isAgent = agentStatusMessages.length > 0;
    const title = isAgent ? "Your Team of AI Agents are working..." : "Generating Your Creation...";
    const statusMessages = isAgent ? [] : generationStatusMessages;

    const getIconForAgentStep = (type: 'thought' | 'action' | 'result' | 'done') => {
        switch(type) {
            case 'thought': return <LightbulbIcon className="w-5 h-5 text-yellow-500 shrink-0" />;
            case 'action': return <div className="w-5 h-5 flex items-center justify-center shrink-0"><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
            case 'result': return <SparklesIcon className="w-5 h-5 text-purple-500 shrink-0" />;
            case 'done': return <CheckIcon className="w-5 h-5 text-green-500 shrink-0" />;
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-300 p-4">
            {showChecklist ? (
                <div className="w-full max-w-md">
                     <h3 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">{title}</h3>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border dark:border-gray-700 space-y-3">
                        {isAgent ? (
                             agentStatusMessages.map((msg, index) => (
                                <div key={index} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                                    {getIconForAgentStep(msg.type)}
                                    <div>
                                        <p className={`font-semibold text-sm ${msg.type === 'done' ? 'text-green-500' : 'text-gray-800 dark:text-gray-200'}`}>{msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{msg.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            statusMessages.map((msg, index) => (
                                <div key={index} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                                    {msg.startsWith('✅') ? 
                                        <CheckIcon className="w-5 h-5 text-green-500 shrink-0" /> :
                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    }
                                    <p className={`text-sm ${msg.startsWith('✅') ? 'text-gray-500 dark:text-gray-400' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>{msg.replace('✅ ', '')}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="w-16 h-16 text-blue-500">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                                    <stop stopColor="#3b82f6" offset="0%"/>
                                    <stop stopColor="#60a5fa" offset="100%"/>
                                </linearGradient>
                            </defs>
                            <path d="M 50,50 m 0,-48 a 48,48 0 1 1 0,96 a 48,48 0 1 1 0,-96" fill="none" stroke="url(#g)" strokeWidth="4">
                                <animateTransform 
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 50 50"
                                    to="360 50 50"
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                />
                                <animate 
                                    attributeName="stroke-dasharray" 
                                    values="150.8, 150.8; 1, 300; 150.8, 150.8" 
                                    dur="1.5s" 
                                    repeatCount="indefinite" 
                                />
                            </path>
                        </svg>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200 text-center px-4">{currentMessage}</p>
                </>
            )}
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};