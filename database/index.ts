import { Recipe } from '../types';
import { RECIPES_PRIMI } from './db_primi';
import { RECIPES_SECONDI } from './db_secondi';
import { RECIPES_VEG } from './db_veg';
import { RECIPES_STREETFOOD } from './db_streetfood';

export { INITIAL_INGREDIENTS } from './db_ingredients';

export const INITIAL_RECIPES: Recipe[] = [
  ...RECIPES_PRIMI,
  ...RECIPES_SECONDI,
  ...RECIPES_VEG,
  ...RECIPES_STREETFOOD
];