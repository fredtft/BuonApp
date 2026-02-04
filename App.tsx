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

    // Defensive migration
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (activeTab === 'home' && e.key.toLowerCase() === 's') {
        setShowRecipeListModal(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab]);

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

  // Logic: Inventory Actions
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

  // --- Planner Logic ---
  const generatePlan = () => {
    setIsGeneratingBatch(true);
    setTimeout(() => {
      const plan: MealPlanDay[] = [];
      const historyIngredients: Set<string> = new Set();
      
      const getScore = (recipe: Recipe, mealType: 'lunch' | 'dinner') => {
        let score = 100;
        const constraints = state.userPreferences.dietMatrix[mealType];
        if (constraints.some(tag => !recipe.tags.includes(tag))) {
           return -1000;
        }
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
        if (overlap > 0) {
           score -= 60;
        }
        score += Math.random() * 20;
        return score;
      };

      for (let d = 1; d <= batchDays; d++) {
        let lunch: Recipe | null = null;
        let dinner: Recipe | null = null;
        if (batchMeals === 'lunch' || batchMeals === 'both') {
           const candidates = state.recipes
             .map(r => ({ r, score: getScore(r, 'lunch') }))
             .filter(x => x.score > 0)
             .sort((a,b) => b.score - a.score);
           if (candidates.length > 0) {
              lunch = candidates[0].r;
              lunch.ingredients.forEach(id => historyIngredients.add(id));
           }
        }
        if (batchMeals === 'dinner' || batchMeals === 'both') {
           const candidates = state.recipes
             .map(r => ({ r, score: getScore(r, 'dinner') }))
             .filter(x => x.score > 0)
             .filter(x => x.r.id !== lunch?.id)
             .sort((a,b) => b.score - a.score);
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
       [day.lunch, day.dinner].forEach(r => {
          if(r) {
             r.ingredients.forEach(id => {
                if(!state.inventory.includes(id)) need[id] = true;
             });
          }
       });
    });
    return Object.keys(need);
  };

  const renderIndicators = (tags: DietTag[]) => {
    return (
      <div className="flex flex-col gap-1">
         {tags.map(tag => {
           const ind = INDICATORS_CONFIG[tag];
           if(!ind) return null;
           if(ind.isSymbol) {
             return <span key={tag} className={`text-[8px] font-black leading-none shadow-sm ${ind.color}`}>€</span>;
           }
           return <div key={tag} className={`w-1.5 h-1.5 rounded-full shadow-sm border border-white ${ind.color}`}></div>;
         })}
      </div>
    );
  };

  const renderLegend = ({ clickable, activeTags, onToggle }: { clickable: boolean, activeTags?: DietTag[], onToggle?: (t: DietTag) => void }) => (
    <div className="px-6 py-2 flex flex-wrap gap-3 justify-center text-[10px] text-slate-400">
       {Object.entries(INDICATORS_CONFIG).map(([key, config]) => {
         const isActive = activeTags?.includes(key as DietTag);
         return (
           <div 
             key={key} 
             onClick={() => clickable && onToggle && onToggle(key as DietTag)}
             className={`flex items-center gap-1 transition-all ${clickable ? 'cursor-pointer select-none px-2 py-1 rounded-lg' : ''} ${isActive ? 'bg-slate-200 text-slate-700 font-bold' : ''}`}
           >
              {config?.isSymbol ? <span className={`font-bold ${config.color}`}>€</span> : <div className={`w-2 h-2 rounded-full ${config?.color}`}></div>}
              {config?.label}
           </div>
         );
       })}
    </div>
  );

  // --- Views ---

  const renderHome = () => (
    <div className="flex flex-col gap-6 pb-28 md:pb-12 max-w-6xl mx-auto w-full md:px-8">
      <header className="px-6 pt-10 pb-4 md:pt-4 md:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="md:hidden">
          <h1 className="text-2xl font-black text-emerald-600 tracking-tight">BuonApp</h1>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl md:w-80">
          <button 
            onClick={() => setHomeFilterMode('frigo')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${homeFilterMode === 'frigo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Refrigerator size={14} strokeWidth={2.5} /> Solo Frigo
          </button>
          <button 
            onClick={() => setHomeFilterMode('spesa')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${homeFilterMode === 'spesa' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ShoppingBasket size={14} strokeWidth={2.5} /> Idee Spesa
          </button>
        </div>
      </header>

      <div className="px-6 md:px-0">
        {heroRecipe ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-[2rem] blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-white rounded-[1.8rem] p-6 md:p-12 shadow-xl flex flex-col md:flex-row gap-8 border border-slate-50 items-center">
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">In evidenza</span>
                     {new Date().getHours() < 15 ? <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md"><Sun size={10}/> Pranzo</span> : <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md"><Moon size={10}/> Cena</span>}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-800 leading-tight">{heroRecipe.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {heroRecipe.tags.map(t => <TagBadge key={t} tag={t} />)}
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><Clock size={18} className="text-blue-400"/> {heroRecipe.prepTime} min</span>
                  <span className="flex items-center gap-1.5"><Flame size={18} className="text-orange-400"/> {heroRecipe.nutrition.calories} kcal</span>
                </div>
                <div className="pt-4 flex gap-3 max-w-sm">
                  <button 
                    onClick={() => {
                      setEditingRecipe(heroRecipe);
                      setIsNewRecipe(false);
                      setIsRecipeEditMode(false);
                    }}
                    className="flex-[2] py-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-300 transition-all flex justify-center items-center gap-2"
                  >
                    Vedi Ricetta <ArrowRight size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      const others = filteredRecipes.filter(r => r.id !== heroRecipe.id);
                      if(others.length > 0) {
                          setHeroRecipe(others[Math.floor(Math.random() * others.length)]);
                      }
                    }}
                    className="flex-1 p-4 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>
              <div className="hidden md:flex w-72 h-72 bg-slate-50 rounded-[3rem] items-center justify-center border-2 border-dashed border-slate-200">
                  <ChefHat className="text-slate-200" size={100} strokeWidth={1} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 opacity-50 flex flex-col items-center">
            <Search className="text-slate-300 mb-4" size={48}/>
            <p className="font-bold text-slate-400">Nessuna ricetta disponibile.</p>
          </div>
        )}
      </div>

      <div className="px-6 text-center py-4">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => setShowRecipeListModal(true)}>
          Premi 'S' o clicca qui per tutte le ricette disponibili ({filteredRecipes.length})
        </p>
      </div>

      <Modal isOpen={showRecipeListModal} onClose={() => setShowRecipeListModal(false)} title={`Ricette Trovate (${filteredRecipes.length})`}>
        <div className="space-y-3">
          {filteredRecipes.map(r => (
            <button key={r.id} onClick={() => { setShowRecipeListModal(false); setEditingRecipe(r); setIsRecipeEditMode(false); }} className="w-full flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-colors group">
              <span className="font-bold text-slate-700 group-hover:text-emerald-700">{r.name}</span>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm">{r.prepTime} min</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );

  const renderInventory = () => {
    const grouped = (state.ingredients || []).reduce((acc, ing) => {
      if (!acc[ing.category]) acc[ing.category] = [];
      acc[ing.category].push(ing);
      return acc;
    }, {} as Record<IngredientCategory, Ingredient[]>);
    const categories = (Object.keys(CATEGORY_LABELS) as IngredientCategory[]);

    return (
      <div className="pb-28 md:pb-12 max-w-6xl mx-auto w-full md:px-8">
        <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-4 rounded-b-3xl">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
               <Refrigerator className="text-emerald-500" size={28} strokeWidth={2.5}/> Il mio Frigo
             </h2>
             <div className="flex gap-2">
               <button onClick={() => { setIsNewIngredient(true); setEditingIngredient({ id: '', name: '', category: 'dispensa', icon: 'Bowl', tags: [] }); }} className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-full transition-all hover:text-emerald-600">
                  <Plus size={20} strokeWidth={2.5} />
               </button>
               <button onClick={() => setIsEditMode(!isEditMode)} className={`p-3 rounded-full transition-all ${isEditMode ? 'bg-slate-800 text-white shadow-lg rotate-12' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                 {isEditMode ? <Check size={20} strokeWidth={3} /> : <Pencil size={20} />}
               </button>
             </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input type="text" placeholder="Cerca ingrediente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner" />
          </div>
        </header>

        {renderLegend({
          clickable: true,
          activeTags: activeIngredientTags,
          onToggle: (tag) => { setActiveIngredientTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]) }
        })}

        <div className="p-6 space-y-12 pt-4">
          {categories.map(cat => {
            let items = grouped[cat]?.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
            const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
            items = items.filter(i => !i.tags.some(tag => indicatorKeys.includes(tag) && !activeIngredientTags.includes(tag)));
            items.sort((a, b) => a.name.localeCompare(b.name));
            if (items.length === 0) return null;
            return (
              <div key={cat} className="animate-fade-in">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 ml-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div> {CATEGORY_LABELS[cat]}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-4">
                  {items.map(ing => {
                    const isActive = state.inventory.includes(ing.id);
                    return (
                      <button key={ing.id} onClick={() => handleIngredientClick(ing)} className={`relative flex flex-col items-center justify-center p-3 rounded-2xl aspect-square transition-all duration-300 ${isActive && !isEditMode ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-white text-slate-400 hover:bg-slate-50 border-2 border-slate-100 hover:border-slate-200'} ${isEditMode && 'hover:border-emerald-400 hover:bg-emerald-50 border-dashed'}`}>
                        {!isEditMode && <div className="absolute top-2 left-2 z-10">{renderIndicators(ing.tags)}</div>}
                        <Icon name={ing.icon} size={32} className="mb-2 shrink-0" />
                        <span className="text-[10px] font-bold leading-tight text-center px-0.5 w-full line-clamp-2">{ing.name}</span>
                        {isActive && !isEditMode && <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                        {isEditMode && <div className="absolute -top-2 -right-2 bg-white text-slate-400 p-1.5 rounded-full border border-slate-100 shadow-sm z-10"><Pencil size={12} /></div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <Modal isOpen={!!editingIngredient} onClose={() => setEditingIngredient(null)} title={isNewIngredient ? "Nuovo Ingrediente" : "Modifica Ingrediente"}>
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
    <div className="pb-28 md:pb-12 max-w-6xl mx-auto w-full md:px-8">
      <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-4 rounded-b-3xl">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
               <ChefHat className="text-emerald-500" size={28} strokeWidth={2.5}/> Ricettario ({displayedRecipes.length})
            </h2>
            <button onClick={() => { setIsNewRecipe(true); setEditingRecipe({ id: '', name: '', category: 'Primi', ingredients: [], optionalIngredients: [], tags: [], prepTime: 15, instructions: '', nutrition: { calories: 0, protein: 0 } }); }} className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-full transition-all hover:text-emerald-600">
               <Plus size={20} strokeWidth={2.5} />
             </button>
        </div>
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input type="text" placeholder="Cerca ricetta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner" />
        </div>
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1 -mx-6 px-6">
           <button onClick={() => setActiveRecipeTab('Tutti')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${activeRecipeTab === 'Tutti' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>Tutti</button>
           {['Primi', 'Secondi', 'Veg & Green', 'Street Food'].map(cat => (
             <button key={cat} onClick={() => setActiveRecipeTab(cat as RecipeCategory)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${activeRecipeTab === cat ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>{cat}</button>
           ))}
        </div>
      </header>
      
      {renderLegend({ 
        clickable: true,
        activeTags: activeRecipeTags,
        onToggle: (tag) => { setActiveRecipeTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]) }
      })}

      <div className="p-6 pt-4">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRecipes.map(r => {
                const isCookable = r.ingredients.every(id => state.inventory.includes(id));
                return (
                  <div key={r.id} onClick={() => handleRecipeClick(r)} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 hover:shadow-md transition-all cursor-pointer group relative">
                    <div className="absolute top-4 right-4 z-10">{renderIndicators(r.tags)}</div>
                    <div className={`w-2 h-auto rounded-full ${isCookable ? 'bg-emerald-500' : 'bg-orange-300'}`}></div>
                    <div className="flex-1 pr-6">
                       <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-emerald-700 transition-colors leading-tight">{r.name}</h3>
                       <div className="flex gap-1 mb-3">{r.tags.slice(0, 2).map(t => <TagBadge key={t} tag={t} />)}</div>
                       <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl"><Timer size={14} /> {r.prepTime} min</span>
                          {isCookable ? (
                             <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl"><Check size={14} strokeWidth={3}/> Pronto</span>
                           ) : (
                             <span className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-2.5 py-1.5 rounded-xl">Mancano {r.ingredients.filter(id => !state.inventory.includes(id)).length}</span>
                           )}
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
    <div className="pb-32 flex flex-col max-w-6xl mx-auto w-full md:px-8">
      <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm flex justify-between items-center mb-6 rounded-b-3xl">
         <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
           <CalendarDays className="text-emerald-500" size={28} strokeWidth={2.5}/> Pianificatore
         </h2>
      </header>

      {state.mealPlan.length === 0 ? (
        <div className="px-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <SlidersHorizontal className="text-slate-400" size={20}/> Configura Menu
            </h3>
            <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">Strategia</span>
                <div className="bg-slate-100 p-1 rounded-xl text-[10px] font-bold flex">
                  <button onClick={() => setState(p => ({...p, userPreferences: {...p.userPreferences, batchStrategy: 'Eco'}}))} className={`px-4 py-2 rounded-lg transition-all ${state.userPreferences.batchStrategy === 'Eco' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>Eco</button>
                  <button onClick={() => setState(p => ({...p, userPreferences: {...p.userPreferences, batchStrategy: 'Variety'}}))} className={`px-4 py-2 rounded-lg transition-all ${state.userPreferences.batchStrategy === 'Variety' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}>Varietà</button>
                </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                 <span className="font-bold text-slate-700 text-sm">Giorni da pianificare</span>
                 <span className="font-black text-2xl text-slate-800">{batchDays}</span>
              </div>
              <input type="range" min="1" max="7" value={batchDays} onChange={(e) => setBatchDays(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500" />
            </div>
            <div>
               <span className="font-bold text-slate-700 mb-3 block text-sm">Quali pasti?</span>
               <div className="grid grid-cols-3 gap-2">
                 {['lunch', 'dinner', 'both'].map((m) => (
                   <button key={m} onClick={() => setBatchMeals(m as any)} className={`py-3 rounded-2xl text-[10px] font-bold border-2 transition-all ${batchMeals === m ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>{m === 'lunch' ? 'Solo Pranzo' : m === 'dinner' ? 'Solo Cena' : 'Pranzo e Cena'}</button>
                 ))}
               </div>
            </div>
            <button onClick={generatePlan} disabled={isGeneratingBatch} className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-2 text-sm shadow-lg shadow-slate-200 active:scale-95">
              {isGeneratingBatch ? <RefreshCw className="animate-spin" size={18}/> : 'Genera Menu'}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          <div className="flex justify-between items-center px-2">
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Il tuo menu settimanale</span>
             <button onClick={() => setState(p => ({...p, mealPlan: []}))} className="text-xs text-red-400 font-bold hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Resetta</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {state.mealPlan.map((day) => (
              <div key={day.dayIndex} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                 <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                   <h3 className="font-bold text-slate-800 text-lg">Giorno {day.dayIndex}</h3>
                   <span className="text-xs font-black text-slate-100 text-5xl leading-none -mb-3 select-none">{day.dayIndex}</span>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    {day.lunch && (
                       <div onClick={() => handleRecipeClick(day.lunch!)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer border border-transparent hover:border-slate-100 transition-colors group">
                          <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0 group-hover:scale-110 transition-transform"><Sun size={20}/></div>
                          <div className="min-w-0 flex-1"><p className="font-bold text-slate-700 text-xs truncate">{day.lunch.name}</p></div>
                          <ChevronRight size={14} className="text-slate-300"/>
                       </div>
                    )}
                    {day.dinner && (
                       <div onClick={() => handleRecipeClick(day.dinner!)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer border border-transparent hover:border-slate-100 transition-colors group">
                          <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl shrink-0 group-hover:scale-110 transition-transform"><Moon size={20}/></div>
                          <div className="min-w-0 flex-1"><p className="font-bold text-slate-700 text-xs truncate">{day.dinner.name}</p></div>
                          <ChevronRight size={14} className="text-slate-300"/>
                       </div>
                    )}
                 </div>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 text-slate-300 rounded-[2.5rem] p-10 shadow-2xl mt-8 relative overflow-hidden w-full">
             <div className="absolute top-0 right-0 p-8 opacity-10"><ShoppingBasket size={150} /></div>
             <h3 className="font-bold text-white text-2xl mb-8 flex items-center gap-3 border-b border-slate-700 pb-6 relative z-10 uppercase tracking-widest">
                <ShoppingBasket className="text-emerald-400" size={32}/> Lista Spesa Necessaria
             </h3>
             <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm relative z-10 font-medium">
                {getShoppingList().length === 0 ? (
                   <li className="opacity-50 italic col-span-4 py-4 text-lg">Ottimo! Hai già tutto il necessario nel tuo frigo.</li>
                ) : (
                   getShoppingList().map(id => {
                      const ing = state.ingredients.find(i => i.id === id);
                      return (
                        <li key={id} className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="truncate text-base">{ing?.name || id}</span>
                        </li>
                      );
                   })
                )}
             </ul>
          </div>
        </div>
      )}
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
      <div className="pb-28 md:pb-12 max-w-6xl mx-auto w-full md:px-8">
        <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm flex justify-between items-center mb-8 rounded-b-3xl">
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
             <Settings className="text-slate-400" size={28} strokeWidth={2.5}/> Parametri
           </h2>
        </header>

        <div className="px-6 space-y-10">
          <section>
             <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 overflow-hidden">
               <h3 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-3 uppercase tracking-wider">
                 <ListChecks size={28} className="text-emerald-500"/> Matrice Dietetica
               </h3>
               <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-4 text-left text-slate-300 text-[10px] uppercase font-black tracking-widest">Tag Preferenza</th>
                      <th className="p-4 text-center"><div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2"><Sun size={24} className="text-amber-500"/></div><span className="text-[10px] font-black uppercase text-slate-400">Pranzo</span></th>
                      <th className="p-4 text-center"><div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-2"><Moon size={24} className="text-indigo-500"/></div><span className="text-[10px] font-black uppercase text-slate-400">Cena</span></th>
                    </tr>
                  </thead>
                  <tbody>
                      {Object.entries(TAG_LABELS).map(([tag, conf]) => (
                        <tr key={tag} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-5 font-bold text-slate-700 text-base">{conf.label}</td>
                          {['lunch', 'dinner'].map((meal) => {
                              const isActive = state.userPreferences.dietMatrix[meal as 'lunch' | 'dinner'].includes(tag as DietTag);
                              return (
                                <td key={meal} className="p-5 text-center">
                                  <button onClick={() => toggleMatrix(meal as any, tag as any)} className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all mx-auto ${isActive ? 'bg-emerald-500 border-emerald-500 text-white shadow-md scale-110' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                      {isActive && <Check size={24} strokeWidth={3}/>}
                                  </button>
                                </td>
                              )
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
               </div>
               <p className="text-xs text-slate-400 mt-8 italic text-center leading-relaxed">Questi parametri guidano i suggerimenti della Home e del Pianificatore automatico.</p>
             </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6 uppercase tracking-wide">
                   <Save size={24} className="text-blue-500"/> Backup Dati
                </h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">Scarica il database locale in formato JSON per conservare i tuoi dati o trasferirli su un altro dispositivo.</p>
              </div>
              <button onClick={() => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state)); const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `buonapp_backup_${new Date().toISOString().slice(0,10)}.json`); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove(); }} className="w-full py-5 bg-slate-50 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 border border-slate-200 transition-all flex items-center justify-center gap-3">
                <Download size={22} /> Scarica Backup .json
              </button>
            </div>
            <div className="bg-emerald-900 text-emerald-100 rounded-3xl p-10 shadow-lg border border-emerald-800 flex flex-col justify-center text-center">
               <p className="text-4xl font-black mb-2">BuonApp</p>
               <p className="text-xs font-bold opacity-50 uppercase tracking-[0.3em] mb-6">Cucina Intelligente</p>
               <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full mb-6"></div>
               <p className="text-xs opacity-60">I dati sono salvati esclusivamente nel browser locale.</p>
               <p className="text-sm font-black mt-8">Versione 0.5.2</p>
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
          <div className="space-y-8 animate-fade-in pb-6">
             <div className="grid grid-cols-3 gap-4">
               <div className="bg-blue-50 p-6 rounded-3xl flex flex-col items-center justify-center text-blue-600 gap-2">
                 <Clock size={28} />
                 <span className="text-2xl font-black">{editingRecipe.prepTime}</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Minuti</span>
               </div>
               <div className="bg-orange-50 p-6 rounded-3xl flex flex-col items-center justify-center text-orange-600 gap-2">
                 <Flame size={28} />
                 <span className="text-2xl font-black">{editingRecipe.nutrition.calories}</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Kcal</span>
               </div>
               <div className="bg-emerald-50 p-6 rounded-3xl flex flex-col items-center justify-center text-emerald-600 gap-2">
                 <Dumbbell size={28} />
                 <span className="text-2xl font-black">{editingRecipe.nutrition.protein}g</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Proteine</span>
               </div>
             </div>
             <div className="flex flex-wrap gap-2 justify-center">
                <TagBadge tag={editingRecipe.category as any} />
                {editingRecipe.tags.map(t => <TagBadge key={t} tag={t} />)}
             </div>
             <div>
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest border-b border-slate-100 pb-2"><ShoppingBasket className="text-slate-400" size={18} /> Ingredienti Richiesti</h3>
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {editingRecipe.ingredients.map(id => {
                   const ing = state.ingredients.find(i => i.id === id);
                   const inStock = state.inventory.includes(id);
                   return (
                     <li key={id} className={`flex items-center justify-between p-4 rounded-2xl bg-white border shadow-sm transition-all ${inStock ? 'border-emerald-200 ring-1 ring-emerald-50' : 'border-red-100 bg-red-50/30'}`}>
                       <span className="flex items-center gap-3 font-bold text-slate-700 text-xs truncate">
                         {ing && <div className="p-1.5 bg-slate-100 rounded-xl"><Icon name={ing.icon} size={16} className="text-slate-500"/></div>}
                         <span className="truncate">{ing?.name || id}</span>
                       </span>
                       {inStock ? <Check size={18} className="text-emerald-500 shrink-0" strokeWidth={3} /> : <X size={18} className="text-red-300 shrink-0" strokeWidth={3} />}
                     </li>
                   );
                 })}
               </ul>
               {editingRecipe.optionalIngredients && editingRecipe.optionalIngredients.length > 0 && (
                   <div className="mt-6">
                     <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-3 flex items-center gap-2 tracking-widest ml-1">Opzionali</h4>
                     <ul className="grid grid-cols-2 gap-3">
                        {editingRecipe.optionalIngredients.map(id => {
                            const ing = state.ingredients.find(i => i.id === id);
                            const inStock = state.inventory.includes(id);
                            return (
                              <li key={id} className={`flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 ${inStock ? 'opacity-100' : 'opacity-60'}`}>
                                <span className="flex items-center gap-2 text-slate-600 text-xs font-medium truncate"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{ing?.name || id}</span>
                                {inStock && <Check size={14} className="text-emerald-500"/>}
                              </li>
                            )
                        })}
                     </ul>
                   </div>
               )}
             </div>
             <div>
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest border-b border-slate-100 pb-2"><ChefHat className="text-slate-400" size={18} /> Procedimento</h3>
               <div className="p-6 bg-slate-50/50 rounded-3xl text-slate-600 text-sm leading-8 whitespace-pre-wrap border border-slate-100 shadow-inner relative overflow-hidden">
                 <Zap className="absolute -bottom-4 -right-4 text-emerald-400 opacity-5" size={100} />
                 {editingRecipe.instructions}
               </div>
             </div>
          </div>
        )
      )}
    </Modal>
  );

  const NavItem = ({ id, icon: IconC, label }: { id: ViewMode; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button onClick={() => { setSearchQuery(''); setActiveTab(id); }} className={`group flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${isActive ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-400'}`}>
        <div className={`p-2.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-emerald-50 -translate-y-3 shadow-sm' : 'bg-transparent'}`}>
          <IconC size={24} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[9px] font-black tracking-widest mt-1 transition-opacity absolute bottom-2 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
      </button>
    );
  };

  const DesktopNavItem = ({ id, icon: IconC, label }: { id: ViewMode; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button onClick={() => { setSearchQuery(''); setActiveTab(id); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'}`}>
        <IconC size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
        {isActive && <ChevronRight size={18} className="ml-auto opacity-40" />}
      </button>
    );
  };

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex selection:bg-emerald-200">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-slate-200 h-full shadow-sm z-50">
           <div className="p-10 pb-6">
               <h1 className="text-3xl font-black text-emerald-600 tracking-tight flex items-center gap-2">
                 <ChefHat size={32}/> BuonApp
               </h1>
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 pl-1">Cucina Intelligente</p>
           </div>
           <nav className="flex-1 px-4 py-6 space-y-2">
               <DesktopNavItem id="home" icon={Home} label="Home" />
               <DesktopNavItem id="frigo" icon={Refrigerator} label="Frigo & Dispensa" />
               <DesktopNavItem id="ricette" icon={ChefHat} label="Ricettario" />
               <DesktopNavItem id="batch" icon={CalendarDays} label="Pianificatore" />
               <DesktopNavItem id="parametri" icon={Settings} label="Parametri" />
           </nav>
           <div className="p-8 border-t border-slate-50">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-slate-500">Ingredienti</span>
                   <span className="text-xs font-black text-emerald-600">{(state.inventory || []).length}/{(state.ingredients || []).length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-500">Ricette</span>
                   <span className="text-xs font-black text-emerald-600">{(state.recipes || []).length}</span>
                 </div>
              </div>
           </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-y-auto relative no-scrollbar bg-slate-50/30">
        <div className="min-h-full py-6 md:py-12">
           {activeTab === 'home' && renderHome()}
           {activeTab === 'frigo' && renderInventory()}
           {activeTab === 'ricette' && renderRecipes()}
           {activeTab === 'batch' && renderBatch()}
           {activeTab === 'parametri' && renderParams()}
        </div>
      </main>

      {renderRecipeModal()}

      {/* BOTTOM NAV MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 safe-bottom pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-15px_50px_rgba(0,0,0,0.06)] h-24 px-4 rounded-t-[3rem] flex justify-between items-center">
            <div className="flex-1 h-full"><NavItem id="frigo" icon={Refrigerator} label="FRIGO" /></div>
            <div className="flex-1 h-full"><NavItem id="ricette" icon={ChefHat} label="RICETTE" /></div>
            <div className="w-20 h-full flex items-center justify-center -mt-12">
              <button onClick={() => setActiveTab('home')} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${activeTab === 'home' ? 'bg-emerald-500 scale-110 ring-8 ring-slate-50 shadow-emerald-200' : 'bg-slate-800'}`}>
                <Home className="text-white" size={26} strokeWidth={2.5} />
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