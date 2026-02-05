
export type IngredientCategory = 'dispensa' | 'verdure' | 'surgelati' | 'proteine' | 'freschi';
export type RecipeCategory = 'Primi' | 'Secondi' | 'Veg & Green' | 'Street Food';
export type DietTag = 'isVegetarian' | 'containsLactose' | 'isGourmand' | 'isExpensive' | 'isHighProtein' | 'containsGluten' | 'isHighCarb' | 'isLunchbox';

export interface Ingredient {
  id: string;
  name: string; 
  category: IngredientCategory;
  icon: string;
  tags: DietTag[];
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  ingredients: string[];
  optionalIngredients: string[];
  tags: DietTag[];
  prepTime: number;
  instructions: string;
  nutrition: {
    calories: number;
    protein: number;
  };
}

export type ViewMode = 'home' | 'frigo' | 'ricette' | 'batch' | 'parametri';

export type DietConstraintState = -1 | 0 | 1; // -1: Vietato, 0: Autorizzato, 1: Obbligatorio

export interface DietMatrix {
  lunch: Record<DietTag, DietConstraintState>;
  dinner: Record<DietTag, DietConstraintState>;
}

export interface MealPlanDay {
  dayIndex: number;
  lunch?: Recipe | null;
  dinner?: Recipe | null;
}

export interface AppState {
  inventory: string[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  favoriteIngredients: string[];
  favoriteRecipes: string[];
  userPreferences: {
    dietMatrix: DietMatrix;
    batchStrategy: 'Eco' | 'Varietà';
  };
  mealPlan: MealPlanDay[];
}

// COSTANTI CONSOLIDATE
export const CATEGORY_LABELS: Record<string, string> = {
  dispensa: 'Dispensa',
  verdure: 'Verdure',
  surgelati: 'Surgelati',
  proteine: 'Proteine',
  freschi: 'Freschi'
};

export const TAG_LABELS: Record<string, { label: string, color: string }> = {
  isVegetarian: { label: 'Vegetariano', color: 'bg-green-100 text-green-800' },
  containsLactose: { label: 'Lattosio', color: 'bg-blue-100 text-blue-800' },
  isGourmand: { label: 'Goloso', color: 'bg-purple-100 text-purple-800' },
  isExpensive: { label: '€€€', color: 'bg-emerald-100 text-emerald-800' },
  isHighProtein: { label: 'Proteine', color: 'bg-blue-100 text-blue-800' },
  containsGluten: { label: 'Glutine', color: 'bg-orange-100 text-orange-800' },
  isHighCarb: { label: 'Carbo', color: 'bg-amber-100 text-amber-800' },
  isLunchbox: { label: 'Lunchbox', color: 'bg-teal-100 text-teal-800' }
};

export const INDICATORS_CONFIG: Partial<Record<DietTag, { color: string, label: string }>> = {
  containsLactose: { color: 'bg-blue-400', label: 'Lattosio' },
  isGourmand: { color: 'bg-purple-400', label: 'Goloso' },
  isHighCarb: { color: 'bg-amber-500', label: 'Carbo' },
  isHighProtein: { color: 'bg-blue-600', label: 'Proteine' },
};
