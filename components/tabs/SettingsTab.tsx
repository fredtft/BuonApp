
import React from 'react';
import { Settings, SlidersHorizontal, Sun, Moon, Download, Check } from 'lucide-react';
import { AppState, DietTag } from '../../types';
import { TAG_LABELS } from '../../constants';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SettingsTab: React.FC<Props> = ({ state, setState }) => {
  const getMealDescription = (meal: 'lunch' | 'dinner') => {
    const constraints = state.userPreferences.dietMatrix[meal];
    const prefix = meal === 'lunch' ? 'A pranzo' : 'A cena';

    const REQUIRE_TAGS: DietTag[] = ['isVegetarian', 'isLunchbox'];
    const ALLOW_TAGS: DietTag[] = ['containsLactose', 'isGourmand', 'isExpensive', 'isHighProtein', 'containsGluten', 'isHighCarb'];

    const requirements = REQUIRE_TAGS.filter(t => constraints.includes(t)).map(t => TAG_LABELS[t]?.label.toLowerCase());
    const exclusions = ALLOW_TAGS.filter(t => !constraints.includes(t)).map(t => TAG_LABELS[t]?.label.toLowerCase());

    if (requirements.length === 0 && exclusions.length === 0) {
      return `${prefix}: nessun vincolo, tutto è permesso.`;
    }

    let text = `${prefix}: `;
    if (requirements.length > 0) text += `solo piatti ${requirements.join(' e ')}. `;
    if (exclusions.length > 0) text += `${requirements.length > 0 ? 'Inoltre, senza' : 'Senza'} ${exclusions.join(', ')}.`;

    return text;
  };

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
                            const curr=state.userPreferences.dietMatrix[m as 'lunch'|'dinner'];
                            const upd=curr.includes(tag as DietTag)?curr.filter(t=>t!==tag):[...curr,tag];
                            setState(p=>({...p,userPreferences:{...p.userPreferences,dietMatrix:{...p.userPreferences.dietMatrix,[m]:upd}}}));
                          }} 
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all mx-auto active:scale-90 ${state.userPreferences.dietMatrix[m as 'lunch'|'dinner'].includes(tag as DietTag)?'bg-emerald-500 text-white border-emerald-500 shadow-md':'bg-white border-slate-100'}`}
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
            <button 
              onClick={()=>{
                const data="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(state));
                const dl=document.createElement('a');
                dl.setAttribute("href",data);
                dl.setAttribute("download","buonapp_backup.json");
                dl.click();
              }} 
              className="py-2.5 px-4 bg-slate-900 text-white font-black rounded-xl text-[9px] uppercase active:scale-95 shadow-md"
            >
              Export
            </button>
         </div>
         <div className="text-center opacity-20 py-2"><p className="text-[8px] font-black uppercase tracking-[0.4em]">BuonApp v0.9.0</p></div>
      </div>
    </div>
  );
};
