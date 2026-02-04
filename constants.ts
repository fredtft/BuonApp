import { DietTag } from './types';

export const CATEGORY_LABELS: Record<string, string> = {
  dispensa: 'Dispensa',
  verdure: 'Verdure',
  surgelati: 'Surgelati',
  proteine: 'Proteine',
  freschi: 'Freschi'
};

export const TAG_LABELS: Record<string, { label: string, color: string }> = {
  isVegetarian: { label: 'Vegetariano', color: 'bg-green-100 text-green-800' },
  containsLactose: { label: 'Lattosio', color: 'bg-yellow-100 text-yellow-800' },
  isGourmand: { label: 'Goloso', color: 'bg-purple-100 text-purple-800' },
  isExpensive: { label: '€€€', color: 'bg-red-100 text-red-800' },
  isHighProtein: { label: 'Proteico', color: 'bg-blue-100 text-blue-800' },
  containsGluten: { label: 'Glutine', color: 'bg-orange-100 text-orange-800' },
  isHighCarb: { label: 'Carbo', color: 'bg-amber-100 text-amber-800' },
  isLunchbox: { label: 'Lunchbox', color: 'bg-teal-100 text-teal-800' }
};

export const INDICATORS_CONFIG: Partial<Record<DietTag, { color: string, label: string, isSymbol?: boolean }>> = {
  containsLactose: { color: 'bg-red-500', label: 'Lattosio' },
  isGourmand: { color: 'bg-amber-400', label: 'Goloso' },
  isHighCarb: { color: 'bg-blue-500', label: 'Carbo' },
  isHighProtein: { color: 'bg-emerald-500', label: 'Proteico' },
};