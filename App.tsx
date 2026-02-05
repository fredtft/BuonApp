
import React, { useState, useEffect } from 'react';
import { Home, ChefHat, CalendarDays, Settings, Refrigerator, Clock, Flame, Dumbbell, X, Check } from 'lucide-react';
import Modal from './components/Modal';
import IngredientEditor from './components/IngredientEditor';
import RecipeEditor from './components/RecipeEditor';
import Icon from './components/Icon';
import TagBadge from './components/TagBadge';

import { Ingredient, Recipe, AppState, ViewMode, DietTag, MealPlanDay } from './types';
import { INDICATORS_CONFIG } from './constants';
import { INITIAL_INGREDIENTS, INITIAL_RECIPES } from './database/index';

// Import New Tab Components
import { HomeTab } from './components/tabs/HomeTab';
import { RecipesTab } from './components/tabs/RecipesTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { BatchTab } from './components/tabs/BatchTab';
import { SettingsTab } from './components/tabs/SettingsTab';

const TABS: ViewMode[] = ['frigo', 'ricette', 'home', 'batch', 'parametri'];

/**
 * Logica di validazione globale per la Matrice Pasti:
 * - Requisiti (isVegetarian, isLunchbox): se selezionati, la ricetta DEVE averli.
 * - Permessi (altri): se selezionati, la ricetta PUÒ averli. Se NON selezionati, la ricetta NON DEVE averli.
 */
