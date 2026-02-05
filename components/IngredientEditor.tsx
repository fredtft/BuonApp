
import React, { useState } from 'react';
import { Trash2, Save } from 'lucide-react';
import Icon, { ICON_NAMES } from './Icon';
import { Ingredient, DietTag, IngredientCategory, CATEGORY_LABELS, TAG_LABELS } from '../types';

const IngredientEditor: React.FC<{
  initialData: Ingredient | null;
  isNew: boolean;
  onSave: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}> = ({ initialData, isNew, onSave, onDelete, onCancel }) => {
  const [formData, setFormData] = useState<Ingredient>(() => initialData || {
    id: '', name: '', category: 'dispensa', icon: 'Bowl', tags: []
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setFormData({...formData, category: key as IngredientCategory})} className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${formData.category === key ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>{label}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Icona</label>
        <div className="grid grid-cols-6 gap-2">
          {ICON_NAMES.map(name => (
            <button key={name} onClick={() => setFormData({...formData, icon: name})} className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${formData.icon === name ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}><Icon name={name} size={18} /></button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Tag</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TAG_LABELS).map(([tag, conf]) => (
            <button key={tag} onClick={() => setFormData(p => ({...p, tags: p.tags.includes(tag as DietTag) ? p.tags.filter(t=>t!==tag) : [...p.tags, tag as DietTag]}))} className={`px-3 py-1 rounded-full text-[10px] border transition-all font-bold ${formData.tags.includes(tag as DietTag) ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>{conf.label}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        {!isNew && <button onClick={() => confirm('Eliminare?') && onDelete(formData.id)} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={20} /></button>}
        <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Annulla</button>
        <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> Salva</button>
      </div>
    </div>
  );
};
export default IngredientEditor;
