
import React, { useMemo, useState } from 'react';
import { ChefHat, Search, Heart, Plus, Timer, Info, X } from 'lucide-react';
import { Recipe, AppState, DietTag, RecipeCategory, INDICATORS_CONFIG } from '../../types';
import TagBadge from '../TagBadge';

export const RecipesTab: React.FC<{ 
  state: AppState; onRecipeClick: (r: Recipe) => void; searchQuery: string; setSearchQuery: (q: string) => void; onToggleFavorite: (id: string) => void; onNewRecipe: () => void;
}> = ({ state, onRecipeClick, searchQuery, setSearchQuery, onToggleFavorite, onNewRecipe }) => {
  const [activeRecipeTab, setActiveRecipeTab] = useState<RecipeCategory | 'Tutti'>('Tutti');
  const [activeRecipeTags, setActiveRecipeTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const filteredRecipes = useMemo(() => {
    let list = [...state.recipes];
    if (searchQuery) list = list.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (showOnlyFavorites) list = list.filter(r => state.favoriteRecipes.includes(r.id));
    if (activeRecipeTab !== 'Tutti') list = list.filter(r => r.category === activeRecipeTab);
    
    const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
    list = list.filter(r => !r.tags.some(tag => indicatorKeys.includes(tag) && !activeRecipeTags.includes(tag)));
    
    // Ordinamento: Disponibilità ingredienti (100% prima) poi Alfabetico (A-Z)
    list.sort((a, b) => {
      const aCookable = a.ingredients.every(id => state.inventory.includes(id));
      const bCookable = b.ingredients.every(id => state.inventory.includes(id));
      
      if (aCookable !== bCookable) return aCookable ? -1 : 1;
      
      return a.name.localeCompare(b.name);
    });
    
    return list;
  }, [state.recipes, searchQuery, activeRecipeTab, activeRecipeTags, showOnlyFavorites, state.favoriteRecipes, state.inventory]);

  const renderDots = (tags: DietTag[]) => {
    const activeIndicators = tags.filter(t => INDICATORS_CONFIG[t]);
    if (activeIndicators.length === 0) return null;
    return (
      <div className="flex gap-0.5 mt-0.5">
        {activeIndicators.map(t => (
          <div key={t} className={`w-1.5 h-1.5 rounded-full ${INDICATORS_CONFIG[t]?.color}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="pb-32 max-w-6xl mx-auto w-full md:px-8 animate-fade-in">
      <header className="p-5 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-3 rounded-b-[2.5rem]">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ChefHat className="text-orange-500" size={26}/> Ricette ({filteredRecipes.length})</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={`p-3 rounded-full transition-all active:scale-90 ${showOnlyFavorites ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-100 text-slate-400'}`}><Heart size={20} fill={showOnlyFavorites ? "currentColor" : "none"} /></button>
              <button onClick={onNewRecipe} className="p-3 bg-slate-100 text-slate-500 rounded-full active:bg-emerald-500 active:text-white transition-all"><Plus size={22} /></button>
            </div>
        </div>
        
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Cerca ricetta..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-12 pr-12 py-2.5 rounded-2xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={18} strokeWidth={3} />
              </button>
            )}
        </div>

        {/* Categorie principali su un'unica riga compatta */}
        <div className="flex gap-1 pt-1">
           {['Tutti', 'Primi', 'Secondi', 'Veg', 'Street'].map(cat => (
             <button key={cat} onClick={() => setActiveRecipeTab(cat === 'Veg' ? 'Veg & Green' : cat === 'Street' ? 'Street Food' : cat as any)} className={`flex-1 whitespace-nowrap px-0.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${activeRecipeTab === (cat === 'Veg' ? 'Veg & Green' : cat === 'Street' ? 'Street Food' : cat) ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{cat}</button>
           ))}
        </div>

        <div className="flex justify-center overflow-x-auto gap-2 no-scrollbar py-1">
          {Object.entries(INDICATORS_CONFIG).map(([tag, conf]) => {
            const isActive = activeRecipeTags.includes(tag as DietTag);
            return (
              <button 
                key={tag}
                onClick={() => setActiveRecipeTags(prev => isActive ? prev.filter(t => t !== tag) : [...prev, tag as DietTag])}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all whitespace-nowrap ${isActive ? 'bg-orange-50/80 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                <div className={`w-1 h-1 rounded-full ${conf?.color}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">{conf?.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-4 grid grid-cols-1 gap-3">
        {filteredRecipes.map(r => {
            const isCookable = r.ingredients.every(id => state.inventory.includes(id));
            const isFav = state.favoriteRecipes.includes(r.id);
            const missing = r.ingredients.filter(id => !state.inventory.includes(id)).length;
            return (
              <div key={r.id} onClick={() => onRecipeClick(r)} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 flex gap-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden cursor-pointer group">
                <div className={`w-2 h-full absolute left-0 top-0 transition-all ${isCookable ? 'bg-emerald-500' : 'bg-orange-300'}`} />
                <div className="flex-1 min-w-0">
                   <div className="flex items-start justify-between">
                     <div className="flex flex-col min-w-0 flex-1">
                        <h3 className="font-black text-slate-800 text-[15px] leading-tight truncate pr-8">{r.name}</h3>
                        {renderDots(r.tags)}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {r.tags.slice(0, 2).map(tag => (
                            <TagBadge key={tag} tag={tag} />
                          ))}
                        </div>
                     </div>
                     <button 
                       onClick={e => { e.stopPropagation(); onToggleFavorite(r.id); }} 
                       className={`absolute top-0 right-0 p-3 transition-all active:scale-150 z-10 ${isFav ? 'text-red-500' : 'text-slate-200'}`}
                     >
                       <Heart size={18} fill={isFav ? "currentColor" : "none"} strokeWidth={3} />
                     </button>
                   </div>
                   <div className="flex items-center gap-3 mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100"><Timer size={12} className="text-blue-400" /> {r.prepTime}m</span>
                      {isCookable ? <span className="text-emerald-600 font-black">Pronto</span> : <span className="text-orange-500 font-black">Mancano {missing}</span>}
                   </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
