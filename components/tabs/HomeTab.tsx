
import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Refrigerator, ShoppingBasket, Heart, Clock, Flame, ChefHat } from 'lucide-react';
import { Recipe, AppState } from '../../types';
import { validateRecipeByMatrix } from '../../App';
import TagBadge from '../TagBadge';

interface Props {
  state: AppState;
  onRecipeClick: (r: Recipe) => void;
  homeFilterMode: 'frigo' | 'spesa';
  setHomeFilterMode: (m: 'frigo' | 'spesa') => void;
  onToggleFavorite: (id: string) => void;
}

export const HomeTab: React.FC<Props> = ({ 
  state, onRecipeClick, homeFilterMode, setHomeFilterMode, onToggleFavorite 
}) => {
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null);

  const candidates = useMemo(() => {
    let list = state.recipes;
    if (homeFilterMode === 'frigo') {
      list = list.filter(r => r.ingredients.every(iId => state.inventory.includes(iId)));
    }
    const hour = new Date().getHours();
    const constraints = hour < 15 ? state.userPreferences.dietMatrix.lunch : state.userPreferences.dietMatrix.dinner;
    return list.filter(r => validateRecipeByMatrix(r, constraints));
  }, [state.recipes, homeFilterMode, state.inventory, state.userPreferences.dietMatrix]);

  useEffect(() => {
    if (candidates.length > 0) {
      const favs = candidates.filter(c => state.favoriteRecipes.includes(c.id));
      const pool = favs.length > 0 ? favs : candidates;
      setHeroRecipe(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      setHeroRecipe(null);
    }
  }, [candidates, state.favoriteRecipes]);

  return (
    <div className="flex flex-col gap-4 pb-32 md:pb-12 max-w-6xl mx-auto w-full md:px-8 animate-fade-in">
      <header className="px-6 pt-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="md:hidden text-xl font-black text-emerald-600 tracking-tight text-center">BuonApp</h1>
        <div className="flex items-center bg-slate-200/50 p-1 rounded-2xl md:w-80 shadow-inner">
          <button onClick={() => setHomeFilterMode('frigo')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all ${homeFilterMode === 'frigo' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}>
            <Refrigerator size={14} /> Frigo
          </button>
          <button onClick={() => setHomeFilterMode('spesa')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all ${homeFilterMode === 'spesa' ? 'bg-white text-orange-500 shadow-md' : 'text-slate-500'}`}>
            <ShoppingBasket size={14} /> Spesa
          </button>
        </div>
      </header>
      
      <div className="px-4">
        {heroRecipe ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-[2rem] blur opacity-10" />
            <div className="relative bg-white rounded-[2rem] p-5 md:p-10 shadow-xl border border-slate-50 flex flex-col md:flex-row gap-6 items-center overflow-hidden">
              <button 
                onClick={() => setHeroRecipe(candidates[Math.floor(Math.random() * candidates.length)])} 
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-400 active:scale-90 transition-all active:rotate-45"
              >
                <RefreshCw size={18} />
              </button>
              <div className="flex-1 space-y-3 w-full">
                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">Suggerimento</span>
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
        ) : (
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-dashed border-slate-200 text-center">
            <ChefHat className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-bold italic">Nessuna ricetta disponibile con questi filtri.</p>
          </div>
        )}
      </div>

      <div className="px-6 text-center py-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In base al tuo frigo e alla matrice pasti</p>
      </div>
    </div>
  );
};
