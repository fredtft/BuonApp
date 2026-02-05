
import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Refrigerator, ShoppingBasket, Heart, Clock, Flame, ChefHat, Filter, ChevronDown, ChevronUp, Star, Search, Sparkles } from 'lucide-react';
import { Recipe, AppState, DietTag, TAG_LABELS, DietConstraintState } from '../../types';
import { validateRecipeByMatrix } from '../../App';
import TagBadge from '../TagBadge';
import Modal from '../Modal';

export const HomeTab: React.FC<{ 
  state: AppState; 
  onRecipeClick: (r: Recipe) => void; 
  homeFilterMode: 'frigo' | 'spesa'; 
  setHomeFilterMode: (m: 'frigo' | 'spesa') => void; 
  onToggleFavorite: (id: string) => void;
  isOptionsModalOpen: boolean;
  setIsOptionsModalOpen: (open: boolean) => void;
}> = ({ state, onRecipeClick, homeFilterMode, setHomeFilterMode, onToggleFavorite, isOptionsModalOpen, setIsOptionsModalOpen }) => {
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [localConstraints, setLocalConstraints] = useState<Record<DietTag, DietConstraintState>>(() => {
    const hour = new Date().getHours();
    return hour < 15 ? { ...state.userPreferences.dietMatrix.lunch } : { ...state.userPreferences.dietMatrix.dinner };
  });

  useEffect(() => {
    const hour = new Date().getHours();
    const currentMealMatrix = hour < 15 ? state.userPreferences.dietMatrix.lunch : state.userPreferences.dietMatrix.dinner;
    setLocalConstraints({ ...currentMealMatrix });
  }, [state.userPreferences.dietMatrix]);

  const candidates = useMemo(() => {
    let list = state.recipes;
    if (homeFilterMode === 'frigo') {
      list = list.filter(r => r.ingredients.every(id => state.inventory.includes(id)));
    }
    list = list.filter(r => validateRecipeByMatrix(r, localConstraints));
    if (onlyFavorites) {
      list = list.filter(r => state.favoriteRecipes.includes(r.id));
    }
    
    return [...list].sort((a, b) => {
      const aCookable = a.ingredients.every(id => state.inventory.includes(id));
      const bCookable = b.ingredients.every(id => state.inventory.includes(id));
      if (aCookable !== bCookable) return aCookable ? -1 : 1;
      const aFav = state.favoriteRecipes.includes(a.id) ? 1 : 0;
      const bFav = state.favoriteRecipes.includes(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a.prepTime - b.prepTime;
    });
  }, [state.recipes, homeFilterMode, state.inventory, localConstraints, onlyFavorites, state.favoriteRecipes]);

  useEffect(() => {
    if (homeFilterMode === 'frigo' && candidates.length === 0 && state.recipes.length > 0) {
      setHomeFilterMode('spesa');
    }
  }, [candidates.length, homeFilterMode, state.recipes.length, setHomeFilterMode]);

  const rollHero = () => {
    if (candidates.length > 0) {
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      setHeroRecipe(random);
    } else {
      setHeroRecipe(null);
    }
  };

  useEffect(() => { rollHero(); }, [candidates]);

  const toggleLocalConstraint = (tag: DietTag) => {
    setLocalConstraints(prev => {
      const current = prev[tag];
      let next: DietConstraintState = 0;
      if (current === 0) next = 1;
      else if (current === 1) next = -1;
      else next = 0;
      return { ...prev, [tag]: next };
    });
  };

  return (
    <div className="relative h-full flex flex-col safe-p-top">
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 pb-48 max-w-6xl mx-auto w-full md:px-8">
        <header className="px-6 pt-4 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg lg:hidden flex items-center justify-center text-white">
              <ChefHat size={18} />
            </div>
            <h1 className="lg:hidden text-xl font-black text-slate-800 tracking-tight">BuonApp</h1>
          </div>
          
          <div className="flex items-center bg-slate-200/50 p-1 rounded-2xl md:w-80 shadow-inner">
            <button onClick={() => setHomeFilterMode('frigo')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${homeFilterMode === 'frigo' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}><Refrigerator size={14} /> Frigo</button>
            <button onClick={() => setHomeFilterMode('spesa')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${homeFilterMode === 'spesa' ? 'bg-white text-orange-500 shadow-md' : 'text-slate-500'}`}><ShoppingBasket size={14} /> Spesa</button>
          </div>
        </header>

        <div className="px-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="flex items-center gap-3 active:scale-95 transition-all">
                <div className={`p-2 rounded-xl transition-colors ${isFiltersOpen ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                  <Filter size={16} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Stile Pasto</span>
                  <span className="text-xs font-black text-slate-800">Filtra Suggerimenti</span>
                </div>
                {isFiltersOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>
              <button onClick={() => setOnlyFavorites(!onlyFavorites)} className={`p-2.5 rounded-2xl transition-all shadow-sm ${onlyFavorites ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-50 text-slate-300'}`}>
                <Star size={18} fill={onlyFavorites ? "currentColor" : "none"} />
              </button>
            </div>
            
            {isFiltersOpen && (
              <div className="px-4 pb-5 bg-slate-50/50 animate-fade-in border-t border-slate-50 pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(TAG_LABELS) as DietTag[]).map(tag => {
                    const s = localConstraints[tag];
                    return (
                      <button key={tag} onClick={() => toggleLocalConstraint(tag)} className={`px-2 py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${s === 1 ? 'bg-slate-900 text-white border-slate-900' : s === -1 ? 'bg-red-500 text-white border-red-500' : 'bg-white border-slate-200 text-slate-500'}`}>
                        <span className="text-[10px] font-black uppercase text-center truncate w-full">{TAG_LABELS[tag].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {heroRecipe ? (
            <div className="relative group cursor-pointer" onClick={() => onRecipeClick(heroRecipe)}>
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-[2.5rem] blur opacity-10" />
              <div className="relative bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-slate-50 flex flex-col gap-6 items-center overflow-hidden transition-transform active:scale-[0.98]">
                <button onClick={(e) => { e.stopPropagation(); rollHero(); }} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 active:rotate-180 transition-all z-10"><RefreshCw size={18} /></button>
                <div className="flex-1 space-y-4 w-full">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-800 leading-tight tracking-tight">{heroRecipe.name}</h2>
                  <div className="flex flex-wrap gap-1">{heroRecipe.tags.slice(0, 3).map(tag => <TagBadge key={tag} tag={tag} />)}</div>
                  <div className="flex items-center gap-4 text-[12px] text-slate-400 font-black uppercase">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Clock size={14} className="text-blue-400"/> <span>{heroRecipe.prepTime}m</span></div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Flame size={14} className="text-orange-400"/> <span>{heroRecipe.nutrition.calories} kcal</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] py-20 px-6 border-2 border-dashed border-slate-100 text-center animate-fade-in flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><Search size={24} /></div>
              <p className="text-slate-400 font-bold italic text-sm">Nessuna ricetta trovata con questi filtri.</p>
            </div>
          )}
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-6 pointer-events-none z-[40]">
          <button onClick={() => setIsOptionsModalOpen(true)} className="pointer-events-auto flex items-center gap-4 bg-slate-900 text-white pl-6 pr-5 py-4 rounded-3xl shadow-2xl active:scale-95 transition-all">
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest mb-1">Pasto Suggerito</span>
              <span className="text-xs font-black uppercase tracking-widest">{candidates.length} Opzioni</span>
            </div>
            <div className="w-9 h-9 bg-white/10 rounded-2xl flex items-center justify-center"><ArrowRight size={18} /></div>
          </button>
        </div>
      )}

      <Modal isOpen={isOptionsModalOpen} onClose={() => setIsOptionsModalOpen(false)} title="Suggerimenti Pasti">
        <div className="space-y-3 pb-6">
          <div className="px-1 flex items-center gap-2 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Sparkles size={14} className="text-emerald-500" /> Ispirazione per te</div>
          {candidates.map(r => (
            <div key={r.id} onClick={() => { setIsOptionsModalOpen(false); setTimeout(() => onRecipeClick(r), 100); }} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden cursor-pointer group">
              <div className={`w-1.5 h-full absolute left-0 top-0 ${r.ingredients.every(id => state.inventory.includes(id)) ? 'bg-emerald-500' : 'bg-orange-300'}`} />
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-800 text-sm leading-tight truncate mb-1">{r.name}</h3>
                <div className="flex flex-wrap gap-1">{r.tags.slice(0, 2).map(tag => <TagBadge key={tag} tag={tag} />)}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); onToggleFavorite(r.id); }} className={`p-2 transition-all ${state.favoriteRecipes.includes(r.id) ? 'text-red-500' : 'text-slate-200'}`}><Heart size={18} fill={state.favoriteRecipes.includes(r.id) ? "currentColor" : "none"} /></button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
