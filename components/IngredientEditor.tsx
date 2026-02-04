import React, { useState } from 'react';
import { Trash2, Save } from 'lucide-react';
import Icon, { ICON_NAMES } from './Icon';
import { Ingredient, DietTag, IngredientCategory } from '../types';
import { CATEGORY_LABELS, TAG_LABELS } from '../constants';

const IngredientEditor: React.FC<{
  initialData: Ingredient | null;
  isNew: boolean;
  onSave: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}> = ({ initialData, isNew, onSave, onDelete, onCancel }) => {
  const [formData, setFormData] = useState<Ingredient>(() => initialData || {
    id: '',
    name: '',
    category: 'dispensa',
    icon: 'Bowl',
    tags: []
  });

  const [nameError, setNameError] = useState('');

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setNameError('Il nome è obbligatorio');
      return;
    }
    
    const finalData = { ...formData };
    if (isNew && !finalData.id) {
      finalData.id = finalData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    onSave(finalData);
  };

  const toggleTag = (tag: DietTag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Nome Ingrediente</label>
        <input 
          type="text" 
          value={formData.name}
          onChange={(e) => {
             setFormData({...formData, name: e.target.value});
             if(e.target.value) setNameError('');
          }}
          className={`w-full bg-slate-50 border ${nameError ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800`}
          placeholder="Es. Pasta Integrale"
        />
        {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFormData({...formData, category: key as IngredientCategory})}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                formData.category === key 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Icona</label>
        <div className="grid grid-cols-6 gap-2 p-1">
          {ICON_NAMES.map(iconName => (
            <button
              key={iconName}
              onClick={() => setFormData({...formData, icon: iconName})}
              className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${
                formData.icon === iconName
                ? 'bg-emerald-500 text-white shadow-md scale-105'
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Icon name={iconName} size={20} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Tag Dietetici</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TAG_LABELS).map(([tag, conf]) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag as DietTag)}
              className={`px-3 py-1 rounded-full text-xs border transition-all font-medium ${
                formData.tags.includes(tag as DietTag)
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700' 
                : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              {conf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        {!isNew && (
          <button 
            onClick={() => {
              if (confirm('Sei sicuro di voler eliminare questo ingrediente?')) {
                onDelete(formData.id);
              }
            }}
            className="px-4 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
        <button 
          onClick={onCancel}
          className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
        >
          Annulla
        </button>
        <button 
          onClick={handleSubmit}
          className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
        >
          <Save size={18} /> Salva
        </button>
      </div>
    </div>
  );
};

export default IngredientEditor;