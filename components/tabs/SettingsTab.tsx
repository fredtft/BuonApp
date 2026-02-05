
import React from 'react';
import { Settings, SlidersHorizontal, Sun, Moon, Download, Check, X, ShieldCheck } from 'lucide-react';
import { AppState, DietTag, TAG_LABELS, DietConstraintState } from '../../types';

export const SettingsTab: React.FC<{ 
  state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>;
}> = ({ state, setState }) => {
  const getMealDescription = (meal: 'lunch' | 'dinner') => {
    const constraints = state.userPreferences.dietMatrix[meal];
    const prefix = meal === 'lunch' ? 'A pranzo' : 'A cena';
    
    const mandatory: string[] = [];
    const forbidden: string[] = [];

    for (const tagKey in constraints) {
      const tag = tagKey as DietTag;
      const s = constraints[tag];
      if (s === 1) mandatory.push(TAG_LABELS[tag]?.label.toLowerCase());
      if (s === -1) forbidden.push(TAG_LABELS[tag]?.label.toLowerCase());
    }

    if (mandatory.length === 0 && forbidden.length === 0) return `${prefix}: nessuna restrizione attiva.`;

    let parts = [];
    if (mandatory.length > 0) parts.push(`solo piatti ${mandatory.join(' e ')}`);
    if (forbidden.length > 0) parts.push(`senza ${forbidden.join(', ')}`);
    
    return `${prefix}: ${parts.join(', ')}.`;
  };

  const cycleState = (current: DietConstraintState): DietConstraintState => {
    // 0 (o undefined) -> 1 (Obbligatorio)
    // 1 -> -1 (Vietato)
    // -1 -> 0 (Autorizzato/Default)
    if (current === 1) return -1;
    if (current === -1) return 0;
    return 1; 
  };

  const StateIcon: React.FC<{ s: DietConstraintState }> = ({ s }) => {
    if (s === 1) return <ShieldCheck size={20} strokeWidth={3} />; // Obbligatorio
    if (s === -1) return <X size={20} strokeWidth={4} />; // Vietato
    return <Check size={20} strokeWidth={2} />; // Autorizzato
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full md:px-8 h-full animate-fade-in">
      <header className="p-4 bg-white/95 backdrop-blur-md shadow-sm flex justify-between items-center rounded-b-[2rem] sticky top-0 z-20">
         <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5"><Settings size={22}/> Impostazioni</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-32 pt-2 no-scrollbar">
         <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm">
           <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2"><SlidersHorizontal size={12} className="text-emerald-500"/> Matrice Pasti</h3>
           
           <div className="bg-slate-50 p-3 rounded-2xl mb-4 text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
             Ciclo: <span className="text-emerald-600 font-black">Autorizzato</span> → <span className="text-slate-900 font-black">Obbligatorio</span> → <span className="text-red-500 font-black">Vietato</span>
           </div>

           <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead><tr className="border-b border-slate-50 text-[9px] font-black uppercase text-slate-400"><th className="pb-3">Regola</th><th className="pb-3 text-center">Pranzo</th><th className="pb-3 text-center">Cena</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(TAG_LABELS).map(([tag, conf]) => (
                  <tr key={tag} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 font-bold text-slate-600 text-[12px]">{conf.label}</td>
                    {['lunch','dinner'].map(m=>(
                      <td key={m} className="p-1 text-center">
                        <button 
                          onClick={()=>{ 
                            const curr = state.userPreferences.dietMatrix[m as 'lunch'|'dinner'][tag as DietTag] || 0;
                            const next = cycleState(curr);
                            setState(p=>({
                              ...p,
                              userPreferences: {
                                ...p.userPreferences,
                                dietMatrix: {
                                  ...p.userPreferences.dietMatrix,
                                  [m]: {
                                    ...p.userPreferences.dietMatrix[m as 'lunch'|'dinner'],
                                    [tag]: next
                                  }
                                }
                              }
                            })); 
                          }} 
                          className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center transition-all mx-auto active:scale-90 ${
                            state.userPreferences.dietMatrix[m as 'lunch'|'dinner'][tag as DietTag] === 1 ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 
                            state.userPreferences.dietMatrix[m as 'lunch'|'dinner'][tag as DietTag] === -1 ? 'bg-red-500 text-white border-red-500 shadow-lg' : 
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}
                        >
                          <StateIcon s={state.userPreferences.dietMatrix[m as 'lunch'|'dinner'][tag as DietTag]} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
           <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 font-bold text-[11px] text-slate-700 italic">
             <div className="flex items-start gap-3"><Sun size={14} className="text-amber-600 shrink-0 mt-0.5" />{getMealDescription('lunch')}</div>
             <div className="flex items-start gap-3"><Moon size={14} className="text-indigo-600 shrink-0 mt-0.5" />{getMealDescription('dinner')}</div>
           </div>
         </div>
         <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4"><div className="p-3 bg-slate-50 text-slate-500 rounded-2xl"><Download size={20} /></div><div><h3 className="text-[11px] font-black uppercase text-slate-800">Backup Dati</h3><p className="text-[9px] text-slate-400 uppercase">Esporta in JSON</p></div></div>
            <button onClick={()=>{ const data="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(state)); const dl=document.createElement('a'); dl.setAttribute("href",data); dl.setAttribute("download","buonapp_backup.json"); dl.click(); }} className="py-3 px-6 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase shadow-xl">Esporta</button>
         </div>
      </div>
    </div>
  );
};