export const validateRecipeByMatrix = (r: Recipe, constraints: DietTag[]) => {
  const REQUIRE_TAGS: DietTag[] = ['isVegetarian', 'isLunchbox'];
  const ALLOW_TAGS: DietTag[] = ['containsLactose', 'isGourmand', 'isExpensive', 'isHighProtein', 'containsGluten', 'isHighCarb'];

  for (const t of REQUIRE_TAGS) {
    if (constraints.includes(t) && !r.tags.includes(t)) return false;
  }
  for (const t of ALLOW_TAGS) {
    if (!constraints.includes(t) && r.tags.includes(t)) return false;
  }
  return true;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewMode>('home');
  const [homeFilterMode, setHomeFilterMode] = useState<'frigo' | 'spesa'>('frigo');
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('buonapp_state');
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        return {
          ...loaded,
          ingredients: loaded.ingredients || INITIAL_INGREDIENTS,
          recipes: loaded.recipes || INITIAL_RECIPES,
          favoriteIngredients: loaded.favoriteIngredients || [],
          favoriteRecipes: loaded.favoriteRecipes || [],
        };
      } catch (e) { console.error(e); }
    }
    return {
      inventory: [],
      recipes: INITIAL_RECIPES,
      ingredients: INITIAL_INGREDIENTS,
      favoriteIngredients: [],
      favoriteRecipes: [],
      userPreferences: { dietMatrix: { lunch: [], dinner: [] }, batchStrategy: 'Eco' },
      mealPlan: []
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    localStorage.setItem('buonapp_state', JSON.stringify(state));
  }, [state]);

  // Se non ci sono ricette cucinabili con ciò che si ha, suggerisci la modalità 'spesa'
  useEffect(() => {
    if (activeTab === 'home' && homeFilterMode === 'frigo') {
      const cookableCount = state.recipes.filter(r => r.ingredients.every(id => state.inventory.includes(id))).length;
      if (cookableCount === 0) {
        setHomeFilterMode('spesa');
      }
    }
  }, [activeTab, state.inventory, state.recipes, homeFilterMode]);

  const toggleInventoryStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.includes(id) ? prev.inventory.filter(i => i !== id) : [...prev.inventory, id]
    }));
  };

  const toggleFavoriteIngredient = (id: string) => {
    setState(prev => ({
      ...prev,
      favoriteIngredients: prev.favoriteIngredients.includes(id) 
        ? prev.favoriteIngredients.filter(fid => fid !== id) 
        : [...prev.favoriteIngredients, id]
    }));
  };

  const toggleFavoriteRecipe = (id: string) => {
    setState(prev => ({
      ...prev,
      favoriteRecipes: prev.favoriteRecipes.includes(id) 
        ? prev.favoriteRecipes.filter(fid => fid !== id) 
        : [...prev.favoriteRecipes, id]
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

  const handleNewRecipe = () => {
    setIsNewRecipe(true);
    setIsRecipeEditMode(true);
    setEditingRecipe({
      id: 'ricetta_' + Date.now(),
      name: '',
      category: 'Primi',
      ingredients: [],
      optionalIngredients: [],
      tags: [],
      prepTime: 15,
      instructions: '',
      nutrition: { calories: 0, protein: 0 }
    });
  };

  const saveIngredient = (ing: Ingredient) => {
    setState(prev => {
      let ings = [...prev.ingredients];
      if (isNewIngredient) ings.push(ing);
      else ings = ings.map(i => i.id === ing.id ? ing : i);
      return { ...prev, ingredients: ings };
    });
    setEditingIngredient(null);
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
           const cand = state.recipes
            .map(r => ({ r, score: getScore(r, 'lunch') }))
            .filter(x => x.score > -1000)
            .sort((a,b) => b.score - a.score);
           if (cand.length > 0) {
             lunch = cand[0].r;
             historyIds.add(lunch.id);
           }
        }
        if (batchMeals !== 'lunch') {
           const cand = state.recipes
            .map(r => ({ r, score: getScore(r, 'dinner') }))
            .filter(x => x.score > -1000 && x.r.id !== lunch?.id)
            .sort((a,b) => b.score - a.score);
           if (cand.length > 0) {
             dinner = cand[0].r;
             historyIds.add(dinner.id);
           }
        }
        plan.push({ dayIndex: d, lunch, dinner });
      }
      setState(prev => ({ ...prev, mealPlan: plan }));
      setIsGeneratingBatch(false);
    }, 800);
  };

  const MobileNavButton = ({ id, icon: IconC, activeColor, label, isBig }: { id: ViewMode; icon: any; activeColor: string; label: string, isBig?: boolean }) => {
    const isActive = activeTab === id;
    if (isBig) {
      return (
        <button onClick={()=>{setSearchQuery('');setActiveTab(id);}} className="relative flex items-center justify-center -mt-8 mx-1">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 transition-all ${isActive ? 'bg-emerald-500 border-emerald-300 text-white scale-110' : 'bg-white border-slate-100 text-slate-400'}`}>
            <IconC size={32} strokeWidth={3} />
          </div>
        </button>
      );
    }
    return (
      <button onClick={()=>{setSearchQuery('');setActiveTab(id);}} className="flex flex-col items-center justify-center flex-1 transition-all active:scale-[0.85]">
        <IconC size={20} className={isActive ? activeColor : 'text-slate-400'} />
        <span className={`text-[7px] font-black uppercase mt-1 ${isActive ? activeColor : 'text-slate-400'}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="h-full w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex">
      <aside className="hidden md:flex flex-col w-80 bg-white border-r h-full shadow-lg z-50 p-10">
           <h1 className="text-4xl font-black text-emerald-600 tracking-tighter flex items-center gap-3"><ChefHat size={38}/> BuonApp</h1>
           <nav className="mt-10 space-y-4">
               {TABS.map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === tab ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-slate-500 hover:bg-slate-50'}`}>
                   {tab === 'home' ? <Home/> : tab === 'frigo' ? <Refrigerator/> : tab === 'ricette' ? <ChefHat/> : tab === 'batch' ? <CalendarDays/> : <Settings/>}
                   <span className="capitalize">{tab === 'frigo' ? 'Dispensa' : tab === 'batch' ? 'Pianificatore' : tab === 'parametri' ? 'Impostazioni' : tab}</span>
                 </button>
               ))}
           </nav>
      </aside>
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        <div key={activeTab} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth animate-tab-change">
           {activeTab === 'home' && (
             <HomeTab 
               state={state} 
               onRecipeClick={(r) => { setEditingRecipe(r); setIsRecipeEditMode(false); setIsNewRecipe(false); }} 
               homeFilterMode={homeFilterMode}
               setHomeFilterMode={setHomeFilterMode}
               onToggleFavorite={toggleFavoriteRecipe}
             />
           )}
           {activeTab === 'ricette' && (
             <RecipesTab 
               state={state} 
               onRecipeClick={(r) => { setEditingRecipe(r); setIsRecipeEditMode(false); setIsNewRecipe(false); }} 
               searchQuery={searchQuery} 
               setSearchQuery={setSearchQuery}
               onToggleFavorite={toggleFavoriteRecipe}
               onNewRecipe={handleNewRecipe}
             />
           )}
           {activeTab === 'frigo' && (
             <InventoryTab 
               state={state} 
               isEditMode={isEditMode} 
               setIsEditMode={setIsEditMode} 
               searchQuery={searchQuery} 
               setSearchQuery={setSearchQuery} 
               onIngredientClick={handleIngredientClick} 
               onNewIngredient={() => { setIsNewIngredient(true); setEditingIngredient({ id: '', name: '', category: 'dispensa', icon: 'Bowl', tags: [] }); }} 
               activeIngredientTags={activeIngredientTags} 
               setActiveIngredientTags={setActiveIngredientTags}
               onToggleFavorite={toggleFavoriteIngredient}
             />
           )}
           {activeTab === 'batch' && (
             <BatchTab 
               state={state} 
               setState={setState} 
               batchDays={batchDays} 
               setBatchDays={setBatchDays} 
               batchMeals={batchMeals} 
               setBatchMeals={setBatchMeals} 
               isGeneratingBatch={isGeneratingBatch} 
               generatePlan={generatePlan} 
               onRecipeClick={(r) => { setEditingRecipe(r); setIsRecipeEditMode(false); setIsNewRecipe(false); }} 
             />
           )}
           {activeTab === 'parametri' && (
             <SettingsTab 
               state={state} 
               setState={setState} 
             />
           )}
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={!!editingIngredient} onClose={() => setEditingIngredient(null)} title={isNewIngredient ? "Nuovo Ingrediente" : "Modifica"}>
          {editingIngredient && <IngredientEditor initialData={editingIngredient} isNew={isNewIngredient} onSave={saveIngredient} onDelete={(id) => setState(p=>({...p, ingredients: p.ingredients.filter(i=>i.id!==id)}))} onCancel={() => setEditingIngredient(null)} />}
      </Modal>

      <Modal isOpen={!!editingRecipe} onClose={() => setEditingRecipe(null)} title={editingRecipe?.name || "Nuova Ricetta"} onEdit={!isRecipeEditMode && !isNewRecipe ? () => setIsRecipeEditMode(true) : undefined}>
        {editingRecipe && (isRecipeEditMode || isNewRecipe ? (
          <RecipeEditor 
            initialData={editingRecipe} 
            isNew={isNewRecipe} 
            allIngredients={state.ingredients} 
            inventory={state.inventory} 
            onSave={(r) => {
              setState(prev => {
                let newRecipes = [...prev.recipes];
                if (isNewRecipe) {
                  newRecipes.push(r);
                } else {
                  newRecipes = newRecipes.map(x => x.id === r.id ? r : x);
                }
                return { ...prev, recipes: newRecipes };
              });
              setEditingRecipe(null);
            }} 
            onDelete={(id) => {
              setState(p => ({ ...p, recipes: p.recipes.filter(x => x.id !== id) }));
              setEditingRecipe(null);
            }} 
            onCancel={() => setEditingRecipe(null)} 
          />
        ) : (
          <div className="space-y-6 animate-fade-in pb-12">
             <div className="grid grid-cols-3 gap-3 text-center">
               <div className="bg-blue-50/50 p-3 rounded-2xl"><Clock className="mx-auto text-blue-500" size={20} /><span className="text-xl font-black">{editingRecipe.prepTime}m</span></div>
               <div className="bg-orange-50/50 p-3 rounded-2xl"><Flame className="mx-auto text-orange-500" size={20} /><span className="text-xl font-black">{editingRecipe.nutrition.calories}</span></div>
               <div className="bg-emerald-50/50 p-3 rounded-2xl"><Dumbbell className="mx-auto text-emerald-500" size={20} /><span className="text-xl font-black">{editingRecipe.nutrition.protein}g</span></div>
             </div>
             
             <div className="flex flex-wrap gap-2 justify-center"><TagBadge tag={editingRecipe.category as any} />{editingRecipe.tags.map(t => <TagBadge key={t} tag={t} />)}</div>
             
             <div className="space-y-4">
               {/* INGREDIENTI RICHIESTI */}
               <div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Richiesti</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {editingRecipe.ingredients.map(id => {
                     const ing = state.ingredients.find(i=>i.id===id);
                     const inStock = state.inventory.includes(id);
                     return (
                       <div key={id} className={`flex items-center justify-between p-2.5 rounded-xl border ${inStock ? 'bg-emerald-50/10 border-emerald-200' : 'bg-red-50/10 border-red-200'}`}>
                         <span className={`text-[11px] font-bold truncate flex items-center gap-2 ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
                           {ing && <Icon name={ing.icon} size={14} className={inStock ? 'text-emerald-500' : 'text-red-400'}/>} {ing?.name || id}
                         </span>
                         {inStock ? <Check size={14} className="text-emerald-500" strokeWidth={4}/> : <X size={14} className="text-red-400" strokeWidth={3}/>}
                       </div>
                     );
                   })}
                 </div>
               </div>

               {/* INGREDIENTI OPZIONALI */}
               {editingRecipe.optionalIngredients && editingRecipe.optionalIngredients.length > 0 && (
                 <div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1 italic">Opzionali</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {editingRecipe.optionalIngredients.map(id => {
                       const ing = state.ingredients.find(i=>i.id===id);
                       const inStock = state.inventory.includes(id);
                       return (
                         <div key={id} className={`flex items-center justify-between p-2.5 rounded-xl border border-dashed ${inStock ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-100 opacity-60'}`}>
                           <span className={`text-[11px] font-bold truncate flex items-center gap-2 ${inStock ? 'text-slate-700' : 'text-slate-400'}`}>
                             {ing && <Icon name={ing.icon} size={14} className={inStock ? 'text-emerald-400' : 'text-slate-300'}/>} {ing?.name || id}
                           </span>
                           {inStock && <Check size={14} className="text-emerald-400" strokeWidth={3}/>}
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}
             </div>

             <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Procedimento</h4>
               <div className="p-4 bg-slate-50 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap border border-slate-100 font-medium text-slate-600">
                 {editingRecipe.instructions}
               </div>
             </div>
          </div>
        ))}
      </Modal>

      <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-4">
        <div className="max-w-[340px] mx-auto bg-white/95 backdrop-blur-2xl rounded-full border border-white/40 shadow-2xl h-14 flex items-center">
          <MobileNavButton id="frigo" icon={Refrigerator} activeColor="text-cyan-500" label="Frigo" />
          <MobileNavButton id="ricette" icon={ChefHat} activeColor="text-orange-500" label="Ricette" />
          <MobileNavButton id="home" icon={Home} activeColor="text-emerald-500" label="Home" isBig={true} />
          <MobileNavButton id="batch" icon={CalendarDays} activeColor="text-purple-500" label="Batch" />
          <MobileNavButton id="parametri" icon={Settings} activeColor="text-slate-800" label="Param" />
        </div>
      </div>
    </div>
  );
}
