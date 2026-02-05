
import React, { useMemo, useState } from 'react';
import { Refrigerator, Plus, Pencil, Check, Search, Heart, X } from 'lucide-react';
import { Ingredient, AppState, DietTag, IngredientCategory, CATEGORY_LABELS, INDICATORS_CONFIG } from '../../types';
import Icon from '../Icon';

export const InventoryTab: React.FC<{ 
  state: AppState; isEditMode: boolean; setIsEditMode: (m: boolean) => void; searchQuery: string; setSearchQuery: (q: string) => void; onIngredientClick: (ing: Ingredient) => void; onNewIngredient: () => void; activeIngredientTags: DietTag[]; setActiveIngredientTags: React.Dispatch<React.SetStateAction<DietTag[]>>; onToggleFavorite: (id: string) => void;
}> = ({ state, isEditMode, setIsEditMode, searchQuery, setSearchQuery, onIngredientClick, onNewIngredient, activeIngredientTags, setActiveIngredientTags, onToggleFavorite }) => {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  const grouped = useMemo(() => (state.ingredients || []).reduce((acc, ing) => { 
    if (!acc[ing.category]) acc[ing.category] = []; 
    acc[ing.category].push(ing); 
    return acc; 
  }, {} as Record<IngredientCategory, Ingredient[]>), [state.ingredients]);

  const renderDots = (tags: DietTag[]) => {
    const activeIndicators = tags.filter(t => INDICATORS_CONFIG[t]);
    // Forniamo sempre un contenitore di larghezza fissa (w-2) per allineare le icone
    return (
      <div className="w-2 flex flex-col gap-0.5 shrink-0 items-center justify-center min-h-[14px]">
        {activeIndicators.map(t => (
          <div key={t} className={`w-1 h-1 rounded-full ${INDICATORS_CONFIG[t]?.color}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="pb-32 max-w-6xl mx-auto w-full md:px-8 animate-fade-in">
      <header className="px-5 pt-4 pb-2.5 sticky top-0 bg-white/95 backdrop-blur-md z-20 shadow-sm flex flex-col gap-3 rounded-b-[2.5rem]">
        <div className="flex justify-between items-center">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5"><Refrigerator className="text-emerald-500" size={26}/> Dispensa</h2>
           <div className="flex gap-2">
             <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={`p-3 rounded-full transition-all ${showOnlyFavorites ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-100 text-slate-400'}`}><Heart size={20} fill={showOnlyFavorites ? "currentColor" : "none"} /></button>
             <button onClick={onNewIngredient} className="p-3 bg-slate-100 text-slate-500 rounded-full active:bg-emerald-500 active:text-white transition-all shadow-sm border border-slate-50"><Plus size={22} /></button>
             <button onClick={() => setIsEditMode(!isEditMode)} className={`p-3 rounded-full transition-all shadow-sm ${isEditMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}>{isEditMode ? <Check size={22} strokeWidth={3} /> : <Pencil size={22} />}</button>
           </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Cerca ingrediente..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-12 pr-12 py-2.5 rounded-2xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
              <X size={18} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="flex justify-center overflow-x-auto gap-2 no-scrollbar py-1">
          {Object.entries(INDICATORS_CONFIG).map(([tag, conf]) => {
            const isActive = activeIngredientTags.includes(tag as DietTag);
            return (
              <button 
                key={tag}
                onClick={() => setActiveIngredientTags(prev => isActive ? prev.filter(t => t !== tag) : [...prev, tag as DietTag])}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all whitespace-nowrap ${isActive ? 'bg-orange-50/80 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${conf?.color}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">{conf?.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-4 space-y-6">
        {(Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map(cat => {
          let items = grouped[cat]?.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
          if (showOnlyFavorites) items = items.filter(i => state.favoriteIngredients.includes(i.id));
          
          const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
          items = items.filter(i => !i.tags.some(tag => indicatorKeys.includes(tag) && !activeIngredientTags.includes(tag)));
          
          if (items.length === 0) return null;
          return (
            <div key={cat} className="animate-fade-in">
              <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 flex items-center gap-2.5"><div className="w-1 h-1 rounded-full bg-slate-800" /> {CATEGORY_LABELS[cat]}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {items.sort((a,b)=>a.name.localeCompare(b.name)).map(ing => {
                  const active = state.inventory.includes(ing.id);
                  const isFav = state.favoriteIngredients.includes(ing.id);
                  return (
                    <div key={ing.id} className="relative group">
                      <button 
                        onClick={() => onIngredientClick(ing)} 
                        className={`w-full relative flex flex-row items-center gap-1.5 px-2 py-1.5 rounded-xl border transition-all active:scale-[0.97] overflow-hidden ${active && !isEditMode ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white text-slate-500 border-slate-100'} ${isEditMode && 'border-dashed border-emerald-400'}`}
                      >
                        {renderDots(ing.tags)}
                        <div className="shrink-0 ml-0.5">
                          <Icon name={ing.icon} size={14} className={`${active && !isEditMode ? 'scale-110' : ''}`} />
                        </div>
                        <span className={`flex-1 text-[9px] font-black leading-tight uppercase text-left truncate pr-4 ml-1 ${active && !isEditMode ? 'text-white' : 'text-slate-700'}`}>{ing.name}</span>
                      </button>
                      
                      {!isEditMode && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onToggleFavorite(ing.id); }}
                          className={`absolute top-0 right-0 p-1.5 transition-all active:scale-125 z-10 ${isFav ? 'text-red-500' : 'text-slate-200'}`}
                        >
                          <Heart size={10} fill={isFav ? "currentColor" : "none"} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
