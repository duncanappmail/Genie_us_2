import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';

const TEMPLATE_CHARACTERS = [
    { name: 'Chloe', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400' },
    { name: 'Marcus', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400' },
    { name: 'Isabella', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400' },
    { name: 'Liam', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400' },
];

interface AvatarTemplate {
    name: string;
    url: string;
}

interface AvatarTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (character: AvatarTemplate) => void;
}

export const AvatarTemplateModal: React.FC<AvatarTemplateModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedChar, setSelectedChar] = useState<AvatarTemplate | null>(null);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Choose a Template Avatar</h3>
          <div className="grid grid-cols-2 gap-4 p-1">
            {TEMPLATE_CHARACTERS.map(char => (
              <button
                key={char.name}
                onClick={() => setSelectedChar(char)}
                className={`relative rounded-lg overflow-hidden group border-2 transition-colors ${selectedChar?.name === char.name ? 'border-brand-accent' : 'border-transparent'} focus:outline-none aspect-square`}
              >
                <img src={char.url} alt={char.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-2 left-2 text-white font-bold text-sm">{char.name}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
            <button
              onClick={() => selectedChar && onSelect(selectedChar)}
              disabled={!selectedChar}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors disabled:opacity-50"
            >
              Use Avatar
            </button>
            <button onClick={onClose} className="action-btn dark:border-gray-700 !w-full sm:!w-auto sm:!px-6">
              Back
            </button>
          </div>
        </div>
    </ModalWrapper>
  );
};