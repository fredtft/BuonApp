import { Recipe } from '../types';

export const RECIPES_STREETFOOD: Recipe[] = [
  {
    id: 'pinsa_margherita',
    name: 'Pinsa Margherita',
    category: 'Street Food',
    ingredients: ['pinsa_base', 'tomato_sauce', 'mozzarella'],
    optionalIngredients: ['herbs', 'olive_oil'],
    tags: ['isVegetarian', 'isGourmand', 'containsGluten'],
    prepTime: 15,
    instructions: "1. Condire la base con pomodoro e mozzarella.\n2. Infornare al massimo della temperatura per 5-8 min.",
    nutrition: { calories: 600, protein: 20 }
  },
  {
    id: 'pinsa_tonno_cipolla',
    name: 'Pinsa Tonno e Cipolla',
    category: 'Street Food',
    ingredients: ['pinsa_base', 'tuna_can', 'onion'],
    optionalIngredients: ['mozzarella', 'tomato_sauce'],
    tags: ['isHighProtein', 'isGourmand', 'containsGluten'],
    prepTime: 15,
    instructions: "1. Farcire con tonno e cipolle affettate.\n2. Infornare.",
    nutrition: { calories: 650, protein: 30 }
  },
  {
    id: 'pinsa_bresaola_rucola',
    name: 'Pinsa Bresaola e Rucola',
    category: 'Street Food',
    ingredients: ['pinsa_base', 'bresaola', 'arugula'],
    optionalIngredients: ['parmesan', 'olive_oil'],
    tags: ['isHighProtein', 'isGourmand', 'containsGluten'],
    prepTime: 15,
    instructions: "1. Cuocere la base bianca con un filo d'olio.\n2. Aggiungere bresaola e rucola a crudo.",
    nutrition: { calories: 550, protein: 25 }
  },
  {
    id: 'pinsa_ortolana',
    name: 'Pinsa Ortolana',
    category: 'Street Food',
    ingredients: ['pinsa_base', 'zucchini', 'peppers'],
    optionalIngredients: ['eggplant', 'mozzarella'],
    tags: ['isVegetarian', 'isGourmand', 'containsGluten'],
    prepTime: 20,
    instructions: "1. Grigliare le verdure.\n2. Disporre sulla pinsa e infornare.",
    nutrition: { calories: 500, protein: 15 }
  },
  {
    id: 'pinsa_mari_monti',
    name: 'Pinsa Mari e Monti',
    category: 'Street Food',
    ingredients: ['pinsa_base', 'shrimp', 'mushrooms'],
    optionalIngredients: ['mozzarella', 'parsley'],
    tags: ['isGourmand', 'containsGluten', 'isHighProtein'],
    prepTime: 20,
    instructions: "1. Saltare gamberi e funghi.\n2. Farcire la pinsa e infornare.",
    nutrition: { calories: 600, protein: 28 }
  },
  {
    id: 'pinsa_zucchine_gamberi',
    name: 'Pinsa Zucchine e Gamberi',
    category: 'Street Food',
    ingredients: ['pinsa_base', 'zucchini', 'shrimp'],
    optionalIngredients: ['mozzarella'],
    tags: ['isGourmand', 'containsGluten', 'isHighProtein'],
    prepTime: 20,
    instructions: "1. Farcire con zucchine a rondelle e gamberi.\n2. Infornare.",
    nutrition: { calories: 580, protein: 25 }
  },
  {
    id: 'pinsa_patate_rosmarino',
    name: 'Pinsa Patate e Rosmarino',
    category: 'Street Food',
    ingredients: ['pinsa_base', 'potato', 'herbs'],
    optionalIngredients: ['mozzarella', 'olive_oil'],
    tags: ['isVegetarian', 'isGourmand', 'containsGluten', 'isHighCarb'],
    prepTime: 20,
    instructions: "1. Tagliare le patate sottilissime.\n2. Disporre sulla base con olio e rosmarino.\n3. Infornare.",
    nutrition: { calories: 650, protein: 12 }
  },
  {
    id: 'pinsa_zucca_funghi',
    name: 'Pinsa Zucca e Funghi',
    category: 'Street Food',
    ingredients: ['pinsa_base', 'pumpkin', 'mushrooms'],
    optionalIngredients: ['mozzarella', 'bacon'],
    tags: ['isGourmand', 'containsGluten'],
    prepTime: 20,
    instructions: "1. Usare crema di zucca o zucca a fettine.\n2. Aggiungere funghi e infornare.",
    nutrition: { calories: 550, protein: 15 }
  },
  {
    id: 'piadina_pollo',
    name: 'Piadina con Pollo',
    category: 'Street Food',
    ingredients: ['piadina', 'chicken_breast', 'salad'],
    optionalIngredients: ['tomatoes', 'sauce'],
    tags: ['isHighProtein', 'containsGluten', 'isLunchbox'],
    prepTime: 15,
    instructions: "1. Grigliare il pollo.\n2. Scaldare la piadina.\n3. Farcire con pollo e verdure.",
    nutrition: { calories: 450, protein: 25 }
  },
  {
    id: 'piadina_vegetariana',
    name: 'Piadina Vegetariana',
    category: 'Street Food',
    ingredients: ['piadina', 'zucchini', 'eggplant'],
    optionalIngredients: ['mozzarella', 'peppers'],
    tags: ['isVegetarian', 'containsGluten', 'isLunchbox'],
    prepTime: 15,
    instructions: "1. Grigliare le verdure.\n2. Farcire la piadina con verdure e formaggio.",
    nutrition: { calories: 400, protein: 12 }
  },
  {
    id: 'piadina_burger',
    name: 'Piadina Burger',
    category: 'Street Food',
    ingredients: ['piadina', 'burger_beef', 'salad'],
    optionalIngredients: ['tomatoes', 'onion'],
    tags: ['isHighProtein', 'isGourmand', 'containsGluten'],
    prepTime: 15,
    instructions: "1. Cuocere l'hamburger e tagliarlo a pezzi.\n2. Farcire la piadina.",
    nutrition: { calories: 550, protein: 25 }
  },
  {
    id: 'piadina_burrito',
    name: 'Piadina Burrito',
    category: 'Street Food',
    ingredients: ['piadina', 'minced_meat', 'beans'],
    optionalIngredients: ['peppers', 'onion'],
    tags: ['isHighProtein', 'isGourmand', 'containsGluten'],
    prepTime: 20,
    instructions: "1. Rosolare carne, fagioli e spezie.\n2. Arrotolare nella piadina.",
    nutrition: { calories: 600, protein: 30 }
  },
  {
    id: 'piadina_tonno_pomodoro',
    name: 'Piadina Tonno e Pomodoro',
    category: 'Street Food',
    ingredients: ['piadina', 'tuna_can', 'tomatoes'],
    optionalIngredients: ['salad', 'onion'],
    tags: ['isHighProtein', 'containsGluten', 'isLunchbox'],
    prepTime: 10,
    instructions: "1. Scaldare la piadina.\n2. Farcire con tonno e fette di pomodoro.",
    nutrition: { calories: 400, protein: 20 }
  },
  {
    id: 'piadina_bresaola_rucola',
    name: 'Piadina Bresaola e Rucola',
    category: 'Street Food',
    ingredients: ['piadina', 'bresaola', 'arugula'],
    optionalIngredients: ['parmesan', 'lemon'],
    tags: ['isHighProtein', 'containsGluten', 'isLunchbox'],
    prepTime: 5,
    instructions: "1. Scaldare la piadina.\n2. Farcire a freddo.",
    nutrition: { calories: 380, protein: 22 }
  },
  {
    id: 'piadina_frittata',
    name: 'Piadina con Frittata',
    category: 'Street Food',
    ingredients: ['piadina', 'eggs', 'zucchini'],
    optionalIngredients: ['cheese'],
    tags: ['isVegetarian', 'containsGluten', 'isLunchbox'],
    prepTime: 15,
    instructions: "1. Fare una frittata sottile con zucchine.\n2. Metterla nella piadina e arrotolare.",
    nutrition: { calories: 450, protein: 18 }
  },
  {
    id: 'focaccia_tonno_insalata',
    name: 'Focaccia Tonno e Insalata',
    category: 'Street Food',
    ingredients: ['focaccia', 'tuna_can', 'salad'],
    optionalIngredients: ['tomatoes', 'mayo'],
    tags: ['isLunchbox', 'isGourmand', 'containsGluten'],
    prepTime: 5,
    instructions: "1. Tagliare la focaccia a metà.\n2. Farcire con tonno e insalata.",
    nutrition: { calories: 500, protein: 18 }
  }
];