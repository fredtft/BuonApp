import React, { useEffect, useRef, useState } from 'react';
import { X, Pencil } from 'lucide-react';

const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  onEdit?: () => void;
  children: React.ReactNode 
}> = ({ isOpen, onClose, title, onEdit, children }) => {
  const [translateY, setTranslateY] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      setTranslateY(0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Solo se siamo in cima allo scroll del contenuto
    const scrollContainer = e.currentTarget.querySelector('.modal-scroll-content');
    if (scrollContainer && scrollContainer.scrollTop > 0) return;

    touchStartY.current = e.targetTouches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartY.current === null) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setTranslateY(diff);
      // Preveniamo lo scroll nativo se stiamo chiudendo
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
    touchStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full h-[92vh] sm:h-auto sm:max-w-lg sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-transform duration-200 ease-out"
        style={{ 
          transform: `translateY(${translateY}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle visuale per lo swipe */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-1 shrink-0" />
        
        <div className="p-5 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
          <h2 className="text-xl font-black text-slate-800 truncate pr-4">{title}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={onEdit} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full active:scale-90 transition-transform">
                <Pencil size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 bg-slate-50 text-slate-400 rounded-full active:scale-90 transition-transform">
              <X size={22} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar modal-scroll-content">
          <div className="p-5 pb-12 sm:pb-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;