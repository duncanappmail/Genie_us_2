import React, { useEffect } from 'react';
import { useUI } from './context/UIContext';
import { useAuth } from './context/AuthContext';
import { useProjects } from './context/ProjectContext';

import { HomeScreen } from './screens/HomeScreen';
import { AuthScreen } from './screens/AuthScreen';
import { PlanSelectScreen } from './screens/PlanSelectScreen';
import { GeneratorScreen } from './screens/GeneratorScreen';
import { UGCGeneratorScreen } from './screens/UGCGeneratorScreen';
import { PreviewScreen } from './screens/PreviewScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { BillingHistoryScreen } from './screens/BillingHistoryScreen';
import { PaymentDetailsScreen } from './screens/PaymentDetailsScreen';
import { AllProjectsScreen } from './screens/AllProjectsScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { AgentScreen } from './screens/AgentScreen';
import { AgentResultScreen } from './screens/AgentResultScreen';

import { Header } from './components/Header';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { ExtendVideoModal } from './components/ExtendVideoModal';
import { CancelSubscriptionModal } from './components/CancelSubscriptionModal';
import type { PlanName } from './types';


// Define AppStep type
export type AppStep = 'AUTH' | 'PLAN_SELECT' | 'HOME' | 'ALL_PROJECTS' | 'GENERATE' | 'UGC_GENERATE' | 'PREVIEW' | 'SUBSCRIPTION' | 'BILLING_HISTORY' | 'PAYMENT_DETAILS' | 'EXPLORE' | 'AGENT' | 'AGENT_RESULT';

// --- Constants ---
export const PLANS: Record<PlanName, any> = {
    'Free': {
        name: 'Free',
        price: { monthly: 0, annually: 0 },
        credits: 20,
        features: ['Product Ad', 'Art Maker', 'Style Presets', 'Community Support']
    },
    'Basic': {
        name: 'Basic',
        price: { monthly: 20, annually: 168 },
        credits: 150,
        features: ['Product Ad', 'Art Maker', 'Style Presets', 'Buy Extra Credits', 'Email Support']
    },
    'Pro': {
        name: 'Pro',
        price: { monthly: 35, annually: 294 },
        credits: 450,
        features: [
            'Everything in Basic', 
            'Have Your Very Own AI Agent That Works Autonomously',
            'Create UGC Videos',
            'Make Social Videos', 
            'Animate & Extend Videos', 
            'All Advanced Video Settings', 
            'Priority Support'
        ]
    }
};

export const CREDIT_COSTS = {
    artMaker: 1,      // per image
    productAd: 2,     // per image
    refine: 1,
    animate: 5,
    videoFast: 10,
    videoCinematic: 20,
    videoExtend: 15,
    agent: 25,
    ugcVideo: 30, // Cost for UGC video generation
};


// Main App Component
const App: React.FC = () => {
    const { 
        appStep, isLoading, isExtendModalOpen, isCancelModalOpen,
        setIsExtendModalOpen, setIsCancelModalOpen
    } = useUI();
    const { user, handleCancelSubscription } = useAuth();
    const { 
        projectToDelete, setProjectToDelete, handleConfirmDelete, handleConfirmExtend, 
        loadProjects, setProjects, setCurrentProject 
    } = useProjects();

    // This effect coordinates between Auth and Project contexts
    useEffect(() => {
        if (user) {
            loadProjects(user.email);
        } else {
            // On logout, clear project data
            setProjects([]);
            setCurrentProject(null);
        }
    }, [user, loadProjects, setProjects, setCurrentProject]);

    const renderScreen = () => {
        if (!user && appStep !== 'AUTH') {
            return <AuthScreen />;
        }
        
        switch (appStep) {
            case 'AUTH':
                return <AuthScreen />;
            case 'PLAN_SELECT':
                return <PlanSelectScreen />;
            case 'HOME':
                return <HomeScreen />;
            case 'ALL_PROJECTS':
                 return <AllProjectsScreen />;
            case 'SUBSCRIPTION':
                 return <SubscriptionScreen />;
            case 'BILLING_HISTORY':
                return <BillingHistoryScreen />;
            case 'PAYMENT_DETAILS':
                return <PaymentDetailsScreen />;
            case 'GENERATE':
                return <GeneratorScreen />;
            case 'UGC_GENERATE':
                return <UGCGeneratorScreen />;
            case 'PREVIEW':
                return <PreviewScreen />;
            case 'EXPLORE':
                return <ExploreScreen />;
            case 'AGENT':
                return <AgentScreen />;
            case 'AGENT_RESULT':
                return <AgentResultScreen />;
            default:
                return <HomeScreen />;
        }
    };
    
    const isInitialPlanSelection = user && !user.subscription;

    return (
        <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
            {isLoading && <LoadingOverlay />}
            {user && appStep !== 'AUTH' && <Header isInitialPlanSelection={isInitialPlanSelection} />}
            <main key={appStep} className="p-4 sm:p-6 md:p-8 page-enter">
                {renderScreen()}
            </main>
            <DeleteConfirmationModal 
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
            />
            <ExtendVideoModal
                isOpen={isExtendModalOpen}
                onClose={() => setIsExtendModalOpen(false)}
                onConfirm={handleConfirmExtend}
            />
            <CancelSubscriptionModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={() => {
                    handleCancelSubscription();
                    setIsCancelModalOpen(false);
                }}
                planName={user?.subscription?.plan || ''}
                renewsOn={user?.subscription?.renewsOn || 0}
            />
        </div>
    );
};

export default App;