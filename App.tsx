import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  ChefHat, 
  CalendarDays, 
  Settings, 
  Plus, 
  Search, 
  Check, 
  AlertCircle,
  ShoppingBasket,
  Refrigerator,
  ChevronRight,
  Download,
  Pencil,
  Save,
  Clock,
  Flame,
  Dumbbell,
  Timer,
  RefreshCw,
  Sun,
  Moon,
  ListChecks,
  ArrowRight,
  Zap,
  SlidersHorizontal,
  X
} from 'lucide-react';
import Icon from './components/Icon';
import TagBadge from './components/TagBadge';
import Modal from './components/Modal';
import IngredientEditor from './components/IngredientEditor';
import RecipeEditor from './components/RecipeEditor';

import { 
  Ingredient, 
  Recipe, 
  AppState, 
  ViewMode, 
  DietTag,
  IngredientCategory,
  RecipeCategory,
  MealPlanDay
} from './types';
import { 
  CATEGORY_LABELS, 
  TAG_LABELS,
  INDICATORS_CONFIG 
} from './constants';
import { INITIAL_INGREDIENTS, INITIAL_RECIPES } from './database/index';

// --- Main App ---

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState<ViewMode>('home');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('buonapp_state');
    let loadedState: any = null;
    
    if (saved) {
      try {
        loadedState = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    
    // Default Preferences
    const defaultPreferences = {
      dietMatrix: { lunch: [], dinner: [] },
      batchStrategy: 'Eco' as const
    };

    if (!loadedState) {
      return {
        inventory: [],
        recipes: INITIAL_RECIPES,
        ingredients: INITIAL_INGREDIENTS,
        userPreferences: defaultPreferences,
        mealPlan: []
      };
    }

    const safeIngredients = Array.isArray(loadedState.ingredients) ? loadedState.ingredients : INITIAL_INGREDIENTS;
    const ingredients = (safeIngredients.length < INITIAL_INGREDIENTS.length) ? INITIAL_INGREDIENTS : safeIngredients;

    const safeUserPrefs = loadedState.userPreferences || {};
    const safeDietMatrix = safeUserPrefs.dietMatrix || {};

    return {
      inventory: Array.isArray(loadedState.inventory) ? loadedState.inventory : [],
      recipes: Array.isArray(loadedState.recipes) ? loadedState.recipes : INITIAL_RECIPES,
      ingredients: ingredients,
      userPreferences: {
        batchStrategy: safeUserPrefs.batchStrategy || 'Eco',
        dietMatrix: {
          lunch: Array.isArray(safeDietMatrix.lunch) ? safeDietMatrix.lunch : [],
          dinner: Array.isArray(safeDietMatrix.dinner) ? safeDietMatrix.dinner : []
        }
      },
      mealPlan: Array.isArray(loadedState.mealPlan) ? loadedState.mealPlan : []
    };
  });

  // Home Specific State
  const [homeFilterMode, setHomeFilterMode] = useState<'frigo' | 'spesa'>('frigo');
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null);
  const [showRecipeListModal, setShowRecipeListModal] = useState(false);

  // Inventory Specific State
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isNewIngredient, setIsNewIngredient] = useState(false);
  const [activeIngredientTags, setActiveIngredientTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);

  // Recipes Specific State
  const [activeRecipeTab, setActiveRecipeTab] = useState<RecipeCategory | 'Tutti'>('Tutti');
  const [isRecipeEditMode, setIsRecipeEditMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isNewRecipe, setIsNewRecipe] = useState(false);
  const [activeRecipeTags, setActiveRecipeTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);

  // Batch Specific State
  const [batchDays, setBatchDays] = useState(3);
  const [batchMeals, setBatchMeals] = useState<'lunch' | 'dinner' | 'both'>('both');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('buonapp_state', JSON.stringify(state));
  }, [state]);

  // Logic: Filter Recipes (Home)
  const filteredRecipes = useMemo(() => {
    let list = state.recipes;
    if (searchQuery && activeTab === 'ricette') {
      list = list.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeTab === 'home' && homeFilterMode === 'frigo') {
      list = list.filter(r => {
        const missing = r.ingredients.filter(iId => !state.inventory.includes(iId));
        return missing.length === 0;
      });
    }
    return list;
  }, [state.recipes, state.inventory, searchQuery, activeTab, homeFilterMode]);

  // Logic: Select Hero Recipe
  useEffect(() => {
    if (filteredRecipes.length > 0) {
      const hour = new Date().getHours();
      const isLunchTime = hour < 15;
      const relevantTags = isLunchTime ? state.userPreferences.dietMatrix.lunch : state.userPreferences.dietMatrix.dinner;
      let candidates = filteredRecipes;
      if (relevantTags && relevantTags.length > 0) {
         candidates = candidates.filter(r => relevantTags.every(tag => r.tags.includes(tag)));
      }
      if (candidates.length === 0) candidates = filteredRecipes;
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      setHeroRecipe(random);
    } else {
      setHeroRecipe(null);
    }
  }, [filteredRecipes.length, homeFilterMode, state.userPreferences.dietMatrix]);

  const toggleInventoryStatus = (id: string) => {
    setState(prev => {
      const exists = prev.inventory.includes(id);
      return {
        ...prev,
        inventory: exists 
          ? prev.inventory.filter(i => i !== id) 
          : [...prev.inventory, id]
      };
    });
  };

  const handleIngredientClick = (ing: Ingredient) => {
    if (isEditMode) {
      setEditingIngredient(ing);
      setIsNewIngredient(false);
    } else {
      toggleInventoryStatus(ing.id);
    }
  };

  const saveIngredient = (ing: Ingredient) => {
    setState(prev => {
      let newIngredients = [...prev.ingredients];
      if (isNewIngredient) {
         if (newIngredients.some(i => i.id === ing.id)) {
           ing.id = `${ing.id}_${Math.random().toString(36).substr(2, 5)}`;
         }
         newIngredients.push(ing);
      } else {
         newIngredients = newIngredients.map(i => i.id === ing.id ? ing : i);
      }
      return { ...prev, ingredients: newIngredients };
    });
    setEditingIngredient(null);
    setIsNewIngredient(false);
  };

  const deleteIngredient = (id: string) => {
    setState(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i.id !== id),
      inventory: prev.inventory.filter(i => i !== id)
    }));
    setEditingIngredient(null);
    setIsNewIngredient(false);
  };

  const saveRecipe = (recipe: Recipe) => {
    setState(prev => {
      let newRecipes = [...prev.recipes];
      if (isNewRecipe) {
        if (newRecipes.some(r => r.id === recipe.id)) {
           recipe.id = `${recipe.id}_${Math.random().toString(36).substr(2, 5)}`;
        }
        newRecipes.push(recipe);
      } else {
        newRecipes = newRecipes.map(r => r.id === recipe.id ? recipe : r);
      }
      return { ...prev, recipes: newRecipes };
    });
    setEditingRecipe(null);
    setIsNewRecipe(false);
  };

  const deleteRecipe = (id: string) => {
     setState(prev => ({
       ...prev,
       recipes: prev.recipes.filter(r => r.id !== id)
     }));
     setEditingRecipe(null);
     setIsNewRecipe(false);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setEditingRecipe(recipe); 
    setIsNewRecipe(false);
    setIsRecipeEditMode(false); 
  };

  const generatePlan = () => {
    setIsGeneratingBatch(true);
    setTimeout(() => {
      const plan: MealPlanDay[] = [];
      const historyIngredients: Set<string> = new Set();
      const getScore = (recipe: Recipe, mealType: 'lunch' | 'dinner') => {
        let score = 100;
        const constraints = state.userPreferences.dietMatrix[mealType];
        if (constraints.some(tag => !recipe.tags.includes(tag))) return -1000;
        if (state.userPreferences.batchStrategy === 'Eco') {
           const owned = recipe.ingredients.filter(id => state.inventory.includes(id)).length;
           const total = recipe.ingredients.length;
           score += (owned / (total || 1)) * 50;
        }
        const relevantCats: IngredientCategory[] = ['proteine', 'verdure', 'surgelati'];
        const significantIngredients = recipe.ingredients.filter(id => {
           const ing = state.ingredients.find(i => i.id === id);
           return ing && relevantCats.includes(ing.category);
        });
        const overlap = significantIngredients.filter(id => historyIngredients.has(id)).length;
        if (overlap > 0) score -= 60;
        score += Math.random() * 20;
        return score;
      };
      for (let d = 1; d <= batchDays; d++) {
        let lunch: Recipe | null = null;
        let dinner: Recipe | null = null;
        if (batchMeals === 'lunch' || batchMeals === 'both') {
           const candidates = state.recipes.map(r => ({ r, score: getScore(r, 'lunch') })).filter(x => x.score > 0).sort((a,b) => b.score - a.score);
           if (candidates.length > 0) {
              lunch = candidates[0].r;
              lunch.ingredients.forEach(id => historyIngredients.add(id));
           }
        }
        if (batchMeals === 'dinner' || batchMeals === 'both') {
           const candidates = state.recipes.map(r => ({ r, score: getScore(r, 'dinner') })).filter(x => x.score > 0).filter(x => x.r.id !== lunch?.id).sort((a,b) => b.score - a.score);
           if (candidates.length > 0) {
              dinner = candidates[0].r;
              dinner.ingredients.forEach(id => historyIngredients.add(id));
           }
        }
        plan.push({ dayIndex: d, lunch, dinner });
      }
      setState(prev => ({ ...prev, mealPlan: plan }));
      setIsGeneratingBatch(false);
    }, 600);
  };

  const getShoppingList = () => {
    const need: Record<string, boolean> = {};
    state.mealPlan.forEach(day => {
       [day.lunch, day.dinner].forEach(r => { if(r) r.ingredients.forEach(id => { if(!state.inventory.includes(id)) need[id] = true; }); });
    });
    return Object.keys(need);
  };

  const renderIndicators = (tags: DietTag[], type: 'ingredient' | 'recipe' = 'ingredient') => {
    const relevantTags = tags.filter(tag => INDICATORS_CONFIG[tag]);
    if (relevantTags.length === 0) return null;

    if (type === 'ingredient') {
      return (
        <div className="absolute top-1.5 left-1.5 flex gap-1 z-10">
          {relevantTags.map(tag => {
            const ind = INDICATORS_CONFIG[tag];
            return (
              <div 
                key={tag} 
                className={`w-2.5 h-2.5 rounded-full border border-white shadow-sm ${ind?.color}`}
                title={ind?.label}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 pr-1 border-r-2 border-slate-100">
         {relevantTags.map(tag => {
           const ind = INDICATORS_CONFIG[tag];
           return (
             <div 
               key={tag} 
               className={`w-1.5 h-1.5 rounded-full ${ind?.color}`}
               title={ind?.label}
             />
           );
         })}
      </div>
    );
  };

  const renderLegend = ({ clickable, activeTags, onToggle }: { clickable: boolean, activeTags?: DietTag[], onToggle?: (t: DietTag) => void }) => (
    <div className="px-6 py-2.5 flex flex-wrap gap-3 justify-center text-[10px] text-slate-400 bg-white/50 border-b border-slate-100">
       {Object.entries(INDICATORS_CONFIG).map(([key, config]) => {
         const isActive = activeTags?.includes(key as DietTag);
         return (
           <div 
            key={key} 
            onClick={() => clickable && onToggle && onToggle(key as DietTag)} 
            className={`flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-full ${clickable ? 'cursor-pointer hover:bg-slate-100' : ''} ${isActive ? 'bg-slate-200 text-slate-800 font-bold scale-105' : 'grayscale-[0.5] opacity-70'}`}
           >
              <div className={`w-2.5 h-2.5 rounded-full ${config?.color} border border-white shadow-sm`}></div>
              {config?.label}
           </div>
         );
       })}
    </div>
  );

  // --- Views ---

  const renderHome = () => (
    <div className="flex flex-col gap-4 pb-28 md:pb-12 max-w-6xl mx-auto w-full md:px-8 h-full">
      <header className="px-6 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="md:hidden">
          <h1 className="text-xl font-black text-emerald-600 tracking-tight">BuonApp</h1>
        </div>
        <div className="flex items-center bg-slate-200/50 p-1 rounded-2xl md:w-80 shadow-inner">
          <button onClick={() => setHomeFilterMode('frigo')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${homeFilterMode === 'frigo' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}>
            <Refrigerator size={14} strokeWidth={2.5} /> Solo Frigo
          </button>
          <button onClick={() => setHomeFilterMode('spesa')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${homeFilterMode === 'spesa' ? 'bg-white text-orange-500 shadow-md' : 'text-slate-500'}`}>
            <ShoppingBasket size={14} strokeWidth={2.5} /> Idee Spesa
          </button>
        </div>
      </header>

      <div className="px-4 md:px-0">
        {heroRecipe ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
            <div className="relative bg-white rounded-[2rem] p-6 md:p-10 shadow-2xl flex flex-col md:flex-row gap-6 md:gap-12 border border-slate-50 items-center overflow-hidden">
              
              <button 
                onClick={() => { const others = filteredRecipes.filter(r => r.id !== heroRecipe.id); if(others.length > 0) setHeroRecipe(others[Math.floor(Math.random() * others.length)]); }}
                className="absolute top-5 right-5 md:top-8 md:right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-100 hover:bg-emerald-50 transition-all z-20 shadow-sm active:scale-90"
                title="Nuova proposta"
              >
                <RefreshCw size={20} />
              </button>

              <div className="flex-1 space-y-4 w-full">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">In evidenza</span>
                     {new Date().getHours() < 15 ? <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg"><Sun size={10}/> Pranzo</span> : <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg"><Moon size={10}/> Cena</span>}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight pr-14">{heroRecipe.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {heroRecipe.tags.slice(0, 4).map(t => <TagBadge key={t} tag={t} />)}
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-400 font-bold">
                  <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"><Clock size={16} className="text-blue-400"/> {heroRecipe.prepTime} min</span>
                  <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"><Flame size={16} className="text-orange-400"/> {heroRecipe.nutrition.calories} kcal</span>
                </div>
                <div className="pt-2 flex gap-3 max-w-sm">
                  <button onClick={() => { setEditingRecipe(heroRecipe); setIsNewRecipe(false); setIsRecipeEditMode(false); }} className="w-full md:w-56 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex justify-center items-center gap-3 active:scale-95">
                    Cucina <ArrowRight size={18} />
                  </button>
                </div>
              </div>
              <div className="hidden md:flex w-72 h-72 bg-slate-50 rounded-[3rem] items-center justify-center border-4 border-double border-slate-100">
                  <ChefHat className="text-slate-200" size={100} strokeWidth={1} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 opacity-50 flex flex-col items-center">
            <Search className="text-slate-200 mb-4" size={48}/>
            <p className="font-bold text-slate-400">Nessuna ricetta disponibile.</p>
          </div>
        )}
      </div>

      <div className="px-6 text-center py-4">
        <button onClick={() => setShowRecipeListModal(true)} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-500 transition-all border-b-2 border-transparent hover:border-emerald-500 pb-1">
          Tutte le ricette disponibili ({filteredRecipes.length})
        </button>
      </div>

      <Modal isOpen={showRecipeListModal} onClose={() => setShowRecipeListModal(false)} title={`Ricette (${filteredRecipes.length})`}>
        <div className="space-y-2">
          {filteredRecipes.map(r => (
            <button key={r.id} onClick={() => { setShowRecipeListModal(false); setEditingRecipe(r); setIsRecipeEditMode(false); }} className="w-full flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-all group text-left border border-transparent hover:border-emerald-100">
              <span className="font-bold text-slate-700 text-sm group-hover:text-emerald-700">{r.name}</span>
              <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-lg shadow-sm">{r.prepTime}m</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );

  const renderInventory = () => {
    const grouped = (state.ingredients || []).reduce((acc, ing) => { if (!acc[ing.category]) acc[ing.category] = []; acc[ing.category].push(ing); return acc; }, {} as Record<IngredientCategory, Ingredient[]>);
    const categories = (Object.keys(CATEGORY_LABELS) as IngredientCategory[]);
    return (
      <div className="pb-28 md:pb-12 max-w-6xl mx-auto w-full md:px-8 h-full flex flex-col">
        <header className="px-6 py-4 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-3 rounded-b-2xl md:rounded-b-3xl">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
               <Refrigerator className="text-emerald-500" size={24} strokeWidth={2.5}/> Il mio Frigo
             </h2>
             <div className="flex gap-2">
               <button onClick={() => { setIsNewIngredient(true); setEditingIngredient({ id: '', name: '', category: 'dispensa', icon: 'Bowl', tags: [] }); }} className="p-3 bg-slate-100 text-slate-500 rounded-full active:bg-emerald-500 active:text-white transition-colors">
                  <Plus size={20} strokeWidth={2.5} />
               </button>
               <button onClick={() => setIsEditMode(!isEditMode)} className={`p-3 rounded-full transition-all active:scale-90 ${isEditMode ? 'bg-slate-800 text-white shadow-lg rotate-12' : 'bg-slate-100 text-slate-500'}`}>
                 {isEditMode ? <Check size={20} strokeWidth={3} /> : <Pencil size={20} />}
               </button>
             </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input type="text" placeholder="Cerca ingrediente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner border border-transparent" />
          </div>
        </header>

        {renderLegend({ clickable: true, activeTags: activeIngredientTags, onToggle: (tag) => { setActiveIngredientTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]) } })}

        <div className="p-4 space-y-8 pt-4 overflow-y-auto no-scrollbar flex-1">
          {categories.map(cat => {
            let items = grouped[cat]?.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
            const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
            items = items.filter(i => !i.tags.some(tag => indicatorKeys.includes(tag) && !activeIngredientTags.includes(tag)));
            items.sort((a, b) => a.name.localeCompare(b.name));
            if (items.length === 0) return null;
            return (
              <div key={cat} className="animate-fade-in">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> {CATEGORY_LABELS[cat]}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-4">
                  {items.map(ing => {
                    const isActive = state.inventory.includes(ing.id);
                    return (
                      <button key={ing.id} onClick={() => handleIngredientClick(ing)} className={`relative flex flex-col items-center justify-center p-1 rounded-2xl aspect-square transition-all duration-200 border-2 ${isActive && !isEditMode ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg scale-[1.04]' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'} ${isEditMode && 'border-dashed border-emerald-300'}`}>
                        {!isEditMode && renderIndicators(ing.tags, 'ingredient')}
                        <Icon name={ing.icon} size={28} className="mb-1.5 shrink-0" />
                        <span className="text-[11px] font-black leading-tight text-center w-full line-clamp-2 px-1">{ing.name}</span>
                        {isActive && !isEditMode && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full animate-pulse shadow-sm"></div>}
                        {isEditMode && <div className="absolute -top-2 -right-2 bg-white text-slate-400 p-1.5 rounded-full border border-slate-100 shadow-md z-10 hover:text-emerald-500"><Pencil size={10} /></div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <Modal isOpen={!!editingIngredient} onClose={() => setEditingIngredient(null)} title={isNewIngredient ? "Nuovo Ingrediente" : "Modifica"}>
          {editingIngredient && <IngredientEditor initialData={editingIngredient} isNew={isNewIngredient} onSave={saveIngredient} onDelete={deleteIngredient} onCancel={() => setEditingIngredient(null)} />}
        </Modal>
      </div>
    );
  };

  const renderRecipes = () => {
    const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
    const displayedRecipes = state.recipes.filter(r => {
        if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (activeRecipeTab !== 'Tutti' && r.category !== activeRecipeTab) return false;
        if (r.tags.some(tag => indicatorKeys.includes(tag) && !activeRecipeTags.includes(tag))) return false;
        return true;
    });
    return (
    <div className="pb-28 md:pb-12 max-w-6xl mx-auto w-full md:px-8 h-full flex flex-col">
      <header className="p-5 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-4 rounded-b-2xl md:rounded-b-3xl">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
               <ChefHat className="text-emerald-500" size={24} strokeWidth={2.5}/> Ricettario ({displayedRecipes.length})
            </h2>
            <button onClick={() => { setIsNewRecipe(true); setEditingRecipe({ id: '', name: '', category: 'Primi', ingredients: [], optionalIngredients: [], tags: [], prepTime: 15, instructions: '', nutrition: { calories: 0, protein: 0 } }); }} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-emerald-500 hover:text-white transition-colors">
               <Plus size={20} strokeWidth={2.5} />
             </button>
        </div>
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input type="text" placeholder="Cerca ricetta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner border border-transparent" />
        </div>
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1 -mx-5 px-5">
           <button onClick={() => setActiveRecipeTab('Tutti')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${activeRecipeTab === 'Tutti' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>Tutti</button>
           {['Primi', 'Secondi', 'Veg', 'Street'].map(cat => (
             <button key={cat} onClick={() => setActiveRecipeTab(cat === 'Veg' ? 'Veg & Green' : cat === 'Street' ? 'Street Food' : cat as RecipeCategory)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${activeRecipeTab === (cat === 'Veg' ? 'Veg & Green' : cat === 'Street' ? 'Street Food' : cat) ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{cat}</button>
           ))}
        </div>
      </header>
      {renderLegend({ clickable: true, activeTags: activeRecipeTags, onToggle: (tag) => { setActiveRecipeTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]) } })}
      <div className="p-4 pt-4 overflow-y-auto no-scrollbar flex-1">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedRecipes.map(r => {
                const isCookable = r.ingredients.every(id => state.inventory.includes(id));
                return (
                  <div key={r.id} onClick={() => handleRecipeClick(r)} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 flex gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all relative overflow-hidden group">
                    <div className={`w-1.5 h-full absolute left-0 top-0 transition-colors ${isCookable ? 'bg-emerald-500' : 'bg-orange-300'}`}></div>
                    <div className="flex-1 pl-1 pr-2 space-y-2">
                       <div className="flex items-center gap-2">
                          {renderIndicators(r.tags, 'recipe')}
                          <h3 className="font-bold text-slate-800 text-[15px] leading-tight group-hover:text-emerald-700 transition-colors">{r.name}</h3>
                       </div>
                       <div className="flex gap-1.5">{r.tags.slice(0, 1).map(t => <TagBadge key={t} tag={t} />)}</div>
                       <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"><Timer size={12} /> {r.prepTime}m</span>
                          {isCookable ? <span className="text-emerald-600 font-black">Pronto</span> : <span className="text-orange-400 font-black">Mancano {r.ingredients.filter(id => !state.inventory.includes(id)).length}</span>}
                       </div>
                    </div>
                  </div>
                );
              })}
         </div>
      </div>
    </div>
    );
  };

  const renderBatch = () => (
    <div className="pb-32 flex flex-col max-w-6xl mx-auto w-full md:px-8 h-full">
      <header className="p-5 bg-white shadow-sm flex justify-between items-center mb-4 rounded-b-2xl md:rounded-b-3xl">
         <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
           <CalendarDays className="text-emerald-500" size={24} strokeWidth={2.5}/> Pianificatore
         </h2>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {state.mealPlan.length === 0 ? (
          <div className="px-5 flex flex-col gap-6 max-w-2xl mx-auto w-full pb-10">
            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 space-y-7">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-3 uppercase tracking-[0.1em] border-b border-slate-50 pb-3"><SlidersHorizontal size={18} className="text-slate-400"/> Configurazione Piano</h3>
              <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-700">Strategia</span>
                  <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
                    <button onClick={() => setState(p => ({...p, userPreferences: {...p.userPreferences, batchStrategy: 'Eco'}}))} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${state.userPreferences.batchStrategy === 'Eco' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>Eco</button>
                    <button onClick={() => setState(p => ({...p, userPreferences: {...p.userPreferences, batchStrategy: 'Variety'}}))} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${state.userPreferences.batchStrategy === 'Variety' ? 'bg-white shadow-md text-purple-600' : 'text-slate-400'}`}>Varietà</button>
                  </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2.5">
                   <span className="font-bold text-slate-700 text-sm">Giorni da pianificare</span>
                   <span className="font-black text-2xl text-emerald-600">{batchDays}</span>
                </div>
                <input type="range" min="1" max="7" value={batchDays} onChange={(e) => setBatchDays(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-emerald-500 cursor-pointer" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                   {['lunch', 'dinner', 'both'].map((m) => (
                     <button key={m} onClick={() => setBatchMeals(m as any)} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${batchMeals === m ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{m === 'lunch' ? 'Pranzo' : m === 'dinner' ? 'Cena' : 'Tutti'}</button>
                   ))}
              </div>
              <button onClick={generatePlan} disabled={isGeneratingBatch} className="w-full bg-slate-900 text-white py-4.5 rounded-[1.5rem] font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-3 text-sm active:scale-95 shadow-xl shadow-slate-200 mt-4 h-14">
                {isGeneratingBatch ? <RefreshCw className="animate-spin" size={20}/> : 'Genera Piano Settimanale'}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 space-y-4 pb-10">
            <div className="flex justify-between items-center px-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Il tuo menu personalizzato</span>
               <button onClick={() => setState(p => ({...p, mealPlan: []}))} className="text-[10px] text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Resetta Tutto</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {state.mealPlan.map((day) => (
                <div key={day.dayIndex} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col relative group hover:border-emerald-200 transition-colors shadow-sm">
                   <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                     <h3 className="font-black text-slate-800 text-sm">Giorno {day.dayIndex}</h3>
                     <span className="text-[10px] font-black text-slate-100 text-4xl select-none leading-none absolute top-4 right-4 group-hover:text-emerald-50 transition-colors">{day.dayIndex}</span>
                   </div>
                   <div className="space-y-2 relative z-10">
                      {day.lunch && <div onClick={() => handleRecipeClick(day.lunch!)} className="flex items-center gap-2.5 p-2 hover:bg-emerald-50 rounded-xl cursor-pointer text-xs transition-colors border border-transparent hover:border-emerald-100"><Sun size={14} className="text-amber-500 shrink-0"/><span className="truncate font-bold text-slate-700">{day.lunch.name}</span></div>}
                      {day.dinner && <div onClick={() => handleRecipeClick(day.dinner!)} className="flex items-center gap-2.5 p-2 hover:bg-indigo-50 rounded-xl cursor-pointer text-xs transition-colors border border-transparent hover:border-indigo-100"><Moon size={14} className="text-indigo-500 shrink-0"/><span className="truncate font-bold text-slate-700">{day.dinner.name}</span></div>}
                   </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 text-slate-300 rounded-[2rem] p-7 shadow-2xl mt-6 relative overflow-hidden">
               <div className="absolute -right-8 -bottom-8 text-emerald-500/10"><ShoppingBasket size={150} /></div>
               <h3 className="font-black text-white text-sm mb-5 flex items-center gap-3 border-b border-slate-700 pb-3 relative z-10 uppercase tracking-[0.2em]"><ShoppingBasket className="text-emerald-400" size={20}/> Lista della Spesa</h3>
               <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs relative z-10 font-medium">
                  {getShoppingList().length === 0 ? <li className="opacity-50 italic py-2">Dispensa completa! Non serve comprare nulla.</li> : getShoppingList().map(id => {
                    const ing = state.ingredients.find(i => i.id === id);
                    return <li key={id} className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className="truncate text-slate-200">{ing?.name || id}</span></li>;
                  })}
               </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderParams = () => {
    const toggleMatrix = (meal: 'lunch' | 'dinner', tag: DietTag) => {
       setState(prev => {
         const current = prev.userPreferences.dietMatrix[meal];
         const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
         return { ...prev, userPreferences: { ...prev.userPreferences, dietMatrix: { ...prev.userPreferences.dietMatrix, [meal]: updated } } };
       });
    };
    return (
      <div className="pb-28 md:pb-12 max-w-6xl mx-auto w-full md:px-8 h-full flex flex-col">
        <header className="p-5 bg-white shadow-sm flex justify-between items-center mb-4 rounded-b-2xl md:rounded-b-3xl">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
             <Settings className="text-slate-400" size={24}/> Parametri & Dati
           </h2>
        </header>
        <div className="px-4 space-y-6 overflow-y-auto no-scrollbar flex-1 pb-10">
          <section>
             <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100">
               <h3 className="text-xs font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-[0.2em] border-b border-slate-50 pb-3"><ListChecks size={20} className="text-emerald-500"/> Matrice Dietetica</h3>
               <div className="overflow-x-auto no-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="p-2.5 text-left text-slate-300 font-black text-[10px] uppercase tracking-widest">Tag Preferenza</th>
                      <th className="p-2.5 text-center w-24 md:w-32"><Sun size={18} className="mx-auto text-amber-500 mb-1"/><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pranzo</span></th>
                      <th className="p-2.5 text-center w-24 md:w-32"><Moon size={18} className="mx-auto text-indigo-500 mb-1"/><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cena</span></th>
                    </tr>
                  </thead>
                  <tbody>
                      {Object.entries(TAG_LABELS).map(([tag, conf]) => (
                        <tr key={tag} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-700 text-sm md:text-base">{conf.label}</td>
                          {['lunch', 'dinner'].map((meal) => {
                              const isActive = state.userPreferences.dietMatrix[meal as 'lunch' | 'dinner'].includes(tag as DietTag);
                              return (
                                <td key={meal} className="p-2 text-center">
                                  <button onClick={() => toggleMatrix(meal as any, tag as any)} className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all mx-auto active:scale-90 ${isActive ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                      {isActive && <Check size={18} strokeWidth={4}/>}
                                  </button>
                                </td>
                              )
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
               </div>
             </div>
          </section>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between gap-6">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Save size={14} className="text-blue-500"/> Backup Locale</h3>
                <p className="text-sm text-slate-500 font-medium">Esporta lo stato corrente dell'app per backup o per migrare su un altro browser.</p>
              </div>
              <button onClick={() => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state)); const dl = document.createElement('a'); dl.setAttribute("href", dataStr); dl.setAttribute("download", `buonapp_backup_${new Date().toISOString().split('T')[0]}.json`); dl.click(); }} className="w-full py-4 bg-slate-50 text-emerald-600 font-black rounded-2xl border-2 border-slate-100 text-xs flex items-center justify-center gap-3 hover:bg-emerald-50 hover:border-emerald-100 transition-all active:scale-95 uppercase tracking-widest">
                <Download size={18} /> Scarica Backup .json
              </button>
            </div>
            <div className="bg-emerald-900 text-emerald-100 rounded-3xl p-8 shadow-2xl border border-emerald-800 text-center flex flex-col justify-center items-center">
               <h3 className="text-3xl font-black mb-1">BuonApp</h3>
               <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em]">Cucina Intelligente</p>
               <div className="h-1 w-12 bg-emerald-500/50 rounded-full my-6"></div>
               <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Versione 0.5.7</p>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderRecipeModal = () => (
    <Modal isOpen={!!editingRecipe} onClose={() => setEditingRecipe(null)} title={isNewRecipe ? "Nuova Ricetta" : editingRecipe?.name || "Ricetta"} onEdit={!isRecipeEditMode && !isNewRecipe ? () => setIsRecipeEditMode(true) : undefined}>
      {editingRecipe && (
        isRecipeEditMode || isNewRecipe ? (
          <RecipeEditor initialData={editingRecipe} isNew={isNewRecipe} allIngredients={state.ingredients} inventory={state.inventory} onSave={saveRecipe} onDelete={deleteRecipe} onCancel={() => setEditingRecipe(null)} />
        ) : (
          <div className="space-y-6 animate-fade-in pb-6">
             <div className="grid grid-cols-3 gap-3">
               <div className="bg-blue-50 p-4 rounded-2xl flex flex-col items-center justify-center text-blue-600 gap-1 border border-blue-100 shadow-sm">
                 <Clock size={20} /><span className="text-xl font-black">{editingRecipe.prepTime}</span><span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Minuti</span>
               </div>
               <div className="bg-orange-50 p-4 rounded-2xl flex flex-col items-center justify-center text-orange-600 gap-1 border border-orange-100 shadow-sm">
                 <Flame size={20} /><span className="text-xl font-black">{editingRecipe.nutrition.calories}</span><span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Kcal</span>
               </div>
               <div className="bg-emerald-50 p-4 rounded-2xl flex flex-col items-center justify-center text-emerald-600 gap-1 border border-emerald-100 shadow-sm">
                 <Dumbbell size={20} /><span className="text-xl font-black">{editingRecipe.nutrition.protein}g</span><span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Prot</span>
               </div>
             </div>
             <div className="flex flex-wrap gap-2 justify-center py-2">
                <TagBadge tag={editingRecipe.category as any} />
                {editingRecipe.tags.map(t => <TagBadge key={t} tag={t} />)}
             </div>
             <div>
               <h3 className="font-black text-slate-800 mb-3 text-xs uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-2 flex items-center gap-2"><ListChecks size={16} className="text-slate-400"/> Ingredienti</h3>
               <ul className="grid grid-cols-1 gap-2">
                 {editingRecipe.ingredients.map(id => {
                   const ing = state.ingredients.find(i => i.id === id);
                   const inStock = state.inventory.includes(id);
                   return (
                     <li key={id} className={`flex items-center justify-between p-3.5 rounded-2xl bg-white border shadow-sm transition-all ${inStock ? 'border-emerald-200 ring-2 ring-emerald-50' : 'border-red-50 bg-red-50/5'}`}>
                       <span className="flex items-center gap-3 font-bold text-slate-700 text-sm truncate">{ing && <div className="p-1.5 bg-slate-50 rounded-xl"><Icon name={ing.icon} size={16} className="text-slate-500"/></div>}<span className="truncate">{ing?.name || id}</span></span>
                       {inStock ? <Check size={18} className="text-emerald-500" strokeWidth={4} /> : <X size={18} className="text-red-300" strokeWidth={4} />}
                     </li>
                   );
                 })}
               </ul>
             </div>
             <div>
               <h3 className="font-black text-slate-800 mb-3 text-xs uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-2 flex items-center gap-2"><ChefHat size={16} className="text-slate-400"/> Procedimento</h3>
               <div className="p-5 bg-slate-50/50 rounded-2xl text-slate-600 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100 shadow-inner font-medium">{editingRecipe.instructions}</div>
             </div>
          </div>
        )
      )}
    </Modal>
  );

  const NavItem = ({ id, icon: IconC, label }: { id: ViewMode; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button onClick={() => { setSearchQuery(''); setActiveTab(id); }} className={`group flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative active:scale-[0.85] ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
        <div className={`px-4 py-2.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-emerald-50 -translate-y-3 shadow-md' : 'bg-transparent'}`}>
          <IconC size={28} strokeWidth={isActive ? 2.5 : 2.2} />
        </div>
        <span className={`text-[9px] font-black tracking-[0.1em] mt-1 transition-opacity absolute bottom-2 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
      </button>
    );
  };

  const DesktopNavItem = ({ id, icon: IconC, label }: { id: ViewMode; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button onClick={() => { setSearchQuery(''); setActiveTab(id); }} className={`w-full flex items-center gap-4 px-6 py-4.5 rounded-2xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-black shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-bold'}`}>
        <IconC size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
        {isActive && <ChevronRight size={18} className="ml-auto opacity-40" />}
      </button>
    );
  };

  return (
    <div className="h-full w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex selection:bg-emerald-200">
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-slate-200 h-full shadow-lg z-50">
           <div className="p-10 pb-8">
               <h1 className="text-4xl font-black text-emerald-600 tracking-tighter flex items-center gap-3">
                 <ChefHat size={38} strokeWidth={2.5}/> BuonApp
               </h1>
               <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 pl-1">Cucina Intelligente</p>
           </div>
           <nav className="flex-1 px-4 py-4 space-y-2.5">
               <DesktopNavItem id="home" icon={Home} label="Dashboard" />
               <DesktopNavItem id="frigo" icon={Refrigerator} label="Dispensa" />
               <DesktopNavItem id="ricette" icon={ChefHat} label="Ricettario" />
               <DesktopNavItem id="batch" icon={CalendarDays} label="Batch Cooking" />
               <DesktopNavItem id="parametri" icon={Settings} label="Parametri" />
           </nav>
           <div className="p-8 border-t border-slate-50">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-[12px] font-black text-slate-500 space-y-3">
                 <div className="flex justify-between items-center"><span className="opacity-60 uppercase tracking-widest">Frigo</span><span className="text-emerald-600 text-lg">{(state.inventory || []).length}/{(state.ingredients || []).length}</span></div>
                 <div className="flex justify-between items-center"><span className="opacity-60 uppercase tracking-widest">Ricette</span><span className="text-emerald-600 text-lg">{(state.recipes || []).length}</span></div>
              </div>
           </div>
      </aside>

      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto no-scrollbar pt-0 md:pt-0">
           {activeTab === 'home' && renderHome()}
           {activeTab === 'frigo' && renderInventory()}
           {activeTab === 'ricette' && renderRecipes()}
           {activeTab === 'batch' && renderBatch()}
           {activeTab === 'parametri' && renderParams()}
        </div>
      </main>

      {renderRecipeModal()}

      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 safe-bottom pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] h-22 px-4 rounded-t-[2.5rem] flex justify-between items-center pb-2">
            <div className="flex-1 h-full"><NavItem id="frigo" icon={Refrigerator} label="FRIGO" /></div>
            <div className="flex-1 h-full"><NavItem id="ricette" icon={ChefHat} label="RICETTE" /></div>
            <div className="w-18 h-full flex items-center justify-center -mt-8">
              <button onClick={() => setActiveTab('home')} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 ${activeTab === 'home' ? 'bg-emerald-500 scale-110 ring-6 ring-slate-50 shadow-emerald-200' : 'bg-slate-800'}`}>
                <Home className="text-white" size={28} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 h-full"><NavItem id="batch" icon={CalendarDays} label="BATCH" /></div>
            <div className="flex-1 h-full"><NavItem id="parametri" icon={Settings} label="PARAM" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}