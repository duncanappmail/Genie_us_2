import React from 'react';

const TEMPLATE_CHARACTERS = [
    { name: 'Chloe', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1974&auto=format&fit=crop' },
    { name: 'Marcus', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop' },
    { name: 'Isabella', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop' },
    { name: 'Liam', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop' },
];

interface AvatarTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (character: { name: string, url: string }) => void;
}

export const AvatarTemplateModal: React.FC<AvatarTemplateModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Choose a Template Avatar</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TEMPLATE_CHARACTERS.map(char => (
            <button key={char.name} onClick={() => onSelect(char)} className="relative rounded-lg overflow-hidden group border-2 border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none aspect-square">
              <img src={char.url} alt={char.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <p className="absolute bottom-2 left-2 text-white font-bold text-sm">{char.name}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};