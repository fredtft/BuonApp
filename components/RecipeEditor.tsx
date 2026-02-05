
import React, { useState } from 'react';
import { Trash2, Save, X, GripVertical } from 'lucide-react';
import { Recipe, Ingredient, DietTag, RecipeCategory, TAG_LABELS } from '../types';

const RecipeEditor: React.FC<{
  initialData: Recipe | null;
  isNew: boolean;
  allIngredients: Ingredient[];
  inventory: string[];
  onSave: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}> = ({ initialData, isNew, allIngredients, inventory, onSave, onDelete, onCancel }) => {
  const [formData, setFormData] = useState<Recipe>(() => initialData || {
    id: '', name: '', category: 'Primi', ingredients: [], optionalIngredients: [], tags: [], prepTime: 15, instructions: '', nutrition: { calories: 0, protein: 0 }
  });

  const toggleList = (id: string, list: 'ingredients' | 'optionalIngredients') => {
    setFormData(p => {
      const has = p[list].includes(id);
      return { ...p, [list]: has ? p[list].filter(x => x !== id) : [...p[list], id] };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {['Primi', 'Secondi', 'Veg & Green', 'Street Food'].map(cat => (
            <button key={cat} onClick={() => setFormData({...formData, category: cat as RecipeCategory})} className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${formData.category === cat ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>{cat}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-[10px] font-bold text-slate-500">MINUTI</label><input type="number" value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: +e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" /></div>
        <div><label className="text-[10px] font-bold text-slate-500">KCAL</label><input type="number" value={formData.nutrition.calories} onChange={e => setFormData({...formData, nutrition: {...formData.nutrition, calories: +e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" /></div>
        <div><label className="text-[10px] font-bold text-slate-500">PROT (G)</label><input type="number" value={formData.nutrition.protein} onChange={e => setFormData({...formData, nutrition: {...formData.nutrition, protein: +e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" /></div>
      </div>
      
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
         <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Ingredienti Necessari</label>
         <div className="flex flex-wrap gap-2 mb-2">
           {formData.ingredients.map(id => <span key={id} className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold flex items-center gap-1">{allIngredients.find(i=>i.id===id)?.name || id} <X size={12} className="cursor-pointer" onClick={() => toggleList(id, 'ingredients')}/></span>)}
         </div>
         <select value="" onChange={e => e.target.value && toggleList(e.target.value, 'ingredients')} className="w-full p-2 bg-white rounded border border-slate-200 text-xs">
           <option value="">Aggiungi ingrediente...</option>
           {allIngredients.sort((a,b)=>a.name.localeCompare(b.name)).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
         </select>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
         <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Ingredienti Facoltativi</label>
         <div className="flex flex-wrap gap-2 mb-2">
           {formData.optionalIngredients.map(id => <span key={id} className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold flex items-center gap-1">{allIngredients.find(i=>i.id===id)?.name || id} <X size={12} className="cursor-pointer" onClick={() => toggleList(id, 'optionalIngredients')}/></span>)}
         </div>
         <select value="" onChange={e => e.target.value && toggleList(e.target.value, 'optionalIngredients')} className="w-full p-2 bg-white rounded border border-slate-200 text-xs">
           <option value="">Aggiungi facoltativo...</option>
           {allIngredients.sort((a,b)=>a.name.localeCompare(b.name)).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
         </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Procedimento</label>
        <textarea value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-h-[120px]" />
      </div>
      <div className="flex gap-3 pt-4">
        {!isNew && <button onClick={() => confirm('Eliminare questa ricetta?') && onDelete(formData.id)} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={20} /></button>}
        <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Annulla</button>
        <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> Salva</button>
      </div>
    </div>
  );
};
export default RecipeEditor;
