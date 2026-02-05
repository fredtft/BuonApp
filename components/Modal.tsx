
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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') triggerCloseAnimation();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      setTranslateY(0);
      setIsAnimatingOut(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimatingOut) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
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
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (translateY > 100) {
      triggerCloseAnimation();
    } else {
      setTranslateY(0);
    }
    touchStartY.current = null;
  };

  const triggerCloseAnimation = () => {
    setIsAnimatingOut(true);
    setTranslateY(window.innerHeight);
    
    setTimeout(() => {
      onClose();
      setIsAnimatingOut(false);
    }, 200);
  };

  const backdropOpacity = Math.max(0, 1 - translateY / (window.innerHeight * 0.7));

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in"
      style={{ 
        backgroundColor: `rgba(15, 23, 42, ${0.6 * backdropOpacity})`,
        backdropFilter: `blur(${4 * backdropOpacity}px)`,
        pointerEvents: isAnimatingOut ? 'none' : 'auto'
      }}
    >
      <div 
        className="bg-white w-full h-[90dvh] sm:h-auto sm:max-h-[85dvh] sm:max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
        style={{ 
          transform: `translateY(${translateY}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s cubic-bezier(0.32, 0, 0.67, 0)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle for mobile swipe */}
        <div className="sm:hidden w-12 h-1 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white/95 backdrop-blur shrink-0 z-10">
          <h2 className="text-lg font-black text-slate-800 truncate pr-4">{title}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={onEdit} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full active:scale-90 transition-all hover:bg-emerald-100">
                <Pencil size={18} />
              </button>
            )}
            <button onClick={triggerCloseAnimation} className="p-2.5 bg-slate-50 text-slate-400 rounded-full active:scale-90 transition-all hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar modal-scroll-content">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
