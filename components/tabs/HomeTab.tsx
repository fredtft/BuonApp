
import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Refrigerator, ShoppingBasket, Heart, Clock, Flame, ChefHat, Filter, ChevronDown, ChevronUp, Check, Star, X, Search, List, Timer, Sparkles } from 'lucide-react';
import { Recipe, AppState, DietTag, TAG_LABELS, DietConstraintState, INDICATORS_CONFIG } from '../../types';
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

  const handleOpenRecipe = (r: Recipe) => {
    setIsOptionsModalOpen(false);
    requestAnimationFrame(() => {
      onRecipeClick(r);
    });
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 pb-48 max-w-6xl mx-auto w-full md:px-8 animate-fade-in">
        <header className="px-6 pt-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg lg:hidden flex items-center justify-center text-white">
              <ChefHat size={18} />
            </div>
            <h1 className="lg:hidden text-xl font-black text-slate-800 tracking-tight">BuonApp</h1>
          </div>
          
          <div className="flex items-center bg-slate-200/50 p-1 rounded-2xl md:w-80 shadow-inner">
            <button onClick={() => setHomeFilterMode('frigo')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all ${homeFilterMode === 'frigo' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}><Refrigerator size={14} /> Frigo</button>
            <button onClick={() => setHomeFilterMode('spesa')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all ${homeFilterMode === 'spesa' ? 'bg-white text-orange-500 shadow-md' : 'text-slate-500'}`}><ShoppingBasket size={14} /> Spesa</button>
          </div>
        </header>

        <div className="px-4 space-y-3">
          {/* Pannello Filtri */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between px-5 py-4">
              <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="flex items-center gap-3 active:scale-95 transition-all">
                <div className={`p-2 rounded-xl transition-colors ${isFiltersOpen ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                  <Filter size={16} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filtra per stile</span>
                  <span className="text-xs font-black text-slate-800">Personalizza Suggerimento</span>
                </div>
                {isFiltersOpen ? <ChevronUp size={14} className="text-slate-400 ml-1" /> : <ChevronDown size={14} className="text-slate-400 ml-1" />}
              </button>
              <button 
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm ${onlyFavorites ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-50 text-slate-400 border border-transparent opacity-60'}`}
              >
                <Star size={12} fill={onlyFavorites ? "currentColor" : "none"} /> Preferiti
              </button>
            </div>
            
            {isFiltersOpen && (
              <div className="px-5 pb-5 bg-slate-50/30 animate-fade-in border-t border-slate-50 pt-4">
                <p className="text-[9px] font-black uppercase mb-4 px-1 text-slate-400 text-center tracking-widest">
                  Stato: <span className="text-emerald-500">SI</span> • <span className="text-slate-900">MUST</span> • <span className="text-red-500">NO</span>
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(TAG_LABELS) as DietTag[]).map(tag => {
                    const s = localConstraints[tag];
                    return (
                      <button 
                        key={tag} 
                        onClick={() => toggleLocalConstraint(tag)}
                        className={`px-0.5 py-3.5 rounded-2xl border flex flex-col items-center justify-center transition-all shadow-sm ${
                          s === 1 ? 'bg-slate-900 text-white border-slate-900' : 
                          s === -1 ? 'bg-red-500 text-white border-red-500' : 
                          'bg-white border-slate-200 text-slate-500 opacity-80'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase text-center whitespace-nowrap truncate w-full px-1">{TAG_LABELS[tag].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Hero Card */}
          {heroRecipe ? (
            <div className="relative group cursor-pointer" onClick={() => onRecipeClick(heroRecipe)}>
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-slate-50 flex flex-col md:flex-row gap-8 items-center overflow-hidden transition-transform group-active:scale-[0.98]">
                <button 
                  onClick={(e) => { e.stopPropagation(); rollHero(); }} 
                  className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-400 active:scale-90 transition-all hover:text-emerald-500 active:rotate-180 z-10"
                >
                  <RefreshCw size={20} />
                </button>
                
                <div className="flex-1 space-y-5 w-full">
                  <div className="flex items-center gap-2">
                    {state.favoriteRecipes.includes(heroRecipe.id) && <Star size={16} className="text-amber-400 fill-amber-400" />}
                  </div>
                  
                  <h2 className="text-3xl md:text-5xl font-black text-slate-800 leading-[1.1] tracking-tight">{heroRecipe.name}</h2>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {heroRecipe.tags.slice(0, 4).map(tag => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-[12px] text-slate-400 font-black uppercase tracking-wider">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                      <Clock size={16} className="text-blue-400"/> 
                      <span>{heroRecipe.prepTime} min</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                      <Flame size={16} className="text-orange-400"/> 
                      <span>{heroRecipe.nutrition.calories} kcal</span>
                    </div>
                  </div>

                  <div className="pt-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    Dettagli ricetta <ArrowRight size={14} />
                  </div>
                </div>
                
                <div className="hidden lg:flex w-80 h-80 bg-slate-50 rounded-[3.5rem] items-center justify-center border-4 border-white shadow-inner relative">
                  <ChefHat className="text-slate-100" size={160} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-16 shadow-sm border border-dashed border-slate-200 text-center animate-fade-in flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <Search size={32} />
              </div>
              <div>
                <p className="text-slate-800 text-lg font-black mb-1">Nessuna ricetta trovata</p>
                <p className="text-slate-400 font-medium text-sm leading-relaxed italic max-w-xs mx-auto text-center">
                  {onlyFavorites ? "Non hai ricette preferite che rispettano questi filtri." : "I filtri sono troppo restrittivi per la tua dispensa attuale."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar Flottante */}
      {candidates.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-6 pointer-events-none z-40 lg:absolute lg:bottom-12">
          <button 
            onClick={() => setIsOptionsModalOpen(true)}
            className="group pointer-events-auto flex items-center gap-4 bg-slate-900 text-white pl-6 pr-5 py-4 rounded-3xl shadow-2xl shadow-slate-900/40 active:scale-95 transition-all animate-fade-in"
          >
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] mb-1">Pasto Consigliato</span>
              <span className="text-sm font-black uppercase tracking-widest">{candidates.length} Opzioni</span>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
              <ArrowRight size={20} />
            </div>
          </button>
        </div>
      )}

      {/* Modale Suggerimenti - Versione Compatta */}
      <Modal 
        isOpen={isOptionsModalOpen} 
        onClose={() => setIsOptionsModalOpen(false)} 
        title="Suggerimenti Pasti"
      >
        <div className="flex flex-col gap-3 pb-6 sm:pb-0">
          <div className="px-1 flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ispirazione per te</span>
            </div>
            <span className="text-[9px] font-bold text-slate-300 italic">{candidates.length} trovate</span>
          </div>
          
          <div className="space-y-2">
            {candidates.map(r => {
              const isCookable = r.ingredients.every(id => state.inventory.includes(id));
              const isFav = state.favoriteRecipes.includes(r.id);
              return (
                <div key={r.id} onClick={() => handleOpenRecipe(r)} className="bg-white py-3 px-4 rounded-2xl border border-slate-100 flex gap-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden cursor-pointer group">
                  <div className={`w-1.5 h-full absolute left-0 top-0 transition-all group-hover:w-2.5 ${isCookable ? 'bg-emerald-500' : 'bg-orange-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0 flex-1">
                        <h3 className="font-black text-slate-800 text-sm leading-tight truncate mb-1">{r.name}</h3>
                        <div className="flex flex-wrap gap-1">
                          {r.tags.slice(0, 3).map(tag => (
                            <TagBadge key={tag} tag={tag} />
                          ))}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); onToggleFavorite(r.id); }} className={`p-2 transition-all active:scale-150 shrink-0 ${isFav ? 'text-red-500' : 'text-slate-200 hover:text-red-300'}`}><Heart size={18} fill={isFav ? "currentColor" : "none"} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                <Search size={40} />
              </div>
              <p className="text-slate-400 font-bold italic text-sm">Nessuna ricetta disponibile.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
