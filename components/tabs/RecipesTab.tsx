
import React, { useMemo, useState } from 'react';
import { ChefHat, Search, Heart, Plus, Timer } from 'lucide-react';
import { Recipe, AppState, DietTag, RecipeCategory } from '../../types';
import { INDICATORS_CONFIG } from '../../constants';
import TagBadge from '../TagBadge';

interface Props {
  state: AppState;
  onRecipeClick: (r: Recipe) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onToggleFavorite: (id: string) => void;
  onNewRecipe: () => void;
}

export const RecipesTab: React.FC<Props> = ({ 
  state, onRecipeClick, searchQuery, setSearchQuery, onToggleFavorite, onNewRecipe 
}) => {
  const [activeRecipeTab, setActiveRecipeTab] = useState<RecipeCategory | 'Tutti'>('Tutti');
  const [activeRecipeTags, setActiveRecipeTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const filteredRecipes = useMemo(() => {
    let list = state.recipes;
    if (searchQuery) list = list.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (showOnlyFavorites) list = list.filter(r => state.favoriteRecipes.includes(r.id));
    if (activeRecipeTab !== 'Tutti') list = list.filter(r => r.category === activeRecipeTab);
    const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
    list = list.filter(r => !r.tags.some(tag => indicatorKeys.includes(tag) && !activeRecipeTags.includes(tag)));
    return list;
  }, [state.recipes, searchQuery, activeRecipeTab, activeRecipeTags, showOnlyFavorites, state.favoriteRecipes]);

  const renderIndicators = (tags: DietTag[]) => {
    const relevantTags = tags.filter(tag => INDICATORS_CONFIG[tag]);
    if (relevantTags.length === 0) return null;
    return (
      <div className="flex flex-col gap-0.5 pr-1 border-r border-slate-100 mr-1.5">
         {relevantTags.map(tag => (
           <div key={tag} className={`w-1.5 h-1.5 rounded-full ${INDICATORS_CONFIG[tag]?.color}`} />
         ))}
      </div>
    );
  };

  return (
    <div className="pb-32 md:pb-12 max-w-6xl mx-auto w-full md:px-8 animate-fade-in">
      <header className="p-5 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-2 rounded-b-3xl">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ChefHat className="text-orange-500" size={26}/> Ricette ({filteredRecipes.length})</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} 
                className={`p-3 rounded-full transition-all active:scale-90 ${showOnlyFavorites ? 'bg-red-50 text-red-500 shadow-sm border border-red-100' : 'bg-slate-100 text-slate-400'}`}
              >
                <Heart size={20} fill={showOnlyFavorites ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={onNewRecipe} 
                className="p-3 bg-slate-100 text-slate-500 rounded-full active:bg-emerald-500 active:text-white transition-all"
              >
                <Plus size={22} />
              </button>
            </div>
        </div>
        <div className="relative mb-0.5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cerca ricetta..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-slate-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all" 
            />
        </div>
        <div className="flex overflow-x-auto gap-1 no-scrollbar justify-center">
           {['Tutti', 'Primi', 'Secondi', 'Veg', 'Street'].map(cat => (
             <button 
                key={cat} 
                onClick={() => setActiveRecipeTab(cat === 'Veg' ? 'Veg & Green' : cat === 'Street' ? 'Street Food' : cat as any)} 
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeRecipeTab === (cat === 'Veg' ? 'Veg & Green' : cat === 'Street' ? 'Street Food' : cat) ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}
             >
                {cat}
             </button>
           ))}
        </div>
      </header>
      
      <div className="p-3 grid grid-cols-1 gap-2.5">
        {filteredRecipes.map(r => {
            const isCookable = r.ingredients.every(id => state.inventory.includes(id));
            const isFav = state.favoriteRecipes.includes(r.id);
            const missing = r.ingredients.filter(id => !state.inventory.includes(id)).length;
            return (
              <div 
                key={r.id} 
                onClick={() => onRecipeClick(r)} 
                className="bg-white p-3.5 rounded-2xl border border-slate-100 flex gap-3.5 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                <div className={`w-1.5 h-full absolute left-0 top-0 transition-colors ${isCookable ? 'bg-emerald-500' : 'bg-orange-300'}`} />
                <div className="flex-1 pl-1.5 space-y-1.5">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center">
                       {renderIndicators(r.tags)}
                       <h3 className="font-bold text-slate-800 text-[15px] leading-tight truncate">{r.name}</h3>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(r.id); }} className={`p-1 transition-all active:scale-125 ${isFav ? 'text-red-500' : 'text-slate-200'}`}>
                       <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                     </button>
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md"><Timer size={12} /> {r.prepTime}m</span>
                      {isCookable ? <span className="text-emerald-600 font-black">Pronto</span> : <span className="text-orange-400 font-black">Mancano {missing}</span>}
                   </div>
                </div>
              </div>
            );
          })}
        {filteredRecipes.length === 0 && (
          <div className="py-20 text-center opacity-40 italic font-medium">Nessuna ricetta trovata.</div>
        )}
      </div>
    </div>
  );
};
