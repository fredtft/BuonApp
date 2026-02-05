
import React, { useMemo, useState } from 'react';
import { Refrigerator, Plus, Pencil, Check, Search, Heart } from 'lucide-react';
import { Ingredient, AppState, DietTag, IngredientCategory } from '../../types';
import { CATEGORY_LABELS, INDICATORS_CONFIG } from '../../constants';
import Icon from '../Icon';

interface Props {
  state: AppState;
  isEditMode: boolean;
  setIsEditMode: (m: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onIngredientClick: (ing: Ingredient) => void;
  onNewIngredient: () => void;
  activeIngredientTags: DietTag[];
  setActiveIngredientTags: React.Dispatch<React.SetStateAction<DietTag[]>>;
  onToggleFavorite: (id: string) => void;
}

export const InventoryTab: React.FC<Props> = ({ 
  state, isEditMode, setIsEditMode, searchQuery, setSearchQuery, 
  onIngredientClick, onNewIngredient, activeIngredientTags, setActiveIngredientTags,
  onToggleFavorite
}) => {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const grouped = useMemo(() => (state.ingredients || []).reduce((acc, ing) => {
    if (!acc[ing.category]) acc[ing.category] = [];
    acc[ing.category].push(ing);
    return acc;
  }, {} as Record<IngredientCategory, Ingredient[]>), [state.ingredients]);

  const renderIndicators = (tags: DietTag[]) => {
    const relevantTags = tags.filter(tag => INDICATORS_CONFIG[tag]);
    if (relevantTags.length === 0) return null;
    return (
      <div className="absolute top-1 left-1 flex gap-0.5 z-10">
        {relevantTags.map(tag => (
          <div key={tag} className={`w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm ${INDICATORS_CONFIG[tag]?.color}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="pb-32 md:pb-12 max-w-6xl mx-auto w-full md:px-8 animate-fade-in">
      <header className="px-5 pt-4 pb-2.5 sticky top-0 bg-white/95 backdrop-blur-md z-20 shadow-sm flex flex-col gap-2 rounded-b-3xl">
        <div className="flex justify-between items-center">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5"><Refrigerator className="text-emerald-500" size={26}/> Dispensa</h2>
           <div className="flex gap-1.5">
             <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={`p-3 rounded-full transition-all active:scale-90 ${showOnlyFavorites ? 'bg-red-50 text-red-500 shadow-sm border border-red-100' : 'bg-slate-100 text-slate-400'}`}>
               <Heart size={20} fill={showOnlyFavorites ? "currentColor" : "none"} />
             </button>
             <button onClick={onNewIngredient} className="p-3 bg-slate-100 text-slate-500 rounded-full active:bg-emerald-500 active:text-white transition-all"><Plus size={22} /></button>
             <button onClick={() => setIsEditMode(!isEditMode)} className={`p-3 rounded-full transition-all ${isEditMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{isEditMode ? <Check size={22} strokeWidth={3} /> : <Pencil size={22} />}</button>
           </div>
        </div>
        <div className="relative mb-0.5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Cerca ingrediente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all" />
        </div>
        <div className="w-full overflow-x-auto no-scrollbar py-0.5">
          <div className="flex flex-nowrap gap-1.5 whitespace-nowrap min-w-max justify-center mx-auto">
             {Object.entries(INDICATORS_CONFIG).map(([key, config]) => {
               const isActive = activeIngredientTags.includes(key as DietTag);
               return (
                 <div key={key} onClick={() => setActiveIngredientTags(prev => prev.includes(key as DietTag) ? prev.filter(t => t !== key) : [...prev, key as DietTag])} className={`flex items-center gap-1 transition-all px-2 py-0.5 rounded-lg border cursor-pointer active:scale-95 ${isActive ? 'bg-slate-200 border-slate-300 text-slate-800 font-bold' : 'bg-slate-50 border-slate-100 text-slate-400 grayscale-[0.5] opacity-70'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${config?.color} shadow-sm`} />
                    <span className="text-[9px] uppercase font-black tracking-tight">{config?.label}</span>
                 </div>
               );
             })}
          </div>
        </div>
      </header>
      <div className="p-4 space-y-8">
        {(Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map(cat => {
          let items = grouped[cat]?.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
          
          // Filtro Preferiti
          if (showOnlyFavorites) {
            items = items.filter(i => state.favoriteIngredients.includes(i.id));
          }
          
          items = items.filter(i => !i.tags.some(tag => (Object.keys(INDICATORS_CONFIG) as DietTag[]).includes(tag) && !activeIngredientTags.includes(tag)));
          
          if (items.length === 0) return null;
          return (
            <div key={cat} className="animate-fade-in">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" /> {CATEGORY_LABELS[cat]}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {items.sort((a,b)=>a.name.localeCompare(b.name)).map(ing => {
                  const active = state.inventory.includes(ing.id);
                  const isFav = state.favoriteIngredients.includes(ing.id);
                  return (
                    <button key={ing.id} onClick={() => onIngredientClick(ing)} className={`relative flex flex-col items-center justify-center py-4 px-1 rounded-2xl border-2 transition-all duration-200 ${active && !isEditMode ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-[1.03]' : 'bg-white text-slate-500 border-slate-100'} ${isEditMode && 'border-dashed border-emerald-300'}`}>
                      {!isEditMode && renderIndicators(ing.tags)}
                      
                      {/* Favorite Heart Icon Overlay */}
                      {!isEditMode && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); onToggleFavorite(ing.id); }} 
                          className={`absolute top-1 right-1 p-0.5 transition-all active:scale-125 ${isFav ? 'text-red-400' : 'text-slate-200 opacity-30'}`}
                        >
                          <Heart size={12} fill={isFav ? "currentColor" : "none"} />
                        </div>
                      )}

                      <Icon name={ing.icon} size={28} className="mb-2 shrink-0" />
                      <span className="text-[11px] font-bold leading-tight text-center px-1 uppercase tracking-tight line-clamp-2">{ing.name}</span>
                      {isEditMode && <div className="absolute -top-1.5 -right-1.5 bg-white text-slate-400 p-1.5 rounded-full border shadow-md z-10"><Pencil size={10} /></div>}
                    </button>
                  )
                })}
              </div>
            </div>
          );
        })}
        {(showOnlyFavorites && state.favoriteIngredients.length === 0) && (
          <div className="py-20 text-center opacity-40 italic font-medium">Nessun ingrediente preferito.</div>
        )}
      </div>
    </div>
  );
};
