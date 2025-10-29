import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useUI } from '../context/UIContext';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import type { Template, TemplateCategory } from '../types';
import { DocumentTextIcon } from '../components/icons';
import { PromptDisplayModal } from '../components/PromptDisplayModal';

export const ExploreScreen: React.FC = () => {
    const { selectTemplate } = useProjects();
    const { setError } = useUI();
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');
    const [promptToShow, setPromptToShow] = useState<string | null>(null);

    const categories: TemplateCategory[] = ['All', 'Holidays & Events', 'Seasonal', 'Studio', 'Lifestyle', 'Surreal'];

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11
    const nextMonth = (currentMonth + 1) % 12;
    const isSecondHalfOfMonth = currentDate.getDate() > 15;

    const isHolidayOrEventActive = (template: Template): boolean => {
        if (!template.activeMonths) return false;
        // An event is considered "active" if it's in the current month,
        // or if it's in the next month AND we are in the second half of the current month.
        return template.activeMonths.some(m => {
            if (m === currentMonth) return true;
            if (m === nextMonth && isSecondHalfOfMonth) return true;
            return false;
        });
    };

    const getSortValue = (month: number, currentMonth: number) => (month - currentMonth + 12) % 12;

    const filteredTemplates = (() => {
        if (activeCategory === 'All') {
            // Filter out any holiday/event or seasonal templates that are not currently relevant.
            const relevantTemplates = TEMPLATE_LIBRARY.filter(t => {
                if (t.category === 'Holidays & Events') {
                    return isHolidayOrEventActive(t);
                }
                if (t.category === 'Seasonal') {
                    return t.activeMonths?.includes(currentMonth) ?? false;
                }
                return true; // Keep all templates from other categories.
            });

            // Now, sort the relevant templates.
            const categoryOrder: TemplateCategory[] = ['Holidays & Events', 'Seasonal', 'Studio', 'Lifestyle', 'Surreal'];
            const getTemplatePriority = (template: Template): number => {
                // Highest priority for active holidays/events (already filtered)
                if (template.category === 'Holidays & Events') {
                    return 0;
                }
                // Next priority for active seasonal templates
                if (template.category === 'Seasonal' && template.activeMonths?.includes(currentMonth)) {
                    return 1;
                }
                // Then, prioritize by the defined category order
                const categoryIndex = categoryOrder.indexOf(template.category);
                return categoryIndex !== -1 ? categoryIndex + 2 : 99;
            };

            return relevantTemplates.sort((a, b) => {
                const priorityA = getTemplatePriority(a);
                const priorityB = getTemplatePriority(b);

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                // If priority is the same (i.e., both are upcoming holidays), sort by date proximity
                if (priorityA === 0 && a.activeMonths && b.activeMonths) {
                    const firstMonthA = a.activeMonths[0];
                    const firstMonthB = b.activeMonths[0];
                    return getSortValue(firstMonthA, currentMonth) - getSortValue(firstMonthB, currentMonth);
                }

                return 0; // Maintain original relative order for other categories
            });
        }

        if (activeCategory === 'Seasonal') {
            return TEMPLATE_LIBRARY.filter(t => t.category === 'Seasonal' && t.activeMonths?.includes(currentMonth));
        }

        if (activeCategory === 'Holidays & Events') {
             return TEMPLATE_LIBRARY
             .filter(t => t.category === 'Holidays & Events' && isHolidayOrEventActive(t))
             .sort((a, b) => {
                // Ensure activeMonths exists before accessing it
                if (a.activeMonths && b.activeMonths) {
                    const firstMonthA = a.activeMonths[0];
                    const firstMonthB = b.activeMonths[0];
                    return getSortValue(firstMonthA, currentMonth) - getSortValue(firstMonthB, currentMonth);
                }
                return 0;
            });
        }

        return TEMPLATE_LIBRARY.filter(t => t.category === activeCategory);
    })();
    
    const handleSelectTemplate = (template: Template) => {
        setError(null); // Clear any previous errors
        selectTemplate(template);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold">Explore Templates</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Find the perfect starting point. Select a template and we'll automatically customize it with your product details.
                </p>
            </div>

            <div className="mb-8">
                <div className="flex sm:justify-center flex-nowrap sm:flex-wrap overflow-x-auto gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`whitespace-nowrap px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                activeCategory === category
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                    <div key={template.id} className="group relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                            {template.category}
                        </div>
                        <img 
                            src={template.previewImageUrl} 
                            alt={template.title}
                            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setPromptToShow(template.imageGenerationPrompt);
                            }}
                            className="absolute top-3 right-3 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors z-10 opacity-0 group-hover:opacity-100"
                            aria-label="Show image generation prompt"
                        >
                            <DocumentTextIcon className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-0 left-0 p-4 w-full">
                             <h3 className="text-white font-bold text-lg">{template.title}</h3>
                             <p className="text-gray-200 text-sm mt-1 h-10 overflow-hidden">{template.description}</p>
                             <button
                                onClick={() => handleSelectTemplate(template)}
                                className="mt-3 w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                             >
                                Use Template
                             </button>
                        </div>
                    </div>
                ))}
            </div>
            {filteredTemplates.length === 0 && (activeCategory === 'Seasonal' || activeCategory === 'Holidays & Events') && (
                 <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl col-span-full">
                    <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400">No templates for this month</h3>
                    <p className="mt-2 text-gray-500">Check back soon or explore other categories!</p>
                </div>
            )}
            <PromptDisplayModal 
                isOpen={!!promptToShow}
                onClose={() => setPromptToShow(null)}
                prompt={promptToShow || ''}
                title="Image Generation Prompt"
            />
        </div>
    );
};