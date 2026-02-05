
import React from 'react';
import { CalendarDays, Zap, RefreshCw, Sun, Moon, ShoppingBasket } from 'lucide-react';
import { AppState, Recipe } from '../../types';

export const BatchTab: React.FC<{ 
  state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; batchDays: number; setBatchDays: (d: number) => void; batchMeals: 'lunch' | 'dinner' | 'both'; setBatchMeals: (m: 'lunch' | 'dinner' | 'both') => void; isGeneratingBatch: boolean; generatePlan: () => void; onRecipeClick: (r: Recipe) => void;
}> = ({ state, setState, batchDays, setBatchDays, batchMeals, setBatchMeals, isGeneratingBatch, generatePlan, onRecipeClick }) => {
  const getShoppingList = () => {
    const need = new Set<string>();
    state.mealPlan.forEach(day => { [day.lunch, day.dinner].forEach(r => r?.ingredients.forEach(id => { if(!state.inventory.includes(id)) need.add(id); })); });
    return Array.from(need);
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full md:px-8 h-full animate-fade-in">
      <header className="p-4 bg-white/95 backdrop-blur-md shadow-sm flex justify-between items-center rounded-b-[2rem] sticky top-0 z-20">
         <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5"><CalendarDays className="text-purple-500" size={22}/> Pianificatore</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-5 pb-32 pt-2 no-scrollbar">
        {state.mealPlan.length === 0 ? (
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><Zap className="text-amber-500" size={16}/> Opzioni Piano</h3>
            
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Strategia di Pianificazione</span>
              <div className="flex items-center bg-slate-200/50 p-1 rounded-2xl shadow-inner">
                <button 
                  onClick={() => setState(p => ({ ...p, userPreferences: { ...p.userPreferences, batchStrategy: 'Eco' } }))} 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${state.userPreferences.batchStrategy === 'Eco' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}
                >
                  Eco (Frigo)
                </button>
                <button 
                  onClick={() => setState(p => ({ ...p, userPreferences: { ...p.userPreferences, batchStrategy: 'Varietà' } }))} 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${state.userPreferences.batchStrategy === 'Varietà' ? 'bg-white text-purple-500 shadow-md' : 'text-slate-500'}`}
                >
                  Varietà (Spesa)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Quali Pasti?</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/50 rounded-2xl shadow-inner">
                <button 
                  onClick={() => setBatchMeals('lunch')} 
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${batchMeals === 'lunch' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}
                >
                  <Sun size={12} /> Pranzo
                </button>
                <button 
                  onClick={() => setBatchMeals('dinner')} 
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${batchMeals === 'dinner' ? 'bg-white text-indigo-500 shadow-md' : 'text-slate-500'}`}
                >
                  <Moon size={12} /> Cena
                </button>
                <button 
                  onClick={() => setBatchMeals('both')} 
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${batchMeals === 'both' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}
                >
                   Entrambi
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3 text-xs font-bold px-1 uppercase tracking-widest text-slate-400">Durata (giorni)<span className="text-xl font-black text-purple-600">{batchDays}</span></div>
              <input type="range" min="1" max="7" value={batchDays} onChange={e=>setBatchDays(+e.target.value)} className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-purple-500 cursor-pointer" />
            </div>

            <button 
              onClick={generatePlan} 
              disabled={isGeneratingBatch} 
              className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black shadow-xl flex justify-center items-center h-14 active:scale-95 transition-all"
            >
              {isGeneratingBatch ? <RefreshCw className="animate-spin" /> : 'Genera Menu'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Menu Settimanale</span>
              <button onClick={()=>setState(p=>({...p,mealPlan:[]}))} className="text-[10px] text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100 active:scale-95 transition-all">Resetta</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {state.mealPlan.map(day=>(
                <div key={day.dayIndex} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-purple-200 transition-colors">
                   <h3 className="font-black text-slate-800 text-sm mb-3 border-b border-slate-50 pb-2 flex justify-between">
                     <span>Giorno {day.dayIndex}</span>
                   </h3>
                   <div className="space-y-2 text-[11px] font-bold">
                      {day.lunch && (
                        <div onClick={()=>onRecipeClick(day.lunch!)} className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer group">
                          <Sun size={14} className="text-amber-500 group-hover:scale-110 transition-transform"/>
                          <span className="truncate group-hover:text-emerald-700 font-bold">{day.lunch.name}</span>
                        </div>
                      )}
                      {day.dinner && (
                        <div onClick={()=>onRecipeClick(day.dinner!)} className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer group">
                          <Moon size={14} className="text-indigo-500 group-hover:scale-110 transition-transform"/>
                          <span className="truncate group-hover:text-indigo-700 font-bold">{day.dinner.name}</span>
                        </div>
                      )}
                   </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 text-slate-300 rounded-[1.5rem] p-4 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
               <h3 className="font-black text-white text-[9px] mb-3 flex items-center gap-2 uppercase tracking-widest border-b border-slate-800 pb-2.5">
                 <ShoppingBasket className="text-emerald-400" size={14}/> Lista Spesa
               </h3>
               <ul className="grid grid-cols-2 gap-1.5 text-[9px] font-medium">
                  {getShoppingList().length === 0 ? (
                    <li className="opacity-50 italic col-span-2 py-2 text-center">Dispensa completa!</li>
                  ) : (
                    getShoppingList().map(id => (
                      <li key={id} className="flex items-center gap-2 bg-slate-800/40 px-2 py-1.5 rounded-lg border border-slate-700/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="truncate text-slate-200">{state.ingredients.find(i=>i.id===id)?.name || id}</span>
                      </li>
                    ))
                  )}
               </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
