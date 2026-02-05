
import React from 'react';
import { CalendarDays, Settings, Zap, RefreshCw, Sun, Moon, ShoppingBasket, SlidersHorizontal, Download, Check } from 'lucide-react';
import { AppState, MealPlanDay, Recipe, DietTag } from '../../types';
import { TAG_LABELS } from '../../constants';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  batchDays: number;
  setBatchDays: (d: number) => void;
  batchMeals: 'lunch' | 'dinner' | 'both';
  setBatchMeals: (m: 'lunch' | 'dinner' | 'both') => void;
  isGeneratingBatch: boolean;
  generatePlan: () => void;
  onRecipeClick: (r: Recipe) => void;
  mode: 'batch' | 'parametri';
}

export const PlanningTab: React.FC<Props> = ({ 
  state, setState, batchDays, setBatchDays, batchMeals, setBatchMeals, 
  isGeneratingBatch, generatePlan, onRecipeClick, mode 
}) => {
  const getShoppingList = () => {
    const need = new Set<string>();
    state.mealPlan.forEach(day => {
       [day.lunch, day.dinner].forEach(r => r?.ingredients.forEach(id => { if(!state.inventory.includes(id)) need.add(id); }));
    });
    return Array.from(need);
  };

  const getMealDescription = (meal: 'lunch' | 'dinner') => {
    const constraints = state.userPreferences.dietMatrix[meal];
    const prefix = meal === 'lunch' ? 'A pranzo' : 'A cena';

    const REQUIRE_TAGS: DietTag[] = ['isVegetarian', 'isLunchbox'];
    const ALLOW_TAGS: DietTag[] = ['containsLactose', 'isGourmand', 'isExpensive', 'isHighProtein', 'containsGluten', 'isHighCarb'];

    // Fix: Access record properties directly instead of using .includes() which doesn't exist on Record.
    // Assuming 1 means required and -1 means forbidden as per DietConstraintState definition.
    const requirements = REQUIRE_TAGS.filter(t => constraints[t] === 1).map(t => TAG_LABELS[t]?.label.toLowerCase());
    const exclusions = ALLOW_TAGS.filter(t => constraints[t] === -1).map(t => TAG_LABELS[t]?.label.toLowerCase());

    if (requirements.length === 0 && exclusions.length === 0) {
      return `${prefix}: nessun vincolo, tutto è permesso.`;
    }

    let text = `${prefix}: `;
    if (requirements.length > 0) {
      text += `solo piatti ${requirements.join(' e ')}. `;
    }
    if (exclusions.length > 0) {
      text += `${requirements.length > 0 ? 'Inoltre, senza' : 'Senza'} ${exclusions.join(', ')}.`;
    }

    return text;
  };

  if (mode === 'batch') {
    return (
      <div className="flex flex-col max-w-6xl mx-auto w-full md:px-8 h-full animate-fade-in">
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
                    {/* Fix: use 'Varietà' instead of 'Variety' to match AppState type definition */}
                    <button onClick={() => setState(p=>({...p,userPreferences:{...p.userPreferences,batchStrategy:'Varietà'}}))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${state.userPreferences.batchStrategy==='Varietà'?'bg-white shadow text-purple-600':'text-slate-400'}`}>Varietà</button>
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
              <div className="flex justify-between items-center px-1"><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Menu della Settimana</span><button onClick={()=>setState(p=>({...p,mealPlan:[]}))} className="text-[10px] text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100 active:scale-95 transition-transform">Resetta</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {state.mealPlan.map(day=>(
                  <div key={day.dayIndex} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col shadow-sm hover:border-emerald-200 transition-colors">
                     <h3 className="font-black text-slate-800 text-sm mb-3 border-b border-slate-50 pb-2">Giorno {day.dayIndex}</h3>
                     <div className="space-y-2">
                        {day.lunch && <div onClick={()=>onRecipeClick(day.lunch!)} className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded-xl text-[11px] transition-colors group cursor-pointer"><Sun size={14} className="text-amber-500"/><span className="truncate font-bold text-slate-700 group-hover:text-emerald-800">{day.lunch.name}</span></div>}
                        {day.dinner && <div onClick={()=>onRecipeClick(day.dinner!)} className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-xl text-[11px] transition-colors group cursor-pointer"><Moon size={14} className="text-indigo-500"/><span className="truncate font-bold text-slate-700 group-hover:text-indigo-800">{day.dinner.name}</span></div>}
                     </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900 text-slate-300 rounded-[1.5rem] p-4 shadow-2xl relative overflow-hidden">
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
  }

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full md:px-8 h-full animate-fade-in">
      <header className="p-4 bg-white/95 backdrop-blur-md shadow-sm flex justify-between items-center rounded-b-[2rem] sticky top-0 z-20">
         <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5"><Settings className="text-slate-400" size={22}/> Impostazioni</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-32 pt-2 no-scrollbar">
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
                            // Fix: Toggle value in record instead of treating it as an array or trying to spread it as one
                            const curr = state.userPreferences.dietMatrix[m as 'lunch'|'dinner'];
                            const next = curr[tag as DietTag] === 1 ? 0 : 1;
                            setState(p=>({
                              ...p,
                              userPreferences: {
                                ...p.userPreferences,
                                dietMatrix: {
                                  ...p.userPreferences.dietMatrix,
                                  [m]: {
                                    ...curr,
                                    [tag]: next
                                  }
                                }
                              }
                            }));
                          }} 
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all mx-auto active:scale-90 ${state.userPreferences.dietMatrix[m as 'lunch'|'dinner'][tag as DietTag] === 1 ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white border-slate-100'}`}
                        >
                          {state.userPreferences.dietMatrix[m as 'lunch'|'dinner'][tag as DietTag] === 1 && <Check size={14} strokeWidth={4}/>}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
           <div className="mt-4 pt-3 border-t border-slate-50 space-y-1.5">
             <div className="flex items-center gap-2">
               <Sun size={12} className="text-amber-500 shrink-0" />
               <p className="text-[10px] font-bold text-amber-600 leading-tight italic">{getMealDescription('lunch')}</p>
             </div>
             <div className="flex items-center gap-2">
               <Moon size={12} className="text-indigo-500 shrink-0" />
               <p className="text-[10px] font-bold text-indigo-600 leading-tight italic">{getMealDescription('dinner')}</p>
             </div>
           </div>
         </div>

         <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Download size={18} /></div>
               <div><h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Backup Dati</h3><p className="text-[9px] text-slate-400 font-medium">Esporta JSON</p></div>
            </div>
            <button onClick={()=>{const data="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(state));const dl=document.createElement('a');dl.setAttribute("href",data);dl.setAttribute("download","buonapp_backup.json");dl.click();}} className="py-2.5 px-4 bg-slate-900 text-white font-black rounded-xl text-[9px] uppercase active:scale-95 shadow-md">Export</button>
         </div>
         <div className="text-center opacity-20 py-2"><p className="text-[8px] font-black uppercase tracking-[0.4em]">BuonApp v0.8.2</p></div>
      </div>
    </div>
  );
};
