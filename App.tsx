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
    let loadedState: AppState | null = null;
    
    if (saved) {
      try {
        loadedState = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    
    // Default / Migration
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

    // Ensure migration for old states
    return {
      ...loadedState,
      ingredients: loadedState.ingredients.length < INITIAL_INGREDIENTS.length ? INITIAL_INGREDIENTS : loadedState.ingredients,
      userPreferences: {
        ...defaultPreferences,
        ...loadedState.userPreferences,
        dietMatrix: loadedState.userPreferences?.dietMatrix || defaultPreferences.dietMatrix
      },
      mealPlan: loadedState.mealPlan || []
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
  // Initialize with all filters selected by default
  const [activeIngredientTags, setActiveIngredientTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);

  // Recipes Specific State
  const [activeRecipeTab, setActiveRecipeTab] = useState<RecipeCategory | 'Tutti'>('Tutti');
  const [isRecipeEditMode, setIsRecipeEditMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isNewRecipe, setIsNewRecipe] = useState(false);
  // Recipe Filters: Initialize with all tags selected
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
      // Time based filtering
      const hour = new Date().getHours();
      const isLunchTime = hour < 15; // Before 3PM = Lunch suggestion
      const relevantTags = isLunchTime ? state.userPreferences.dietMatrix.lunch : state.userPreferences.dietMatrix.dinner;

      let candidates = filteredRecipes;
      
      // Filter candidates by Diet Matrix if any tags are set
      if (relevantTags && relevantTags.length > 0) {
         candidates = candidates.filter(r => relevantTags.every(tag => r.tags.includes(tag)));
      }

      if (candidates.length === 0) candidates = filteredRecipes; // Fallback

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
      const historyIngredients: Set<string> = new Set(); // Track used "proteins/veg" to ensure variety
      
      const getScore = (recipe: Recipe, mealType: 'lunch' | 'dinner') => {
        let score = 100;
        
        // 1. Matrix Constraints (Hard Filter basically, but let's do massive penalty if we want soft)
        const constraints = state.userPreferences.dietMatrix[mealType];
        if (constraints.some(tag => !recipe.tags.includes(tag))) {
           return -1000; // Invalid
        }

        // 2. Eco Strategy
        if (state.userPreferences.batchStrategy === 'Eco') {
           const owned = recipe.ingredients.filter(id => state.inventory.includes(id)).length;
           const total = recipe.ingredients.length;
           score += (owned / (total || 1)) * 50; // Max +50 points
        }

        // 3. Variety Strategy (Penalize repetition of significant ingredients)
        // Check overlap with history
        const relevantCats: IngredientCategory[] = ['proteine', 'verdure', 'surgelati']; // Don't care about repeating pantry
        const significantIngredients = recipe.ingredients.filter(id => {
           const ing = state.ingredients.find(i => i.id === id);
           return ing && relevantCats.includes(ing.category);
        });

        const overlap = significantIngredients.filter(id => historyIngredients.has(id)).length;
        if (overlap > 0) {
           score -= 60; // Huge penalty for repeating main protein/veg
        }

        // 4. Random noise
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
             // Try to avoid Lunch recipe
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
    }, 600); // Fake delay for UX
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

  // --- Views Helper ---
  
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
    <div className="flex flex-col gap-6 pb-28 md:pb-8 max-w-2xl mx-auto w-full">
      <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-white to-slate-50 shadow-sm rounded-b-[2rem] md:rounded-[2rem]">
        <h1 className="text-3xl font-black text-emerald-600 mb-1 tracking-tight">Ciao, Chef! 👋</h1>
        <p className="text-slate-500 font-medium">Cosa cuciniamo oggi?</p>
        
        <div className="mt-6 flex items-center bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setHomeFilterMode('frigo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${homeFilterMode === 'frigo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Refrigerator size={18} strokeWidth={2.5} /> Solo Frigo
          </button>
          <button 
            onClick={() => setHomeFilterMode('spesa')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${homeFilterMode === 'spesa' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ShoppingBasket size={18} strokeWidth={2.5} /> Idee Spesa
          </button>
        </div>
      </header>

      <div className="px-6">
        {heroRecipe ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-[2rem] blur opacity-40 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative bg-white rounded-[1.8rem] p-6 shadow-xl flex flex-col gap-5 border border-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">In evidenza</span>
                     {new Date().getHours() < 15 ? <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md"><Sun size={10}/> Pranzo</span> : <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md"><Moon size={10}/> Cena</span>}
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 leading-tight">{heroRecipe.name}</h2>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <ChefHat className="text-slate-400" size={28} strokeWidth={1.5} />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {heroRecipe.tags.map(t => <TagBadge key={t} tag={t} />)}
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-500 mt-1 font-medium">
                <span className="flex items-center gap-1.5"><Clock size={16} className="text-blue-400"/> {heroRecipe.prepTime} min</span>
                <span className="flex items-center gap-1.5"><Flame size={16} className="text-orange-400"/> {heroRecipe.nutrition.calories} kcal</span>
              </div>

              <div className="mt-2 pt-4 border-t border-slate-50 flex gap-3">
                <button 
                   onClick={() => {
                     const others = filteredRecipes.filter(r => r.id !== heroRecipe.id);
                     if(others.length > 0) {
                        setHeroRecipe(others[Math.floor(Math.random() * others.length)]);
                     }
                   }}
                   className="flex-1 py-3.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  Altra idea
                </button>
                <button 
                  onClick={() => {
                    setEditingRecipe(heroRecipe);
                    setIsNewRecipe(false);
                    setIsRecipeEditMode(false);
                  }}
                  className="flex-[2] py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-300 transition-all flex justify-center items-center gap-2"
                >
                  Vedi Ricetta <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 opacity-50 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <Search className="text-slate-400" size={24}/>
            </div>
            <p className="font-bold text-slate-400">Nessuna ricetta trovata.</p>
            <p className="text-xs text-slate-400">Prova a cambiare i filtri.</p>
          </div>
        )}
      </div>

      <div className="px-6 text-center">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => setShowRecipeListModal(true)}>
          Premi 'S' o clicca qui per la lista
        </p>
      </div>

      <Modal isOpen={showRecipeListModal} onClose={() => setShowRecipeListModal(false)} title={`Ricette Trovate (${filteredRecipes.length})`}>
        <div className="space-y-3">
          {filteredRecipes.map(r => (
            <button 
              key={r.id} 
              onClick={() => {
                setShowRecipeListModal(false);
                setEditingRecipe(r);
                setIsRecipeEditMode(false);
              }}
              className="w-full flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-colors group"
            >
              <span className="font-bold text-slate-700 group-hover:text-emerald-700">{r.name}</span>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm">{r.prepTime} min</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );

  const renderInventory = () => {
    const grouped = state.ingredients.reduce((acc, ing) => {
      if (!acc[ing.category]) acc[ing.category] = [];
      acc[ing.category].push(ing);
      return acc;
    }, {} as Record<IngredientCategory, Ingredient[]>);

    const categories = (Object.keys(CATEGORY_LABELS) as IngredientCategory[]);

    return (
      <div className="pb-28 md:pb-8 flex flex-col h-full">
        <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
               <Refrigerator className="text-emerald-500" strokeWidth={2.5}/> Il mio Frigo
             </h2>
             <div className="flex gap-2">
               <button 
                  onClick={() => {
                    setIsNewIngredient(true);
                    setEditingIngredient({
                      id: '',
                      name: '',
                      category: 'dispensa',
                      icon: 'Bowl',
                      tags: []
                    });
                  }}
                  className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-full transition-all hover:text-emerald-600"
                >
                  <Plus size={20} strokeWidth={2.5} />
                </button>
               <button 
                 onClick={() => setIsEditMode(!isEditMode)}
                 className={`p-3 rounded-full transition-all ${isEditMode ? 'bg-slate-800 text-white shadow-lg rotate-12' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
               >
                 {isEditMode ? <Check size={20} strokeWidth={3} /> : <Pencil size={20} />}
               </button>
             </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cerca ingrediente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </header>

        {/* Legend */}
        {renderLegend({
          clickable: true,
          activeTags: activeIngredientTags,
          onToggle: (tag) => {
            setActiveIngredientTags(prev => 
              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
            )
          }
        })}

        <div className="p-6 space-y-10 pt-2 flex-1 overflow-y-auto no-scrollbar">
          {categories.map(cat => {
            let items = grouped[cat]?.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
            
            // Filter logic: Hide item if it has a tag that is currently inactive
            const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
            items = items.filter(i => {
              const hasRestrictedTag = i.tags.some(tag => indicatorKeys.includes(tag) && !activeIngredientTags.includes(tag));
              return !hasRestrictedTag;
            });
            
            // Sort items alphabetically
            items.sort((a, b) => a.name.localeCompare(b.name));

            if (items.length === 0) return null;
            
            return (
              <div key={cat} className="animate-fade-in">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  {CATEGORY_LABELS[cat]}
                </h3>
                {/* Max columns optimized for responsive */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                  {items.map(ing => {
                    const isActive = state.inventory.includes(ing.id);
                    return (
                      <button 
                        key={ing.id}
                        onClick={() => handleIngredientClick(ing)}
                        className={`
                          relative flex flex-col items-center justify-center p-2 rounded-2xl aspect-square transition-all duration-300
                          ${isActive && !isEditMode
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' 
                            : 'bg-white text-slate-400 hover:bg-slate-50 border-2 border-slate-100 hover:border-slate-200'
                          }
                          ${isEditMode && 'hover:border-emerald-400 hover:bg-emerald-50 border-dashed'}
                        `}
                      >
                        {/* Indicators */}
                        {!isEditMode && (
                          <div className="absolute top-2 left-2 z-10">
                            {renderIndicators(ing.tags)}
                          </div>
                        )}

                        <Icon name={ing.icon} size={28} className="mb-2 shrink-0" />
                        <span className="text-[10px] font-bold leading-tight text-center px-0.5 w-full line-clamp-2 break-words">
                          {ing.name}
                        </span>
                        
                        {isActive && !isEditMode && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse shadow-sm"></div>
                        )}
                        {isEditMode && (
                          <div className="absolute -top-2 -right-2 bg-white text-slate-400 p-1.5 rounded-full border border-slate-100 shadow-sm z-10">
                            <Pencil size={12} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <Modal 
          isOpen={!!editingIngredient} 
          onClose={() => setEditingIngredient(null)} 
          title={isNewIngredient ? "Nuovo Ingrediente" : "Modifica Ingrediente"}
        >
          {editingIngredient && (
            <IngredientEditor 
              initialData={editingIngredient} 
              isNew={isNewIngredient}
              onSave={saveIngredient}
              onDelete={deleteIngredient}
              onCancel={() => setEditingIngredient(null)}
            />
          )}
        </Modal>
      </div>
    );
  };

  const renderRecipes = () => {
    // Logic to calculate displayed recipes
    const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
    
    const displayedRecipes = state.recipes.filter(r => {
        // Search
        if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
        // Category
        if (activeRecipeTab !== 'Tutti' && r.category !== activeRecipeTab) return false;
        
        // Tag Filters
        // If the recipe has a tag that is tracked in indicators (indicatorKeys) 
        // AND that tag is NOT in the active set (activeRecipeTags), then hide it.
        const hasRestrictedTag = r.tags.some(tag => indicatorKeys.includes(tag) && !activeRecipeTags.includes(tag));
        if (hasRestrictedTag) return false;

        return true;
    });

    return (
    <div className="pb-28 md:pb-8">
      <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
            {/* Dynamic Counter in Title */}
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
               <ChefHat className="text-emerald-500" strokeWidth={2.5}/> Ricettario ({displayedRecipes.length})
            </h2>
            <button 
               onClick={() => {
                  setIsNewRecipe(true);
                  setEditingRecipe({
                    id: '',
                    name: '',
                    category: 'Primi',
                    ingredients: [],
                    optionalIngredients: [],
                    tags: [],
                    prepTime: 15,
                    instructions: '',
                    nutrition: { calories: 0, protein: 0 }
                  });
               }}
               className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-full transition-all hover:text-emerald-600"
             >
               <Plus size={20} strokeWidth={2.5} />
             </button>
        </div>
        
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cerca ricetta..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
            />
        </div>

        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1 -mx-6 px-6">
           <button 
             onClick={() => setActiveRecipeTab('Tutti')}
             className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${activeRecipeTab === 'Tutti' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}
           >
             Tutti
           </button>
           {['Primi', 'Secondi', 'Veg & Green', 'Street Food'].map(cat => (
             <button 
               key={cat}
               onClick={() => setActiveRecipeTab(cat as RecipeCategory)}
               className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${activeRecipeTab === cat ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}
             >
               {cat}
             </button>
           ))}
        </div>
      </header>
      
      {/* Legend for Recipes - Clickable Filter Logic added */}
      {renderLegend({ 
        clickable: true,
        activeTags: activeRecipeTags,
        onToggle: (tag) => {
          setActiveRecipeTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
          )
        }
      })}

      <div className="p-6 pt-2">
         {/* Grid layout optimized for Desktop */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {displayedRecipes.map(r => {
                const missing = r.ingredients.filter(id => !state.inventory.includes(id));
                const isCookable = missing.length === 0;

                return (
                  <div 
                    key={r.id} 
                    onClick={() => handleRecipeClick(r)}
                    className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-3 hover:shadow-md transition-all cursor-pointer group active:scale-95 relative"
                  >
                    {/* Indicators */}
                    <div className="absolute top-3 right-3 z-10">
                       {renderIndicators(r.tags)}
                    </div>

                    <div className={`w-1.5 h-auto rounded-full ${isCookable ? 'bg-emerald-500' : 'bg-orange-300'}`}></div>
                    <div className="flex-1 pr-6">
                       <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-emerald-700 transition-colors">{r.name}</h3>
                       </div>
                       <div className="flex gap-1 mb-2">
                          {r.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} />)}
                       </div>
                       <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><Timer size={12} /> {r.prepTime} min</span>
                          {isCookable ? (
                             <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><Check size={12} strokeWidth={3}/> Pronto</span>
                           ) : (
                             <span className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-md">Mancano {missing.length}</span>
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
    <div className="pb-32 flex flex-col">
      <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm flex justify-between items-center mb-6">
         <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
           <CalendarDays className="text-emerald-500" strokeWidth={2.5}/> Pianificatore
         </h2>
      </header>

      {state.mealPlan.length === 0 ? (
        <div className="px-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <SlidersHorizontal className="text-slate-400" size={20}/> Configura Menu
            </h3>
            
            {/* Strategy Toggle */}
            <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">Strategia</span>
                <div className="bg-slate-100 p-1 rounded-xl text-[10px] font-bold flex">
                  <button 
                    onClick={() => setState(p => ({...p, userPreferences: {...p.userPreferences, batchStrategy: 'Eco'}}))}
                    className={`px-4 py-2 rounded-lg transition-all ${state.userPreferences.batchStrategy === 'Eco' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                  >
                    Eco
                  </button>
                  <button 
                    onClick={() => setState(p => ({...p, userPreferences: {...p.userPreferences, batchStrategy: 'Variety'}}))}
                    className={`px-4 py-2 rounded-lg transition-all ${state.userPreferences.batchStrategy === 'Variety' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}
                  >
                    Varietà
                  </button>
                </div>
            </div>

            {/* Days Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                 <span className="font-bold text-slate-700 text-sm">Giorni da pianificare</span>
                 <span className="font-black text-2xl text-slate-800">{batchDays}</span>
              </div>
              <input 
                type="range" min="1" max="7" 
                value={batchDays} onChange={(e) => setBatchDays(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-bold px-1">
                 <span>1 Giorno</span>
                 <span>1 Settimana</span>
              </div>
            </div>

            {/* Meal Type */}
            <div>
               <span className="font-bold text-slate-700 mb-3 block text-sm">Quali pasti?</span>
               <div className="grid grid-cols-3 gap-2">
                 {['lunch', 'dinner', 'both'].map((m) => (
                   <button 
                     key={m}
                     onClick={() => setBatchMeals(m as any)}
                     className={`py-3 rounded-2xl text-[10px] font-bold border-2 transition-all ${batchMeals === m ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                   >
                     {m === 'lunch' ? 'Solo Pranzo' : m === 'dinner' ? 'Solo Cena' : 'Pranzo e Cena'}
                   </button>
                 ))}
               </div>
            </div>

            <button 
              onClick={generatePlan}
              disabled={isGeneratingBatch}
              className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-2 text-sm shadow-lg shadow-slate-200 active:scale-95"
            >
              {isGeneratingBatch ? <RefreshCw className="animate-spin" size={18}/> : 'Genera Menu'}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Il tuo menu</span>
             <button onClick={() => setState(p => ({...p, mealPlan: []}))} className="text-xs text-red-400 font-bold hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Resetta</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.mealPlan.map((day) => (
              <div key={day.dayIndex} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                 <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                   <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide">Giorno {day.dayIndex}</h3>
                   <span className="text-xs font-black text-slate-200 text-4xl leading-none -mb-2">{day.dayIndex}</span>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-3">
                    {day.lunch && (
                       <div onClick={() => handleRecipeClick(day.lunch!)} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer border border-transparent hover:border-slate-100 transition-colors group">
                          <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0 group-hover:scale-110 transition-transform shadow-sm"><Sun size={20}/></div>
                          <div className="min-w-0 flex-1">
                             <p className="font-bold text-slate-700 text-sm truncate">{day.lunch.name}</p>
                             <div className="flex gap-1 mt-1.5 overflow-hidden opacity-70">{day.lunch.tags.slice(0,2).map(t => <TagBadge key={t} tag={t} />)}</div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300"/>
                       </div>
                    )}
                    {day.dinner && (
                       <div onClick={() => handleRecipeClick(day.dinner!)} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer border border-transparent hover:border-slate-100 transition-colors group">
                          <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl shrink-0 group-hover:scale-110 transition-transform shadow-sm"><Moon size={20}/></div>
                          <div className="min-w-0 flex-1">
                             <p className="font-bold text-slate-700 text-sm truncate">{day.dinner.name}</p>
                             <div className="flex gap-1 mt-1.5 overflow-hidden opacity-70">{day.dinner.tags.slice(0,2).map(t => <TagBadge key={t} tag={t} />)}</div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300"/>
                       </div>
                    )}
                 </div>
              </div>
            ))}
          </div>

          {/* Shopping List */}
          <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 shadow-2xl mt-4 relative overflow-hidden max-w-4xl mx-auto w-full">
             <div className="absolute top-0 right-0 p-8 opacity-10"><ShoppingBasket size={100} /></div>
             <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2 border-b border-slate-700 pb-3 relative z-10">
                <ShoppingBasket className="text-emerald-400" size={20}/> Lista Spesa
             </h3>
             <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 text-sm relative z-10 font-medium">
                {getShoppingList().length === 0 ? (
                   <li className="opacity-50 italic col-span-2">Tutto ok! Hai già tutto.</li>
                ) : (
                   getShoppingList().map(id => {
                      const ing = state.ingredients.find(i => i.id === id);
                      return (
                        <li key={id} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="truncate">{ing?.name || id}</span>
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
         const updated = current.includes(tag) 
            ? current.filter(t => t !== tag) 
            : [...current, tag];
         
         return {
            ...prev,
            userPreferences: {
               ...prev.userPreferences,
               dietMatrix: {
                  ...prev.userPreferences.dietMatrix,
                  [meal]: updated
               }
            }
         };
       });
    };

    return (
      <div className="pb-28 md:pb-8 max-w-3xl mx-auto w-full">
        <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm flex justify-between items-center mb-6">
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
             <Settings className="text-slate-400" strokeWidth={2.5}/> Parametri
           </h2>
        </header>

        <div className="px-6 space-y-6">
          
          <section>
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-hidden">
               <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <ListChecks size={20} className="text-emerald-500"/> Matrice Dietetica
               </h3>
               
               <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-slate-300 text-[10px] uppercase font-bold tracking-wider">TAG</th>
                      <th className="p-2 text-center"><div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mx-auto"><Sun size={16} className="text-amber-500"/></div></th>
                      <th className="p-2 text-center"><div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mx-auto"><Moon size={16} className="text-indigo-500"/></div></th>
                    </tr>
                  </thead>
                  <tbody>
                      {Object.entries(TAG_LABELS).map(([tag, conf]) => (
                        <tr key={tag} className="border-t border-slate-50 last:border-0">
                          <td className="p-3 font-bold text-slate-700 text-xs">{conf.label}</td>
                          {['lunch', 'dinner'].map((meal) => {
                              const isActive = state.userPreferences.dietMatrix[meal as 'lunch' | 'dinner'].includes(tag as DietTag);
                              return (
                                <td key={meal} className="p-2 text-center">
                                  <button 
                                    onClick={() => toggleMatrix(meal as any, tag as any)}
                                    className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all mx-auto ${isActive ? 'bg-emerald-500 border-emerald-500 text-white shadow-md scale-105' : 'bg-slate-50 border-slate-100'}`}
                                  >
                                      {isActive && <Check size={16} strokeWidth={3}/>}
                                  </button>
                                </td>
                              )
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
               </div>
               <p className="text-[10px] text-slate-400 mt-4 italic text-center">* Queste preferenze filtrano i suggerimenti automatici e il pianificatore.</p>
             </div>
          </section>

          <section>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <Save size={20} className="text-blue-500"/> Gestione Dati
              </h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                   <p className="font-bold text-slate-800 text-sm">Backup JSON</p>
                   <p className="text-xs text-slate-400">Scarica i tuoi dati locali</p>
                </div>
                <button 
                  onClick={() => {
                     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
                     const downloadAnchorNode = document.createElement('a');
                     downloadAnchorNode.setAttribute("href", dataStr);
                     downloadAnchorNode.setAttribute("download", "buonapp_backup.json");
                     document.body.appendChild(downloadAnchorNode);
                     downloadAnchorNode.click();
                     downloadAnchorNode.remove();
                  }}
                  className="p-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 border border-slate-200 shadow-sm transition-colors"
                >
                  <Download size={20} />
                </button>
              </div>
              
              <div className="text-[10px] text-slate-400 leading-relaxed text-center">
                 I dati sono salvati nel tuo browser. Esporta il JSON periodicamente per sicurezza.
              </div>
            </div>
          </section>

          <section className="text-center pt-8 pb-4">
             <p className="font-black text-slate-200 text-lg">BuonApp v0.5</p>
          </section>
        </div>
      </div>
    );
  };

  const renderRecipeModal = () => (
    <Modal
      isOpen={!!editingRecipe}
      onClose={() => setEditingRecipe(null)}
      title={isNewRecipe ? "Nuova Ricetta" : editingRecipe?.name || "Dettaglio Ricetta"}
      onEdit={!isRecipeEditMode && !isNewRecipe ? () => setIsRecipeEditMode(true) : undefined}
    >
      {editingRecipe && (
        isRecipeEditMode || isNewRecipe ? (
          <RecipeEditor
            initialData={editingRecipe}
            isNew={isNewRecipe}
            allIngredients={state.ingredients}
            inventory={state.inventory}
            onSave={saveRecipe}
            onDelete={deleteRecipe}
            onCancel={() => setEditingRecipe(null)}
          />
        ) : (
          <div className="space-y-6 animate-fade-in pb-4">
             
             {/* Colorful Stats Bento Grid */}
             <div className="grid grid-cols-3 gap-3">
               <div className="bg-blue-50 p-4 rounded-2xl flex flex-col items-center justify-center text-blue-600 gap-1 min-h-[100px]">
                 <Clock size={24} strokeWidth={2} />
                 <span className="text-2xl font-black">{editingRecipe.prepTime}</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Minuti</span>
               </div>
               <div className="bg-orange-50 p-4 rounded-2xl flex flex-col items-center justify-center text-orange-600 gap-1 min-h-[100px]">
                 <Flame size={24} strokeWidth={2} />
                 <span className="text-2xl font-black">{editingRecipe.nutrition.calories}</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Kcal</span>
               </div>
               <div className="bg-emerald-50 p-4 rounded-2xl flex flex-col items-center justify-center text-emerald-600 gap-1 min-h-[100px]">
                 <Dumbbell size={24} strokeWidth={2} />
                 <span className="text-2xl font-black">{editingRecipe.nutrition.protein}g</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Proteine</span>
               </div>
             </div>

             <div className="flex flex-wrap gap-2 justify-center">
                <TagBadge tag={editingRecipe.category as any} />
                {editingRecipe.tags.map(t => <TagBadge key={t} tag={t} />)}
             </div>

             <div>
               <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                 <ShoppingBasket className="text-slate-400" size={18} /> Ingredienti
               </h3>
               <ul className="grid grid-cols-2 gap-2">
                 {editingRecipe.ingredients.map(id => {
                   const ing = state.ingredients.find(i => i.id === id);
                   const inStock = state.inventory.includes(id);
                   return (
                     <li key={id} className={`flex items-center justify-between p-3 rounded-xl bg-white border-l-4 shadow-sm transition-transform hover:scale-[1.02] ${inStock ? 'border-emerald-500 ring-1 ring-slate-100' : 'border-red-400 ring-1 ring-red-50'}`}>
                       <span className="flex items-center gap-2 font-bold text-slate-700 text-xs truncate">
                         {ing ? <div className="p-1 bg-slate-50 rounded-md"><Icon name={ing.icon} size={14} className="text-slate-500"/></div> : null}
                         <span className="truncate">{ing?.name || id}</span>
                       </span>
                       {inStock ? <Check size={16} className="text-emerald-500 shrink-0" strokeWidth={3} /> : <X size={16} className="text-red-300 shrink-0" strokeWidth={3} />}
                     </li>
                   );
                 })}
               </ul>
               
               {editingRecipe.optionalIngredients && editingRecipe.optionalIngredients.length > 0 && (
                   <div className="mt-4">
                     <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-2 flex items-center gap-2 tracking-wider ml-1">Opzionali</h4>
                     <ul className="grid grid-cols-2 gap-2">
                        {editingRecipe.optionalIngredients.map(id => {
                            const ing = state.ingredients.find(i => i.id === id);
                            const inStock = state.inventory.includes(id);
                            return (
                              <li key={id} className={`flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 ${inStock ? 'opacity-100' : 'opacity-60'}`}>
                                <span className="flex items-center gap-2 text-slate-600 text-xs font-medium truncate">
                                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></div>
                                   <span className="truncate">{ing?.name || id}</span>
                                </span>
                                {inStock && <Check size={12} className="text-emerald-500 shrink-0"/>}
                              </li>
                            )
                        })}
                     </ul>
                   </div>
               )}
             </div>

             <div>
               <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                 <ChefHat className="text-slate-400" size={18} /> Procedimento
               </h3>
               <div className="p-5 bg-white rounded-2xl text-slate-600 text-sm leading-7 whitespace-pre-wrap border border-slate-100 shadow-sm relative">
                 <Zap className="absolute top-4 right-4 text-yellow-400 opacity-20" size={40} />
                 {editingRecipe.instructions}
               </div>
             </div>
             
             {editingRecipe.ingredients.some(id => !state.inventory.includes(id)) && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3 border border-red-100 shadow-sm font-medium">
                   <AlertCircle className="shrink-0 mt-0.5" size={18} />
                   <span>Ti mancano alcuni ingredienti per cucinare questo piatto.</span>
                </div>
             )}
          </div>
        )
      )}
    </Modal>
  );

  const NavItem = ({ id, icon: IconC, label }: { id: ViewMode; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => {
          setSearchQuery(''); 
          setActiveTab(id);
        }} 
        className={`group flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${isActive ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-400'}`}
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-emerald-50 -translate-y-3 shadow-sm' : 'bg-transparent'}`}>
          <IconC size={isActive ? 24 : 24} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[9px] font-black tracking-widest mt-1 transition-opacity absolute bottom-2 ${isActive ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}>
          {label}
        </span>
      </button>
    );
  };

  const DesktopNavItem = ({ id, icon: IconC, label }: { id: ViewMode; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => {
           setSearchQuery(''); 
           setActiveTab(id);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'}`}
      >
        <IconC size={20} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
        {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
      </button>
    );
  };

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex selection:bg-emerald-200">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-full shadow-sm z-50">
           <div className="p-8 pb-4">
               <h1 className="text-2xl font-black text-emerald-600 tracking-tight flex items-center gap-2">
                 <ChefHat size={28}/> BuonApp
               </h1>
               <p className="text-xs text-slate-400 font-medium pl-1">La tua cucina intelligente</p>
           </div>
           
           <nav className="flex-1 px-4 py-4 space-y-2">
               <DesktopNavItem id="home" icon={Home} label="Home" />
               <DesktopNavItem id="frigo" icon={Refrigerator} label="Frigo & Dispensa" />
               <DesktopNavItem id="ricette" icon={ChefHat} label="Ricettario" />
               <DesktopNavItem id="batch" icon={CalendarDays} label="Pianificatore" />
               <DesktopNavItem id="parametri" icon={Settings} label="Parametri" />
           </nav>
           
           <div className="p-6 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-500">Ingredienti</span>
                   <span className="text-xs font-black text-emerald-600">{state.inventory.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-500">Ricette</span>
                   <span className="text-xs font-black text-emerald-600">{state.recipes.length}</span>
                 </div>
              </div>
           </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto relative no-scrollbar md:p-0">
        <div className="min-h-full">
           {activeTab === 'home' && renderHome()}
           {activeTab === 'frigo' && renderInventory()}
           {activeTab === 'ricette' && renderRecipes()}
           {activeTab === 'batch' && renderBatch()}
           {activeTab === 'parametri' && renderParams()}
        </div>
      </main>

      {renderRecipeModal()}

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 safe-bottom pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-lg border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] h-24 px-4 rounded-t-[2.5rem] flex justify-between items-center relative">
            
            <div className="flex-1 h-full"><NavItem id="frigo" icon={Refrigerator} label="FRIGO" /></div>
            <div className="flex-1 h-full"><NavItem id="ricette" icon={ChefHat} label="RICETTE" /></div>
            
            <div className="w-20 h-full flex items-center justify-center -mt-10">
              <button 
                onClick={() => setActiveTab('home')}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-emerald-300/50 shadow-xl transition-all duration-300 ${activeTab === 'home' ? 'bg-emerald-500 scale-110 ring-8 ring-slate-50' : 'bg-slate-800 scale-100 hover:scale-105'}`}
              >
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