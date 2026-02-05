
import React, { useMemo, useState, useEffect } from 'react';
import { ChefHat, Clock, Flame, Dumbbell, Timer, RefreshCw, ArrowRight, Search, X, Check, Heart, ShoppingBasket, Refrigerator, Plus } from 'lucide-react';
import { Recipe, AppState, DietTag, RecipeCategory } from '../../types';
import { INDICATORS_CONFIG } from '../../constants';
import { validateRecipeByMatrix } from '../../App';
import TagBadge from '../TagBadge';
import Icon from '../Icon';

interface Props {
  state: AppState;
  onRecipeClick: (r: Recipe) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  homeFilterMode?: 'frigo' | 'spesa';
  setHomeFilterMode?: (m: 'frigo' | 'spesa') => void;
  onToggleFavorite: (id: string) => void;
  onNewRecipe?: () => void;
  mode: 'home' | 'ricette';
}

export const HomeRecipesTab: React.FC<Props> = ({ 
  state, onRecipeClick, searchQuery, setSearchQuery, mode, 
  homeFilterMode, setHomeFilterMode, onToggleFavorite, onNewRecipe 
}) => {
  const [activeRecipeTab, setActiveRecipeTab] = useState<RecipeCategory | 'Tutti'>('Tutti');
  const [activeRecipeTags, setActiveRecipeTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const filteredRecipes = useMemo(() => {
    let list = state.recipes;
    
    // Filtro Ricerca
    if (searchQuery) {
      list = list.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    // Filtro Preferiti
    if (showOnlyFavorites) {
      list = list.filter(r => state.favoriteRecipes.includes(r.id));
    }

    // Filtro Home (Solo se in modalità Home)
    if (mode === 'home' && homeFilterMode === 'frigo') {
      list = list.filter(r => r.ingredients.every(iId => state.inventory.includes(iId)));
    }

    // Filtri Categoria e Tag (Solo in modalità Ricettario)
    if (mode === 'ricette') {
      if (activeRecipeTab !== 'Tutti') {
        list = list.filter(r => r.category === activeRecipeTab);
      }
      const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
      list = list.filter(r => !r.tags.some(tag => indicatorKeys.includes(tag) && !activeRecipeTags.includes(tag)));
    }
    
    return list;
  }, [state.recipes, searchQuery, activeRecipeTab, activeRecipeTags, showOnlyFavorites, mode, homeFilterMode, state.inventory, state.favoriteRecipes]);

  useEffect(() => {
    if (filteredRecipes.length > 0 && mode === 'home') {
      const hour = new Date().getHours();
      const relevantConstraints = hour < 15 ? state.userPreferences.dietMatrix.lunch : state.userPreferences.dietMatrix.dinner;
      
      let candidates = filteredRecipes;
      
      // Applica la logica della Matrice Pasti per la Hero Recipe
      candidates = candidates.filter(r => validateRecipeByMatrix(r, relevantConstraints));
      
      if (candidates.length === 0) candidates = filteredRecipes;
      
      // Priorità ai preferiti tra i candidati suggeriti
      const favCandidates = candidates.filter(c => state.favoriteRecipes.includes(c.id));
      const pool = favCandidates.length > 0 ? favCandidates : candidates;
      
      setHeroRecipe(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      setHeroRecipe(null);
    }
  }, [filteredRecipes, mode, state.userPreferences.dietMatrix, state.favoriteRecipes]);

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

  if (mode === 'home') {
    return (
      <div className="flex flex-col gap-4 pb-32 md:pb-12 max-w-6xl mx-auto w-full md:px-8 animate-fade-in">
        <header className="px-6 pt-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="md:hidden text-xl font-black text-emerald-600 tracking-tight text-center">BuonApp</h1>
          <div className="flex items-center bg-slate-200/50 p-1 rounded-2xl md:w-80 shadow-inner">
            <button onClick={() => setHomeFilterMode?.('frigo')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all ${homeFilterMode === 'frigo' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}>
              <Refrigerator size={14} /> Frigo
            </button>
            <button onClick={() => setHomeFilterMode?.('spesa')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all ${homeFilterMode === 'spesa' ? 'bg-white text-orange-500 shadow-md' : 'text-slate-500'}`}>
              <ShoppingBasket size={14} /> Spesa
            </button>
          </div>
        </header>
        <div className="px-4">
          {heroRecipe ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-[2rem] blur opacity-10" />
              <div className="relative bg-white rounded-[2rem] p-5 md:p-10 shadow-xl border border-slate-50 flex flex-col md:flex-row gap-6 items-center overflow-hidden">
                <button onClick={() => setHeroRecipe(filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)])} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-400 active:scale-90 transition-all active:rotate-45"><RefreshCw size={18} /></button>
                <div className="flex-1 space-y-3 w-full">
                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">In evidenza</span>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-3xl font-black text-slate-800 leading-tight">{heroRecipe.name}</h2>
                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(heroRecipe.id); }} className={`p-1.5 rounded-full transition-all active:scale-125 ${state.favoriteRecipes.includes(heroRecipe.id) ? 'text-red-500' : 'text-slate-300'}`}>
                      <Heart size={20} fill={state.favoriteRecipes.includes(heroRecipe.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="flex wrap gap-1">{heroRecipe.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} />)}</div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl"><Clock size={14} className="text-blue-400"/> {heroRecipe.prepTime}m</span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl"><Flame size={14} className="text-orange-400"/> {heroRecipe.nutrition.calories} kcal</span>
                  </div>
                  <button onClick={() => onRecipeClick(heroRecipe)} className="w-full md:w-56 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm flex justify-center items-center gap-3 active:scale-95 shadow-lg">Cucina <ArrowRight size={16} /></button>
                </div>
                <div className="hidden md:flex w-64 h-64 bg-slate-50 rounded-[2rem] items-center justify-center border-2 border-slate-100"><ChefHat className="text-slate-200" size={80} /></div>
              </div>
            </div>
          ) : <p className="text-center py-10 opacity-50 font-bold italic">Nessuna ricetta disponibile con questi filtri.</p>}
        </div>
        <div className="px-6 text-center py-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trovate {filteredRecipes.length} ricette</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-12 max-w-6xl mx-auto w-full md:px-8 animate-fade-in">
      <header className="p-5 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-2 rounded-b-3xl">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ChefHat className="text-emerald-500" size={26}/> Ricette ({filteredRecipes.length})</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={`p-3 rounded-full transition-all active:scale-90 ${showOnlyFavorites ? 'bg-red-50 text-red-500 shadow-sm border border-red-100' : 'bg-slate-100 text-slate-400'}`}>
                <Heart size={20} fill={showOnlyFavorites ? "currentColor" : "none"} />
              </button>
              {onNewRecipe && (
                <button onClick={onNewRecipe} className="p-3 bg-slate-100 text-slate-500 rounded-full active:bg-emerald-500 active:text-white transition-all">
                  <Plus size={22} />
                </button>
              )}
            </div>
        </div>
        <div className="relative mb-0.5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Cerca ricetta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all" />
        </div>
        <div className="flex overflow-x-auto gap-1 no-scrollbar justify-center">
           {['Tutti', 'Primi', 'Secondi', 'Veg', 'Street'].map(cat => (
             <button key={cat} onClick={() => setActiveRecipeTab(cat === 'Veg' ? 'Veg & Green' : cat === 'Street' ? 'Street Food' : cat as any)} className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeRecipeTab === (cat === 'Veg' ? 'Veg & Green' : cat === 'Street' ? 'Street Food' : cat) ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{cat}</button>
           ))}
        </div>
      </header>
      <div className="p-3 grid grid-cols-1 gap-2.5">
        {filteredRecipes.map(r => {
            const isCookable = r.ingredients.every(id => state.inventory.includes(id));
            const isFav = state.favoriteRecipes.includes(r.id);
            const missing = r.ingredients.filter(id => !state.inventory.includes(id)).length;
            return (
              <div key={r.id} onClick={() => onRecipeClick(r)} className="bg-white p-3.5 rounded-2xl border border-slate-100 flex gap-3.5 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group">
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
