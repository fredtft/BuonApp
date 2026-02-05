
import React, { useState, useEffect } from 'react';
import { Home, ChefHat, CalendarDays, Settings, Refrigerator, Clock, Flame, Dumbbell, X, Check } from 'lucide-react';
import Modal from './components/Modal';
import IngredientEditor from './components/IngredientEditor';
import RecipeEditor from './components/RecipeEditor';
import TagBadge from './components/TagBadge';

import { Ingredient, Recipe, AppState, ViewMode, DietTag, MealPlanDay, INDICATORS_CONFIG, DietConstraintState } from './types';
import { INITIAL_INGREDIENTS, INITIAL_RECIPES } from './database/index';

import { HomeTab } from './components/tabs/HomeTab';
import { RecipesTab } from './components/tabs/RecipesTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { BatchTab } from './components/tabs/BatchTab';
import { SettingsTab } from './components/tabs/SettingsTab';

const TABS: {id: ViewMode, icon: any, label: string}[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'frigo', icon: Refrigerator, label: 'Dispensa' },
  { id: 'ricette', icon: ChefHat, label: 'Ricette' },
  { id: 'batch', icon: CalendarDays, label: 'Batch' },
  { id: 'parametri', icon: Settings, label: 'Impostazioni' },
];

export const validateRecipeByMatrix = (r: Recipe, constraints: Record<DietTag, DietConstraintState>) => {
  if (!constraints) return true;
  for (const tagKey in constraints) {
    const tag = tagKey as DietTag;
    const state = constraints[tag];
    if (state === 1 && !r.tags.includes(tag)) return false;
    if (state === -1 && r.tags.includes(tag)) return false;
  }
  return true;
};

