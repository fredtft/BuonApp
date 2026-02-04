import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Save, X, GripVertical, Info } from 'lucide-react';
import { Recipe, Ingredient, DietTag, RecipeCategory } from '../types';
import { TAG_LABELS } from '../constants';

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
    id: '',
    name: '',
    category: 'Primi',
    ingredients: [],
    optionalIngredients: [],
    tags: [],
    prepTime: 15,
    instructions: '',
    nutrition: { calories: 0, protein: 0 }
  });

  const [nameError, setNameError] = useState('');
  const instructionsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (instructionsRef.current) {
      instructionsRef.current.style.height = 'auto';
      instructionsRef.current.style.height = instructionsRef.current.scrollHeight + 'px';
    }
  }, [formData.instructions]);

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

  const toggleIngredient = (ingId: string, isOptional: boolean) => {
    setFormData(prev => {
      const listKey = isOptional ? 'optionalIngredients' : 'ingredients';
      const list = prev[listKey] || []; 
      const has = list.includes(ingId);
      return {
        ...prev,
        [listKey]: has ? list.filter(id => id !== ingId) : [...list, ingId]
      };
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string, sourceIsOptional: boolean) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id, sourceIsOptional }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIsOptional: boolean) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { id, sourceIsOptional } = data;
      if (sourceIsOptional === targetIsOptional) return; 

      setFormData(prev => {
        const sourceList = sourceIsOptional ? [...prev.optionalIngredients] : [...prev.ingredients];
        const targetList = targetIsOptional ? [...prev.optionalIngredients] : [...prev.ingredients];
        const newSourceList = sourceList.filter(item => item !== id);
        const newTargetList = targetList.includes(id) ? targetList : [...targetList, id];

        return {
          ...prev,
          optionalIngredients: sourceIsOptional ? newSourceList : newTargetList,
          ingredients: sourceIsOptional ? newTargetList : newSourceList
        };
      });

    } catch (err) {
      console.error("Drop failed", err);
    }
  };

  const renderIngredientSelector = (label: string, isOptional: boolean) => {
    const listKey = isOptional ? 'optionalIngredients' : 'ingredients';
    const selectedIds = formData[listKey] || [];
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
        <div 
          className="bg-slate-50 rounded-xl p-3 border border-slate-200 transition-colors drag-area"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, isOptional)}
        >
           <div className="flex flex-wrap gap-2 mb-2 min-h-[30px]">
             {selectedIds.map(ingId => {
               const ing = allIngredients.find(i => i.id === ingId);
               const inStock = inventory.includes(ingId);
               return (
                 <span 
                   key={ingId} 
                   draggable
                   onDragStart={(e) => handleDragStart(e, ingId, isOptional)}
                   className={`
                     px-2 py-1 rounded-md text-sm flex items-center gap-1 border-l-4 shadow-sm bg-white cursor-move hover:scale-105 transition-transform
                     ${inStock ? 'border-emerald-500' : 'border-red-400'}
                   `}
                 >
                   <GripVertical size={12} className="text-slate-300" />
                   {ing?.name || ingId}
                   <button onClick={() => toggleIngredient(ingId, isOptional)} className="text-slate-400 hover:text-red-500 ml-1"><X size={14}/></button>
                 </span>
               );
             })}
             {selectedIds.length === 0 && <span className="text-xs text-slate-400 italic py-1 pointer-events-none">Trascina qui gli ingredienti...</span>}
           </div>
           
           <select 
              onChange={(e) => {
                if(e.target.value) {
                  toggleIngredient(e.target.value, isOptional);
                  e.target.value = '';
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2 outline-none"
            >
              <option value="">+ Aggiungi...</option>
              {allIngredients
                .filter(i => !selectedIds.includes(i.id) && !(isOptional ? formData.ingredients : formData.optionalIngredients).includes(i.id))
                .sort((a,b) => a.name.localeCompare(b.name))
                .map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} {inventory.includes(i.id) ? '✅' : ''}
                  </option>
                ))}
            </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Nome Ricetta</label>
        <input 
          type="text" 
          value={formData.name}
          onChange={(e) => {
             setFormData({...formData, name: e.target.value});
             if(e.target.value) setNameError('');
          }}
          className={`w-full bg-slate-50 border ${nameError ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500`}
          placeholder="Es. Carbonara"
        />
        {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {['Primi', 'Secondi', 'Veg & Green', 'Street Food'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFormData({...formData, category: cat as RecipeCategory})}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                formData.category === cat 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Minuti</label>
          <input 
            type="number" 
            value={formData.prepTime}
            onChange={(e) => setFormData({...formData, prepTime: parseInt(e.target.value) || 0})}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Kcal</label>
          <input 
            type="number" 
            value={formData.nutrition.calories}
            onChange={(e) => setFormData({...formData, nutrition: {...formData.nutrition, calories: parseInt(e.target.value) || 0}})}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Proteine (g)</label>
          <input 
            type="number" 
            value={formData.nutrition.protein}
            onChange={(e) => setFormData({...formData, nutrition: {...formData.nutrition, protein: parseInt(e.target.value) || 0}})}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
         <p className="text-xs text-emerald-600 mb-2 flex items-center gap-1"><Info size={12}/> Trascina per spostare tra le liste</p>
         {renderIngredientSelector("Ingredienti Richiesti", false)}
         {renderIngredientSelector("Ingredienti Opzionali", true)}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Istruzioni</label>
        <textarea 
          ref={instructionsRef}
          value={formData.instructions}
          onChange={(e) => setFormData({...formData, instructions: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none overflow-hidden leading-relaxed"
          placeholder="Passo 1: ..."
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Tag</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TAG_LABELS).map(([tag, conf]) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag as DietTag)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
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
              if (confirm('Eliminare questa ricetta?')) {
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

export default RecipeEditor;