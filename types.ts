export type IngredientCategory = 'dispensa' | 'verdure' | 'surgelati' | 'proteine' | 'freschi';
export type RecipeCategory = 'Primi' | 'Secondi' | 'Veg & Green' | 'Street Food';
export type DietTag = 'isVegetarian' | 'containsLactose' | 'isGourmand' | 'isExpensive' | 'isHighProtein' | 'containsGluten' | 'isHighCarb' | 'isLunchbox';

export interface Ingredient {
  id: string;
  name: string; // Italian name
  category: IngredientCategory;
  icon: string; // Lucide icon name mapping
  tags: DietTag[];
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  ingredients: string[]; // IDs of required ingredients
  optionalIngredients: string[];
  tags: DietTag[];
  prepTime: number; // minutes
  instructions: string;
  nutrition: {
    calories: number;
    protein: number;
  };
}

export type ViewMode = 'home' | 'frigo' | 'ricette' | 'batch' | 'parametri';

export interface DietMatrix {
  lunch: DietTag[];
  dinner: DietTag[];
}

export interface MealPlanDay {
  dayIndex: number; // 1 to N
  lunch?: Recipe | null;
  dinner?: Recipe | null;
}

export interface AppState {
  inventory: string[]; // List of ingredient IDs in stock
  recipes: Recipe[];
  ingredients: Ingredient[];
  favoriteIngredients: string[]; // New: IDs of favorite ingredients
  favoriteRecipes: string[]; // New: IDs of favorite recipes
  userPreferences: {
    dietMatrix: DietMatrix;
    batchStrategy: 'Eco' | 'Variety';
  };
  mealPlan: MealPlanDay[];
}