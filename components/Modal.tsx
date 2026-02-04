import React, { useEffect } from 'react';
import { X, Pencil } from 'lucide-react';

const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  onEdit?: () => void;
  children: React.ReactNode 
}> = ({ isOpen, onClose, title, onEdit, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-w-lg sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-transform transform translate-y-0">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
          <h2 className="text-xl font-black text-slate-800 truncate pr-4">{title}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={onEdit} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors">
                <Pencil size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;