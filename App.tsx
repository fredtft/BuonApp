import React, { useState, useEffect, useMemo, useRef } from 'react';
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

// Ordine per lo swipe tra Tab
const TABS: ViewMode[] = ['frigo', 'ricette', 'home', 'batch', 'parametri'];

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewMode>('home');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('buonapp_state');
    let loadedState: any = null;
    if (saved) {
      try {
        loadedState = JSON.parse(saved);
      } catch (e) {
        console.error("Errore nel caricamento dello stato", e);
      }
    }
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

  const [homeFilterMode, setHomeFilterMode] = useState<'frigo' | 'spesa'>('frigo');
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null);
  const [showRecipeListModal, setShowRecipeListModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isNewIngredient, setIsNewIngredient] = useState(false);
  const [activeIngredientTags, setActiveIngredientTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);
  const [activeRecipeTab, setActiveRecipeTab] = useState<RecipeCategory | 'Tutti'>('Tutti');
  const [isRecipeEditMode, setIsRecipeEditMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isNewRecipe, setIsNewRecipe] = useState(false);
  const [activeRecipeTags, setActiveRecipeTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);
  const [batchDays, setBatchDays] = useState(3);
  const [batchMeals, setBatchMeals] = useState<'lunch' | 'dinner' | 'both'>('both');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 60;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = TABS.indexOf(activeTab);
      if (isLeftSwipe && currentIndex < TABS.length - 1) {
        setActiveTab(TABS[currentIndex + 1]);
        window.scrollTo(0, 0);
      } else if (isRightSwipe && currentIndex > 0) {
        setActiveTab(TABS[currentIndex - 1]);
        window.scrollTo(0, 0);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('buonapp_state', JSON.stringify(state));
  }, [state]);

  // Passaggio automatico a 'spesa' se non ci sono ricette cucinabili all'apertura o modifica inventario
  useEffect(() => {
    if (activeTab === 'home' && homeFilterMode === 'frigo') {
      const cookableCount = state.recipes.filter(r => r.ingredients.every(id => state.inventory.includes(id))).length;
      if (cookableCount === 0) {
        setHomeFilterMode('spesa');
      }
    }
  }, [activeTab, state.inventory, state.recipes, homeFilterMode]);

  const filteredRecipes = useMemo(() => {
    let list = state.recipes;
    if (searchQuery && (activeTab === 'ricette' || activeTab === 'home')) {
      list = list.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeTab === 'ricette' || activeTab === 'home') {
      if (activeRecipeTab !== 'Tutti') list = list.filter(r => r.category === activeRecipeTab);
      const indicatorKeys = Object.keys(INDICATORS_CONFIG) as DietTag[];
      list = list.filter(r => !r.tags.some(tag => indicatorKeys.includes(tag) && !activeRecipeTags.includes(tag)));
    }
    if (activeTab === 'home' && homeFilterMode === 'frigo') {
      list = list.filter(r => r.ingredients.every(iId => state.inventory.includes(id => state.inventory.includes(id))));
    }
    return list;
  }, [state.recipes, state.inventory, searchQuery, activeTab, homeFilterMode, activeRecipeTab, activeRecipeTags]);

  useEffect(() => {
    if (filteredRecipes.length > 0) {
      const hour = new Date().getHours();
      const relevantTags = hour < 15 ? state.userPreferences.dietMatrix.lunch : state.userPreferences.dietMatrix.dinner;
      let candidates = filteredRecipes;
      if (relevantTags?.length > 0) {
         candidates = candidates.filter(r => relevantTags.every(tag => r.tags.includes(tag)));
      }
      if (candidates.length === 0) candidates = filteredRecipes;
      setHeroRecipe(candidates[Math.floor(Math.random() * candidates.length)]);
    } else {
      setHeroRecipe(null);
    }
  }, [filteredRecipes.length, homeFilterMode, state.userPreferences.dietMatrix]);

  const toggleInventoryStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.includes(id) ? prev.inventory.filter(i => i !== id) : [...prev.inventory, id]
    }));
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
         if (newIngredients.some(i => i.id === ing.id)) ing.id = `${ing.id}_${Math.random().toString(36).substr(2, 5)}`;
         newIngredients.push(ing);
      } else {
         newIngredients = newIngredients.map(i => i.id === ing.id ? ing : i);
      }
      return { ...prev, ingredients: newIngredients };
    });
    setEditingIngredient(null);
  };

  const deleteIngredient = (id: string) => {
    setState(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i.id !== id),
      inventory: prev.inventory.filter(iId => iId !== id)
    }));
    setEditingIngredient(null);
  };

  const saveRecipe = (recipe: Recipe) => {
    setState(prev => {
      let newRecipes = [...prev.recipes];
      if (isNewRecipe) {
        if (newRecipes.some(r => r.id === recipe.id)) recipe.id = `${recipe.id}_${Math.random().toString(36).substr(2, 5)}`;
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
     setState(prev => ({ ...prev, recipes: prev.recipes.filter(r => r.id !== id) }));
     setEditingRecipe(null);
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
      const historyIngredients = new Set<string>();
      const getScore = (recipe: Recipe, mealType: 'lunch' | 'dinner') => {
        const constraints = state.userPreferences.dietMatrix[mealType];
        if (constraints.some(tag => !recipe.tags.includes(tag))) return -1000;
        let score = 100;
        if (state.userPreferences.batchStrategy === 'Eco') {
           const owned = recipe.ingredients.filter(id => state.inventory.includes(id)).length;
           score += (owned / (recipe.ingredients.length || 1)) * 50;
        }
        const relevantCats = ['proteine', 'verdure', 'surgelati'];
        const sigIng = recipe.ingredients.filter(id => {
           const ing = state.ingredients.find(i => i.id === id);
           return ing && relevantCats.includes(ing.category);
        });
        if (sigIng.some(id => historyIngredients.has(id))) score -= 60;
        return score + Math.random() * 20;
      };
      for (let d = 1; d <= batchDays; d++) {
        let lunch: Recipe | null = null, dinner: Recipe | null = null;
        if (batchMeals !== 'dinner') {
           const cand = state.recipes.map(r => ({ r, score: getScore(r, 'lunch') })).filter(x => x.score > 0).sort((a,b) => b.score - a.score);
           if (cand.length > 0) { lunch = cand[0].r; lunch.ingredients.forEach(id => historyIngredients.add(id)); }
        }
        if (batchMeals !== 'lunch') {
           const cand = state.recipes.map(r => ({ r, score: getScore(r, 'dinner') })).filter(x => x.score > 0 && x.r.id !== lunch?.id).sort((a,b) => b.score - a.score);
           if (cand.length > 0) { dinner = cand[0].r; dinner.ingredients.forEach(id => historyIngredients.add(id)); }
        }
        plan.push({ dayIndex: d, lunch, dinner });
      }
      setState(prev => ({ ...prev, mealPlan: plan }));
      setIsGeneratingBatch(false);
    }, 600);
  };

  const getShoppingList = () => {
    const need = new Set<string>();
    state.mealPlan.forEach(day => {
       [day.lunch, day.dinner].forEach(r => r?.ingredients.forEach(id => { if(!state.inventory.includes(id)) need.add(id); }));
    });
    return Array.from(need);
  };

  const renderIndicators = (tags: DietTag[], type: 'ingredient' | 'recipe' = 'ingredient') => {
    const relevantTags = tags.filter(tag => INDICATORS_CONFIG[tag]);
    if (relevantTags.length === 0) return null;
    if (type === 'ingredient') {
      return (
        <div className="absolute top-1 left-1 flex gap-0.5 z-10">
          {relevantTags.map(tag => (
            <div key={tag} className={`w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm ${INDICATORS_CONFIG[tag]?.color}`} />
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-0.5 pr-1 border-r border-slate-100 mr-1.5">
         {relevantTags.map(tag => (
           <div key={tag} className={`w-1.5 h-1.5 rounded-full ${INDICATORS_CONFIG[tag]?.color}`} />
         ))}
      </div>
    );
  };

  const renderLegend = ({ clickable, activeTags, onToggle }: { clickable: boolean, activeTags?: DietTag[], onToggle?: (t: DietTag) => void }) => (
    <div className="w-full overflow-x-auto no-scrollbar py-0.5">
      <div className="flex flex-nowrap gap-1.5 whitespace-nowrap min-w-max justify-center mx-auto">
         {Object.entries(INDICATORS_CONFIG).map(([key, config]) => {
           const isActive = activeTags?.includes(key as DietTag);
           return (
             <div key={key} onClick={() => clickable && onToggle?.(key as DietTag)} className={`flex items-center gap-1 transition-all px-2 py-0.5 rounded-lg border ${clickable ? 'cursor-pointer active:scale-95' : ''} ${isActive ? 'bg-slate-200 border-slate-300 text-slate-800 font-bold' : 'bg-slate-50 border-slate-100 text-slate-400 grayscale-[0.5] opacity-70'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${config?.color} shadow-sm`} />
                <span className="text-[9px] uppercase font-black tracking-tight">{config?.label}</span>
             </div>
           );
         })}
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col gap-4 pb-32 md:pb-12 max-w-6xl mx-auto w-full md:px-8">
      <header className="px-6 pt-6 pb-2 md:pt-10 md:pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
      <div className="px-4 md:px-0">
        {heroRecipe ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-[2rem] blur opacity-10" />
            <div className="relative bg-white rounded-[2rem] p-5 md:p-10 shadow-xl flex flex-col md:flex-row gap-6 border border-slate-50 items-center overflow-hidden">
              <button onClick={() => { const others = filteredRecipes.filter(r => r.id !== heroRecipe.id); if(others.length > 0) setHeroRecipe(others[Math.floor(Math.random() * others.length)]); }} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-400 active:scale-90"><RefreshCw size={18} /></button>
              <div className="flex-1 space-y-3 w-full">
                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">In evidenza</span>
                <h2 className="text-xl md:text-3xl font-black text-slate-800 leading-tight">{heroRecipe.name}</h2>
                <div className="flex wrap gap-1">{heroRecipe.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} />)}</div>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl"><Clock size={14} className="text-blue-400"/> {heroRecipe.prepTime}m</span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl"><Flame size={14} className="text-orange-400"/> {heroRecipe.nutrition.calories} kcal</span>
                </div>
                <button onClick={() => handleRecipeClick(heroRecipe)} className="w-full md:w-56 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm flex justify-center items-center gap-3 active:scale-95 shadow-lg">Cucina <ArrowRight size={16} /></button>
              </div>
              <div className="hidden md:flex w-64 h-64 bg-slate-50 rounded-[2rem] items-center justify-center border-2 border-slate-100"><ChefHat className="text-slate-200" size={80} /></div>
            </div>
          </div>
        ) : <p className="text-center py-10 opacity-50 font-bold">Nessuna ricetta disponibile.</p>}
      </div>
      <div className="px-6 text-center py-2">
        <button 
          onClick={() => setShowRecipeListModal(true)} 
          className="text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-5 py-2.5 rounded-full uppercase tracking-widest active:scale-95 transition-all shadow-sm"
        >
          Vedi tutto ({filteredRecipes.length})
        </button>
      </div>
    </div>
  );

  const renderInventory = () => {
    const grouped = (state.ingredients || []).reduce((acc, ing) => { if (!acc[ing.category]) acc[ing.category] = []; acc[ing.category].push(ing); return acc; }, {} as Record<IngredientCategory, Ingredient[]>);
    return (
      <div className="pb-32 md:pb-12 max-w-6xl mx-auto w-full md:px-8">
        <header className="px-5 pt-4 pb-2.5 sticky top-0 bg-white/95 backdrop-blur-md z-20 shadow-sm flex flex-col gap-2 rounded-b-3xl">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5"><Refrigerator className="text-emerald-500" size={26}/> Dispensa</h2>
             <div className="flex gap-1.5">
               <button onClick={() => { setIsNewIngredient(true); setEditingIngredient({ id: '', name: '', category: 'dispensa', icon: 'Bowl', tags: [] }); }} className="p-3 bg-slate-100 text-slate-500 rounded-full active:bg-emerald-500 active:text-white transition-all"><Plus size={22} /></button>
               <button onClick={() => setIsEditMode(!isEditMode)} className={`p-3 rounded-full transition-all active:scale-90 ${isEditMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>{isEditMode ? <Check size={22} strokeWidth={3} /> : <Pencil size={22} />}</button>
             </div>
          </div>
          <div className="relative mb-0.5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Cerca ingrediente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all" />
          </div>
          {renderLegend({ clickable: true, activeTags: activeIngredientTags, onToggle: (tag) => setActiveIngredientTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]) })}
        </header>
        <div className="p-4 space-y-8">
          {(Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map(cat => {
            let items = grouped[cat]?.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
            items = items.filter(i => !i.tags.some(tag => (Object.keys(INDICATORS_CONFIG) as DietTag[]).includes(tag) && !activeIngredientTags.includes(tag)));
            if (items.length === 0) return null;
            return (
              <div key={cat} className="animate-fade-in">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" /> {CATEGORY_LABELS[cat]}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {items.sort((a,b)=>a.name.localeCompare(b.name)).map(ing => {
                    const active = state.inventory.includes(ing.id);
                    return (
                      <button key={ing.id} onClick={() => handleIngredientClick(ing)} className={`relative flex flex-col items-center justify-center py-4 px-1 rounded-2xl border-2 transition-all duration-200 ${active && !isEditMode ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-[1.03]' : 'bg-white text-slate-500 border-slate-100'} ${isEditMode && 'border-dashed border-emerald-300'}`}>
                        {!isEditMode && renderIndicators(ing.tags)}
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
        </div>
      </div>
    );
  };

  const renderRecipes = () => (
    <div className="pb-32 md:pb-12 max-w-6xl mx-auto w-full md:px-8">
      <header className="p-5 md:pt-10 md:pb-8 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm flex flex-col gap-2 rounded-b-3xl">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ChefHat className="text-emerald-500" size={26}/> Ricette ({filteredRecipes.length})</h2>
            <button onClick={() => { setIsNewRecipe(true); setEditingRecipe({ id: '', name: '', category: 'Primi', ingredients: [], optionalIngredients: [], tags: [], prepTime: 15, instructions: '', nutrition: { calories: 0, protein: 0 } }); }} className="p-3 bg-slate-100 text-slate-500 rounded-full active:bg-emerald-500 active:text-white transition-all"><Plus size={22} /></button>
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
        {renderLegend({ clickable: true, activeTags: activeRecipeTags, onToggle: (tag) => setActiveRecipeTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]) })}
      </header>
      <div className="p-3 grid grid-cols-1 gap-2.5">
        {filteredRecipes.map(r => {
            const isCookable = r.ingredients.every(id => state.inventory.includes(id));
            const missing = r.ingredients.filter(id => !state.inventory.includes(id)).length;
            return (
              <div key={r.id} onClick={() => handleRecipeClick(r)} className="bg-white p-3.5 rounded-2xl border border-slate-100 flex gap-3.5 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group">
                <div className={`w-1.5 h-full absolute left-0 top-0 transition-colors ${isCookable ? 'bg-emerald-500' : 'bg-orange-300'}`} />
                <div className="flex-1 pl-1.5 space-y-1.5">
                   <div className="flex items-center">{renderIndicators(r.tags, 'recipe')}<h3 className="font-bold text-slate-800 text-[15px] leading-tight truncate group-hover:text-emerald-700">{r.name}</h3></div>
                   <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md"><Timer size={12} /> {r.prepTime}m</span>
                      {isCookable ? <span className="text-emerald-600 font-black">Pronto</span> : <span className="text-orange-400 font-black">Mancano {missing}</span>}
                   </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderBatch = () => (
    <div className="flex flex-col max-w-6xl mx-auto w-full md:px-8 h-full">
      <header className="p-4 bg-white/95 backdrop-blur-md shadow-sm flex justify-between items-center rounded-b-[2rem] sticky top-0 z-20">
         <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5"><CalendarDays className="text-emerald-500" size={22}/> Batch Cooking</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-5 pb-32 pt-2 no-scrollbar">
        {state.mealPlan.length === 0 ? (
          <div className="space-y-5 py-2">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><Zap className="text-amber-500" size={16}/> Opzioni Piano</h3>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Strategia</span>
                <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
                  <button onClick={() => setState(p=>({...p,userPreferences:{...p.userPreferences,batchStrategy:'Eco'}}))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${state.userPreferences.batchStrategy==='Eco'?'bg-white shadow text-emerald-600':'text-slate-400'}`}>Eco</button>
                  <button onClick={() => setState(p=>({...p,userPreferences:{...p.userPreferences,batchStrategy:'Variety'}}))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${state.userPreferences.batchStrategy==='Variety'?'bg-white shadow text-purple-600':'text-slate-400'}`}>Varietà</button>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3"><span className="font-bold text-slate-700 text-xs">Durata (giorni)</span><span className="font-black text-xl text-emerald-600">{batchDays}</span></div>
                <input type="range" min="1" max="7" value={batchDays} onChange={e=>setBatchDays(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-emerald-500 cursor-pointer" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {['lunch','dinner','both'].map(m=><button key={m} onClick={()=>setBatchMeals(m as any)} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${batchMeals===m?'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm':'bg-slate-50 border-slate-100 text-slate-400'}`}>{m==='lunch'?'Pranzo':m==='dinner'?'Cena':'Entrambi'}</button>)}
              </div>
              <button onClick={generatePlan} disabled={isGeneratingBatch} className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black active:scale-[0.97] shadow-xl flex justify-center items-center gap-3 transition-all h-14">
                {isGeneratingBatch ? <RefreshCw className="animate-spin" size={20}/> : 'Genera Menu'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="flex justify-between items-center px-1"><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Menu della Settimana</span><button onClick={()=>setState(p=>({...p,mealPlan:[]}))} className="text-[10px] text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100">Resetta</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {state.mealPlan.map(day=>(
                <div key={day.dayIndex} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col shadow-sm hover:border-emerald-200 transition-colors">
                   <h3 className="font-black text-slate-800 text-sm mb-3 border-b border-slate-50 pb-2">Giorno {day.dayIndex}</h3>
                   <div className="space-y-2">
                      {day.lunch && <div onClick={()=>handleRecipeClick(day.lunch!)} className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded-xl text-[11px] transition-colors group cursor-pointer border border-transparent hover:border-emerald-100"><Sun size={14} className="text-amber-500"/><span className="truncate font-bold text-slate-700 group-hover:text-emerald-800">{day.lunch.name}</span></div>}
                      {day.dinner && <div onClick={()=>handleRecipeClick(day.dinner!)} className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-xl text-[11px] transition-colors group cursor-pointer border border-transparent hover:border-indigo-100"><Moon size={14} className="text-indigo-500"/><span className="truncate font-bold text-slate-700 group-hover:text-indigo-800">{day.dinner.name}</span></div>}
                   </div>
                </div>
              ))}
            </div>
            {/* LISTA SPESA ULTRA COMPATTA */}
            <div className="bg-slate-900 text-slate-300 rounded-[1.5rem] p-4 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10" />
               <h3 className="font-black text-white text-[9px] mb-3 flex items-center gap-2 border-b border-slate-700 pb-2.5 uppercase tracking-widest"><ShoppingBasket className="text-emerald-400" size={14}/> Lista Spesa</h3>
               <ul className="grid grid-cols-2 gap-1 text-[9px] font-medium">
                  {getShoppingList().length === 0 ? <li className="opacity-50 italic py-2 col-span-2">Dispensa completa!</li> : getShoppingList().map(id => <li key={id} className="flex items-center gap-2 bg-slate-800/40 px-2 py-1 rounded-lg border border-slate-700/50"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /><span className="truncate text-slate-200">{state.ingredients.find(i=>i.id===id)?.name || id}</span></li>)}
               </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderParams = () => (
    <div className="flex flex-col max-w-6xl mx-auto w-full md:px-8 h-full">
      <header className="p-4 bg-white/95 backdrop-blur-md shadow-sm flex justify-between items-center rounded-b-[2rem] sticky top-0 z-20">
         <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5"><Settings className="text-slate-400" size={22}/> Impostazioni</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-32 pt-2 no-scrollbar">
         {/* MATRICE PASTI PIÙ COMPATTA */}
         <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm">
           <h3 className="text-[10px] font-black mb-3 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2"><SlidersHorizontal size={12} className="text-emerald-500"/> Matrice Pasti</h3>
           <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-2 text-left text-slate-300 font-black text-[9px] uppercase">Tag</th>
                  <th className="pb-2 text-center text-[8px] font-black uppercase text-slate-400">Pranzo</th>
                  <th className="pb-2 text-center text-[8px] font-black uppercase text-slate-400">Cena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(TAG_LABELS).map(([tag, conf]) => (
                  <tr key={tag} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-600 text-[11px]">{conf.label}</td>
                    {['lunch','dinner'].map(m=>(
                      <td key={m} className="p-0.5 text-center">
                        <button 
                          onClick={()=>{
                            const curr=state.userPreferences.dietMatrix[m as 'lunch'|'dinner'];
                            const upd=curr.includes(tag as DietTag)?curr.filter(t=>t!==tag):[...curr,tag];
                            setState(p=>({...p,userPreferences:{...p.userPreferences,dietMatrix:{...p.userPreferences.dietMatrix,[m]:upd}}}));
                          }} 
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all mx-auto active:scale-90 ${state.userPreferences.dietMatrix[m as 'lunch'|'dinner'].includes(tag as DietTag)?'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-50':'bg-white border-slate-100'}`}
                        >
                          {state.userPreferences.dietMatrix[m as 'lunch'|'dinner'].includes(tag as DietTag) && <Check size={14} strokeWidth={4}/>}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
         </div>

         {/* BACKUP PIÙ COMPATTO */}
         <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Download size={18} /></div>
               <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Backup Dati</h3>
                  <p className="text-[9px] text-slate-400 font-medium leading-tight">Esporta JSON</p>
               </div>
            </div>
            <button 
              onClick={()=>{const data="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(state));const dl=document.createElement('a');dl.setAttribute("href",data);dl.setAttribute("download","buonapp_backup.json");dl.click();}} 
              className="py-2.5 px-4 bg-slate-900 text-white font-black rounded-xl text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-md"
            >
              Export
            </button>
         </div>

         <div className="text-center opacity-20 py-2"><p className="text-[8px] font-black uppercase tracking-[0.4em]">BuonApp v0.8.1</p></div>
      </div>
    </div>
  );

  const MobileNavButton = ({ id, icon: IconC, activeColor, label, isBig }: { id: ViewMode; icon: any; activeColor: string; label: string, isBig?: boolean }) => {
    const isActive = activeTab === id;
    if (isBig) {
      return (
        <button 
          onClick={()=>{setSearchQuery('');setActiveTab(id);}} 
          className={`relative flex items-center justify-center transition-all active:scale-90 -mt-8 mx-1`}
        >
          <div className={`absolute -inset-1 rounded-full blur-xl opacity-40 transition-all ${isActive ? 'bg-emerald-400' : 'bg-transparent'}`} />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 transition-all ${isActive ? 'bg-emerald-500 border-emerald-300 text-white scale-110' : 'bg-white border-slate-100 text-slate-400'}`}>
            <IconC size={32} strokeWidth={3} />
          </div>
        </button>
      );
    }
    return (
      <button onClick={()=>{setSearchQuery('');setActiveTab(id);}} className="flex flex-col items-center justify-center h-full flex-1 transition-all active:scale-[0.85] relative">
        <IconC size={20} strokeWidth={isActive ? 3 : 2} className={`transition-colors duration-300 ${isActive ? activeColor : 'text-slate-400'}`} />
        <span className={`text-[7px] font-black uppercase tracking-tighter mt-1 transition-colors duration-300 ${isActive ? activeColor : 'text-slate-400'}`}>{label}</span>
      </button>
    );
  };

  const DesktopNavItem = ({ id, icon: IconC, label }: { id: ViewMode; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button onClick={()=>{setSearchQuery('');setActiveTab(id);}} className={`w-full flex items-center gap-4 px-6 py-4.5 rounded-2xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-black shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-bold'}`}>
        <IconC size={24} strokeWidth={isActive ? 2.5 : 2} /><span className="text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="h-full w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex selection:bg-emerald-200" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <aside className="hidden md:flex flex-col w-80 bg-white border-r h-full shadow-lg z-50">
           <div className="p-10 pb-8"><h1 className="text-4xl font-black text-emerald-600 tracking-tighter flex items-center gap-3"><ChefHat size={38} strokeWidth={2.5}/> BuonApp</h1></div>
           <nav className="flex-1 px-4 py-4 space-y-2.5">
               <DesktopNavItem id="home" icon={Home} label="Dashboard" />
               <DesktopNavItem id="frigo" icon={Refrigerator} label="Dispensa" />
               <DesktopNavItem id="ricette" icon={ChefHat} label="Ricettario" />
               <DesktopNavItem id="batch" icon={CalendarDays} label="Batch Cooking" />
               <DesktopNavItem id="parametri" icon={Settings} label="Impostazioni" />
           </nav>
      </aside>
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* L'animazione tab-change viene applicata ogni volta che activeTab cambia grazie alla key */}
        <div key={activeTab} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth animate-tab-change">
           {activeTab === 'home' && renderHome()}
           {activeTab === 'frigo' && renderInventory()}
           {activeTab === 'ricette' && renderRecipes()}
           {activeTab === 'batch' && renderBatch()}
           {activeTab === 'parametri' && renderParams()}
        </div>
      </main>

      <Modal isOpen={!!editingIngredient} onClose={() => setEditingIngredient(null)} title={isNewIngredient ? "Nuovo" : "Modifica"}>
          {editingIngredient && <IngredientEditor initialData={editingIngredient} isNew={isNewIngredient} onSave={saveIngredient} onDelete={deleteIngredient} onCancel={() => setEditingIngredient(null)} />}
      </Modal>

      <Modal isOpen={showRecipeListModal} onClose={() => setShowRecipeListModal(false)} title={`Tutte le Ricette (${filteredRecipes.length})`}>
        <div className="grid grid-cols-1 gap-2.5">
          {filteredRecipes.map(r => {
              const isCookable = r.ingredients.every(id => state.inventory.includes(id));
              const missing = r.ingredients.filter(id => !state.inventory.includes(id)).length;
              return (
                <div key={r.id} onClick={() => { setShowRecipeListModal(false); handleRecipeClick(r); }} className="bg-white p-3 rounded-xl border border-slate-100 flex gap-3 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group">
                  <div className={`w-1 h-full absolute left-0 top-0 transition-colors ${isCookable ? 'bg-emerald-500' : 'bg-orange-300'}`} />
                  <div className="flex-1 pl-1 space-y-1">
                     <div className="flex items-center">{renderIndicators(r.tags, 'recipe')}<h3 className="font-bold text-slate-800 text-sm leading-tight truncate group-hover:text-emerald-700">{r.name}</h3></div>
                     <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md"><Timer size={10} /> {r.prepTime}m</span>
                        {isCookable ? <span className="text-emerald-600 font-black">Pronto</span> : <span className="text-orange-400 font-black">Mancano {missing}</span>}
                     </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>

      <Modal isOpen={!!editingRecipe} onClose={() => setEditingRecipe(null)} title={isNewRecipe ? "Nuova Ricetta" : editingRecipe?.name || ""} onEdit={!isRecipeEditMode && !isNewRecipe ? () => setIsRecipeEditMode(true) : undefined}>
        {editingRecipe && (isRecipeEditMode || isNewRecipe ? <RecipeEditor initialData={editingRecipe} isNew={isNewRecipe} allIngredients={state.ingredients} inventory={state.inventory} onSave={saveRecipe} onDelete={deleteRecipe} onCancel={() => setEditingRecipe(null)} /> : 
          <div className="space-y-6 animate-fade-in pb-12">
             <div className="grid grid-cols-3 gap-3">
               <div className="bg-blue-50/50 p-3.5 rounded-2xl flex flex-col items-center text-blue-600 border border-blue-100 shadow-sm"><Clock size={20} /><span className="text-xl font-black mt-0.5">{editingRecipe.prepTime}</span><span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Minuti</span></div>
               <div className="bg-orange-50/50 p-3.5 rounded-2xl flex flex-col items-center text-orange-600 border border-orange-100 shadow-sm"><Flame size={20} /><span className="text-xl font-black mt-0.5">{editingRecipe.nutrition.calories}</span><span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Kcal</span></div>
               <div className="bg-emerald-50/50 p-3.5 rounded-2xl flex flex-col items-center text-emerald-600 border border-emerald-100 shadow-sm"><Dumbbell size={20} /><span className="text-xl font-black mt-0.5">{editingRecipe.nutrition.protein}g</span><span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Prot</span></div>
             </div>
             <div className="flex flex-wrap gap-2 justify-center py-1"><TagBadge tag={editingRecipe.category as any} />{editingRecipe.tags.map(t => <TagBadge key={t} tag={t} />)}</div>
             
             {/* INGREDIENTI RICHIESTI - 2 COLONNE */}
             <div>
               <h3 className="font-black text-slate-800 mb-3 text-[11px] uppercase border-b border-slate-50 pb-2 flex items-center gap-2 tracking-widest">Ingredienti Richiesti</h3>
               <ul className="grid grid-cols-2 gap-2">
                 {editingRecipe.ingredients.map(id => {
                   const ing = state.ingredients.find(i => i.id === id);
                   const inStock = state.inventory.includes(id);
                   return (
                     <li key={id} className={`flex items-center justify-between p-2.5 rounded-xl bg-white border shadow-sm transition-all ${inStock ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100'}`}>
                       <span className="flex items-center gap-2 font-bold text-slate-700 text-[11px] truncate">
                         {ing && <Icon name={ing.icon} size={14} className={inStock ? "text-emerald-500" : "text-slate-300"}/>}
                         <span className="truncate">{ing?.name || id}</span>
                       </span>
                       {inStock ? <Check size={14} className="text-emerald-500" strokeWidth={4} /> : <X size={14} className="text-slate-200" strokeWidth={3} />}
                     </li>
                   );
                 })}
               </ul>
             </div>
             
             {/* INGREDIENTI OPZIONALI - 2 COLONNE */}
             {editingRecipe.optionalIngredients && editingRecipe.optionalIngredients.length > 0 && (
               <div>
                 <h3 className="font-black text-slate-500 mb-3 text-[11px] uppercase border-b border-slate-50 pb-2 flex items-center gap-2 tracking-widest italic">Opzionali</h3>
                 <ul className="grid grid-cols-2 gap-2">
                   {editingRecipe.optionalIngredients.map(id => {
                     const ing = state.ingredients.find(i => i.id === id);
                     const inStock = state.inventory.includes(id);
                     return (
                       <li key={id} className={`flex items-center justify-between p-2.5 rounded-xl border border-dashed transition-all ${inStock ? 'border-emerald-200 bg-emerald-50/5 text-emerald-800' : 'border-slate-100 text-slate-400 opacity-60'}`}>
                         <span className="flex items-center gap-2 font-bold text-[11px] truncate italic">
                           {ing && <Icon name={ing.icon} size={14} className={inStock ? "text-emerald-400" : "text-slate-200"}/>}
                           <span className="truncate">{ing?.name || id}</span>
                         </span>
                         {inStock && <Check size={14} className="text-emerald-400" strokeWidth={3} />}
                       </li>
                     );
                   })}
                 </ul>
               </div>
             )}
             
             <div>
               <h3 className="font-black text-slate-800 mb-3 text-[11px] uppercase border-b border-slate-50 pb-2 flex items-center gap-2 tracking-widest">Procedimento</h3>
               <div className="p-4 bg-slate-50 rounded-[1.5rem] text-slate-600 text-[13px] leading-relaxed whitespace-pre-wrap border border-slate-100 font-medium shadow-inner">
                 {editingRecipe.instructions}
               </div>
             </div>
          </div>
        )}
      </Modal>

      {/* COMPACT FLOATING BOTTOM MENU - CENTERED ISLAND DESIGN */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
        <div className="max-w-[340px] mx-auto bg-white/95 backdrop-blur-2xl rounded-full border border-white/40 shadow-[0_12px_40px_rgba(0,0,0,0.12)] h-14 flex items-center pointer-events-auto ring-1 ring-black/5 overflow-visible">
          <div className="flex-1 flex justify-evenly items-center h-full">
            <MobileNavButton id="frigo" icon={Refrigerator} activeColor="text-cyan-500" label="Frigo" />
            <MobileNavButton id="ricette" icon={ChefHat} activeColor="text-orange-500" label="Ricette" />
          </div>
          
          <MobileNavButton id="home" icon={Home} activeColor="text-emerald-500" label="Home" isBig={true} />
          
          <div className="flex-1 flex justify-evenly items-center h-full">
            <MobileNavButton id="batch" icon={CalendarDays} activeColor="text-purple-500" label="Batch" />
            <MobileNavButton id="parametri" icon={Settings} activeColor="text-slate-800" label="Param" />
          </div>
        </div>
      </div>
    </div>
  );
}