const getDefaultMatrix = (): Record<DietTag, DietConstraintState> => {
  const tags = ['isVegetarian', 'containsLactose', 'isGourmand', 'isExpensive', 'isHighProtein', 'containsGluten', 'isHighCarb', 'isLunchbox'] as DietTag[];
  return tags.reduce((acc, tag) => ({ ...acc, [tag]: 0 }), {} as Record<DietTag, DietConstraintState>);
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewMode>('home');
  const [homeFilterMode, setHomeFilterMode] = useState<'frigo' | 'spesa'>('frigo');
  
  const [state, setState] = useState<AppState>(() => {
    const baseState: AppState = {
      inventory: [],
      recipes: INITIAL_RECIPES,
      ingredients: INITIAL_INGREDIENTS,
      favoriteIngredients: [],
      favoriteRecipes: [],
      userPreferences: { 
        dietMatrix: { lunch: getDefaultMatrix(), dinner: getDefaultMatrix() }, 
        batchStrategy: 'Eco'
      },
      mealPlan: []
    };

    const saved = localStorage.getItem('buonapp_state');
    if (!saved) return baseState;

    try {
      const loaded = JSON.parse(saved);
      // Caricamento difensivo: verifica che le strutture chiave siano corrette
      return {
        ...baseState,
        ...loaded,
        inventory: Array.isArray(loaded.inventory) ? loaded.inventory : baseState.inventory,
        favoriteIngredients: Array.isArray(loaded.favoriteIngredients) ? loaded.favoriteIngredients : baseState.favoriteIngredients,
        favoriteRecipes: Array.isArray(loaded.favoriteRecipes) ? loaded.favoriteRecipes : baseState.favoriteRecipes,
        mealPlan: Array.isArray(loaded.mealPlan) ? loaded.mealPlan : baseState.mealPlan,
        // Mantieni i dati iniziali se quelli caricati non sono validi o sono vuoti in modo anomalo
        ingredients: (Array.isArray(loaded.ingredients) && loaded.ingredients.length > 0) ? loaded.ingredients : INITIAL_INGREDIENTS,
        recipes: (Array.isArray(loaded.recipes) && loaded.recipes.length > 0) ? loaded.recipes : INITIAL_RECIPES,
        userPreferences: {
          ...baseState.userPreferences,
          ...(loaded.userPreferences || {}),
          dietMatrix: loaded.userPreferences?.dietMatrix || baseState.userPreferences.dietMatrix
        }
      };
    } catch (e) { 
      console.error("Errore nel ripristino dello stato salvato:", e); 
      return baseState;
    }
  });

  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [recipesSearchQuery, setRecipesSearchQuery] = useState('');
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isRecipeEditMode, setIsRecipeEditMode] = useState(false);
  const [isNewIngredient, setIsNewIngredient] = useState(false);
  const [isNewRecipe, setIsNewRecipe] = useState(false);
  const [activeIngredientTags, setActiveIngredientTags] = useState<DietTag[]>(Object.keys(INDICATORS_CONFIG) as DietTag[]);
  const [batchDays, setBatchDays] = useState(3);
  const [batchMeals, setBatchMeals] = useState<'lunch' | 'dinner' | 'both'>('both');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('buonapp_state', JSON.stringify(state));
  }, [state]);

  const toggleInventoryStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.includes(id) ? prev.inventory.filter(i => i !== id) : [...prev.inventory, id]
    }));
  };

  const toggleFavoriteIngredient = (id: string) => {
    setState(prev => ({
      ...prev,
      favoriteIngredients: prev.favoriteIngredients.includes(id) ? prev.favoriteIngredients.filter(fid => fid !== id) : [...prev.favoriteIngredients, id]
    }));
  };

  const toggleFavoriteRecipe = (id: string) => {
    setState(prev => ({
      ...prev,
      favoriteRecipes: prev.favoriteRecipes.includes(id) ? prev.favoriteRecipes.filter(fid => fid !== id) : [...prev.favoriteRecipes, id]
    }));
  };

  const generatePlan = () => {
    setIsGeneratingBatch(true);
    setTimeout(() => {
      const plan: MealPlanDay[] = [];
      const historyIds = new Set<string>();
      const getScore = (recipe: Recipe, mealType: 'lunch' | 'dinner') => {
        const constraints = state.userPreferences.dietMatrix[mealType];
        if (!validateRecipeByMatrix(recipe, constraints)) return -2000;
        let score = 100;
        const owned = recipe.ingredients.filter(id => state.inventory.includes(id)).length;
        score += (owned / (recipe.ingredients.length || 1)) * 100;
        if (state.favoriteRecipes.includes(recipe.id)) score += 50;
        if (historyIds.has(recipe.id)) score -= 300; 
        return score + Math.random() * 50;
      };
      for (let d = 1; d <= batchDays; d++) {
        let lunch: Recipe | null = null, dinner: Recipe | null = null;
        if (batchMeals !== 'dinner') {
           const cand = state.recipes.map(r => ({ r, score: getScore(r, 'lunch') })).filter(x => x.score > -1000).sort((a,b) => b.score - a.score);
           if (cand.length > 0) { lunch = cand[0].r; historyIds.add(lunch.id); }
        }
        if (batchMeals !== 'lunch') {
           const cand = state.recipes.map(r => ({ r, score: getScore(r, 'dinner') })).filter(x => x.score > -1000 && x.r.id !== lunch?.id).sort((a,b) => b.score - a.score);
           if (cand.length > 0) { dinner = cand[0].r; historyIds.add(dinner.id); }
        }
        plan.push({ dayIndex: d, lunch, dinner });
      }
      setState(prev => ({ ...prev, mealPlan: plan }));
      setIsGeneratingBatch(false);
    }, 800);
  };

  const isAnyModalOpen = !!editingIngredient || !!editingRecipe || isOptionsModalOpen;

  const MobileNavButton = ({ id, icon: IconC, activeColor, label, isBig }: { id: ViewMode; icon: any; activeColor: string; label: string, isBig?: boolean }) => {
    const isActive = activeTab === id;
    if (isBig) {
      return (
        <button onClick={()=>{setActiveTab(id);}} className="relative flex items-center justify-center -mt-8 mx-1">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 transition-all ${isActive ? 'bg-emerald-500 border-emerald-300 text-white scale-110' : 'bg-white border-slate-100 text-slate-400'}`}>
            <IconC size={32} strokeWidth={3} />
          </div>
        </button>
      );
    }
    return (
      <button onClick={()=>{setActiveTab(id);}} className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-[0.85]">
        <IconC size={20} className={isActive ? activeColor : 'text-slate-400'} />
        <span className={`text-[8px] font-black uppercase mt-1 ${isActive ? activeColor : 'text-slate-400'}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="h-full w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r h-full shadow-2xl z-50">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <ChefHat size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">BuonApp</h1>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <tab.icon size={20} className={`transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span className={`text-sm tracking-tight ${activeTab === tab.id ? 'font-black' : 'font-semibold'}`}>{tab.label}</span>
              {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 h-full overflow-hidden relative">
        <div key={activeTab} className="h-full overflow-y-auto no-scrollbar animate-tab-change">
           {activeTab === 'home' && <HomeTab state={state} onRecipeClick={setEditingRecipe} homeFilterMode={homeFilterMode} setHomeFilterMode={setHomeFilterMode} onToggleFavorite={toggleFavoriteRecipe} isOptionsModalOpen={isOptionsModalOpen} setIsOptionsModalOpen={setIsOptionsModalOpen} />}
           {activeTab === 'ricette' && <RecipesTab state={state} onRecipeClick={setEditingRecipe} searchQuery={recipesSearchQuery} setSearchQuery={setRecipesSearchQuery} onToggleFavorite={toggleFavoriteRecipe} onNewRecipe={() => { setIsNewRecipe(true); setIsRecipeEditMode(true); setEditingRecipe({ id: 'r_'+Date.now(), name: '', category: 'Primi', ingredients: [], optionalIngredients: [], tags: [], prepTime: 15, instructions: '', nutrition: { calories: 0, protein: 0 } }); }} />}
           {activeTab === 'frigo' && <InventoryTab state={state} isEditMode={isEditMode} setIsEditMode={setIsEditMode} searchQuery={inventorySearchQuery} setSearchQuery={setInventorySearchQuery} onIngredientClick={ing => isEditMode ? (setEditingIngredient(ing), setIsNewIngredient(false)) : toggleInventoryStatus(ing.id)} onNewIngredient={() => { setIsNewIngredient(true); setEditingIngredient({ id: '', name: '', category: 'dispensa', icon: 'Bowl', tags: [] }); }} activeIngredientTags={activeIngredientTags} setActiveIngredientTags={setActiveIngredientTags} onToggleFavorite={toggleFavoriteIngredient} />}
           {activeTab === 'batch' && <BatchTab state={state} setState={setState} batchDays={batchDays} setBatchDays={setBatchDays} batchMeals={batchMeals} setBatchMeals={setBatchMeals} isGeneratingBatch={isGeneratingBatch} generatePlan={generatePlan} onRecipeClick={setEditingRecipe} />}
           {activeTab === 'parametri' && <SettingsTab state={state} setState={setState} />}
        </div>
      </main>

      {/* Modali */}
      <Modal isOpen={!!editingIngredient} onClose={() => setEditingIngredient(null)} title={isNewIngredient ? "Nuovo Ingrediente" : "Modifica"}>
          {editingIngredient && <IngredientEditor initialData={editingIngredient} isNew={isNewIngredient} onSave={ing => { setState(prev => { let ings = [...prev.ingredients]; if (isNewIngredient) { ing.id = ing.name.toLowerCase().replace(/\s/g,'_') + '_' + Date.now(); ings.push(ing); } else ings = ings.map(i => i.id === ing.id ? ing : i); return { ...prev, ingredients: ings }; }); setEditingIngredient(null); }} onDelete={id => { setState(p=>({...p, ingredients: p.ingredients.filter(i=>i.id!==id), inventory: p.inventory.filter(i=>i!==id)})); setEditingIngredient(null); }} onCancel={() => setEditingIngredient(null)} />}
      </Modal>
      <Modal 
        isOpen={!!editingRecipe} 
        onClose={() => { setEditingRecipe(null); setIsRecipeEditMode(false); setIsNewRecipe(false); }} 
        title={editingRecipe?.name || "Nuova Ricetta"} 
        onEdit={!isRecipeEditMode && !isNewRecipe ? () => setIsRecipeEditMode(true) : undefined}
      >
        {editingRecipe && (isRecipeEditMode || isNewRecipe ? (
          <RecipeEditor initialData={editingRecipe} isNew={isNewRecipe} allIngredients={state.ingredients} inventory={state.inventory} onSave={r => { setState(prev => { let list = [...prev.recipes]; if (isNewRecipe) list.push(r); else list = list.map(x => x.id === r.id ? r : x); return { ...prev, recipes: list }; }); setEditingRecipe(null); setIsRecipeEditMode(false); }} onDelete={id => { setState(p => ({ ...p, recipes: p.recipes.filter(x => x.id !== id) })); setEditingRecipe(null); setIsRecipeEditMode(false); }} onCancel={() => { setEditingRecipe(null); setIsRecipeEditMode(false); }} />
        ) : (
          <div className="space-y-6 pb-12 animate-fade-in">
             <div className="grid grid-cols-3 gap-3 text-center font-black">
               <div className="bg-blue-50/50 p-3 rounded-2xl"><Clock className="mx-auto text-blue-500 mb-1" size={20} />{editingRecipe.prepTime}m</div>
               <div className="bg-orange-50/50 p-3 rounded-2xl"><Flame className="mx-auto text-orange-500 mb-1" size={20} />{editingRecipe.nutrition.calories}</div>
               <div className="bg-emerald-50/50 p-3 rounded-2xl"><Dumbbell className="mx-auto text-emerald-500 mb-1" size={20} />{editingRecipe.nutrition.protein}g</div>
             </div>
             <div className="flex flex-wrap gap-2 justify-center">{editingRecipe.tags.map(t => <TagBadge key={t} tag={t} />)}</div>
             
             <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase text-slate-400">Ingredienti</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {editingRecipe.ingredients.map(id => {
                   const ing = state.ingredients.find(i=>i.id===id);
                   const inStock = state.inventory.includes(id);
                   return <div key={id} className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${inStock ? 'bg-emerald-50/20 border-emerald-200 text-emerald-700' : 'bg-red-50/20 border-red-200 text-red-600'}`}>{ing?.name || id}{inStock ? <Check size={14}/> : <X size={14}/>}</div>
                 })}
               </div>
             </div>

             <div>
               <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Procedimento</h4>
               <div className="p-4 bg-slate-50 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap border border-slate-100 font-medium text-slate-600">{editingRecipe.instructions}</div>
             </div>
          </div>
        ))}
      </Modal>

      {/* Navigazione Mobile */}
      {!isAnyModalOpen && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] safe-p-bottom bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] h-20 flex items-center px-4">
            <MobileNavButton id="frigo" icon={Refrigerator} activeColor="text-emerald-500" label="Dispensa" />
            <MobileNavButton id="ricette" icon={ChefHat} activeColor="text-orange-500" label="Ricette" />
            <MobileNavButton id="home" icon={Home} activeColor="text-emerald-600" label="Home" isBig={true} />
            <MobileNavButton id="batch" icon={CalendarDays} activeColor="text-purple-500" label="Batch" />
            <MobileNavButton id="parametri" icon={Settings} activeColor="text-slate-800" label="Impostazioni" />
        </nav>
      )}
    </div>
  );
}
