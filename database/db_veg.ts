import { Recipe } from '../types';

export const RECIPES_VEG: Recipe[] = [
  {
    id: 'minestrone',
    name: 'Minestrone',
    category: 'Veg & Green',
    ingredients: ['mixed_veg', 'potato', 'tomato_sauce'],
    optionalIngredients: ['beans', 'onion', 'carrots'],
    tags: ['isVegetarian', 'isLunchbox'],
    prepTime: 40,
    instructions: "1. Tagliare tutte le verdure a cubetti.\n2. Coprire con acqua e cuocere per 40 min.\n3. Condire con un filo d'olio.",
    nutrition: { calories: 250, protein: 8 }
  },
  {
    id: 'vellutata_porri_patate',
    name: 'Vellutata Porri e Patate',
    category: 'Veg & Green',
    ingredients: ['leeks', 'potato'],
    optionalIngredients: ['butter', 'parmesan'],
    tags: ['isVegetarian', 'isGourmand'],
    prepTime: 30,
    instructions: "1. Rosolare i porri.\n2. Aggiungere le patate e brodo.\n3. Frullare tutto a fine cottura.",
    nutrition: { calories: 300, protein: 5 }
  },
  {
    id: 'zuppa_lenticchie',
    name: 'Zuppa di Lenticchie',
    category: 'Veg & Green',
    ingredients: ['lentils', 'onion', 'tomato_sauce'],
    optionalIngredients: ['carrots', 'celery'],
    tags: ['isVegetarian', 'isHighProtein'],
    prepTime: 35,
    instructions: "1. Soffriggere cipolla e carota.\n2. Unire le lenticchie e il pomodoro.\n3. Cuocere con brodo finché tenere.",
    nutrition: { calories: 350, protein: 18 }
  },
  {
    id: 'vellutata_carote_finocchi',
    name: 'Vellutata Carote e Finocchi',
    category: 'Veg & Green',
    ingredients: ['carrots', 'fennel', 'potato'],
    optionalIngredients: ['onion', 'olive_oil'],
    tags: ['isVegetarian'],
    prepTime: 30,
    instructions: "1. Bollire carote, finocchi e patate.\n2. Frullare tutto con un po' di acqua di cottura.\n3. Condire con olio a crudo.",
    nutrition: { calories: 200, protein: 4 }
  },
  {
    id: 'vellutata_cavolfiore',
    name: 'Vellutata di Cavolfiore',
    category: 'Veg & Green',
    ingredients: ['cauliflower', 'potato'],
    optionalIngredients: ['parmesan', 'olive_oil'],
    tags: ['isVegetarian'],
    prepTime: 25,
    instructions: "1. Lessare cavolfiore e patate.\n2. Frullare fino a ottenere una crema liscia.",
    nutrition: { calories: 180, protein: 6 }
  },
  {
    id: 'zuppa_crostini',
    name: 'Zuppa con Crostini',
    category: 'Veg & Green',
    ingredients: ['soup_ready', 'bread'],
    optionalIngredients: ['olive_oil', 'parmesan'],
    tags: ['isVegetarian', 'isHighCarb'],
    prepTime: 10,
    instructions: "1. Scaldare la zuppa.\n2. Tostare il pane a cubetti.\n3. Servire caldo.",
    nutrition: { calories: 300, protein: 10 }
  },
  {
    id: 'vellutata_zucca_carote',
    name: 'Vellutata Zucca e Carote',
    category: 'Veg & Green',
    ingredients: ['pumpkin', 'carrots', 'potato'],
    optionalIngredients: ['onion', 'herbs'],
    tags: ['isVegetarian'],
    prepTime: 30,
    instructions: "1. Cuocere zucca e carote nel brodo.\n2. Frullare e condire con rosmarino.",
    nutrition: { calories: 220, protein: 4 }
  },
  {
    id: 'burger_veg_piselli',
    name: 'Burger Veg e Piselli',
    category: 'Veg & Green',
    ingredients: ['veggie_burger', 'peas'],
    optionalIngredients: ['salad', 'tomatoes'],
    tags: ['isVegetarian', 'isHighProtein'],
    prepTime: 15,
    instructions: "1. Cuocere i burger in padella.\n2. Saltare i piselli come contorno.",
    nutrition: { calories: 400, protein: 20 }
  },
  {
    id: 'melanzane_funghetto',
    name: 'Melanzane a Funghetto',
    category: 'Veg & Green',
    ingredients: ['eggplant', 'tomato_sauce', 'garlic'],
    optionalIngredients: ['herbs', 'olive_oil'],
    tags: ['isVegetarian'],
    prepTime: 25,
    instructions: "1. Tagliare le melanzane a cubetti.\n2. Friggere o rosolare con aglio.\n3. Aggiungere pomodoro e basilico.",
    nutrition: { calories: 250, protein: 4 }
  },
  {
    id: 'patate_forno',
    name: 'Patate al Forno',
    category: 'Veg & Green',
    ingredients: ['potato', 'herbs'],
    optionalIngredients: ['olive_oil', 'garlic'],
    tags: ['isVegetarian', 'isHighCarb'],
    prepTime: 40,
    instructions: "1. Tagliare le patate a spicchi.\n2. Condire con olio e rosmarino.\n3. Infornare a 200°C per 35 min.",
    nutrition: { calories: 350, protein: 6 }
  },
  {
    id: 'polpette_ceci',
    name: 'Polpette di Ceci',
    category: 'Veg & Green',
    ingredients: ['chickpeas', 'eggs', 'bread'],
    optionalIngredients: ['parsley', 'garlic'],
    tags: ['isVegetarian', 'isHighProtein', 'isLunchbox'],
    prepTime: 25,
    instructions: "1. Frullare ceci, uova e pane.\n2. Formare polpette.\n3. Cuocere in forno o padella.",
    nutrition: { calories: 380, protein: 15 }
  },
  {
    id: 'tortino_patate_funghi',
    name: 'Tortino Patate e Funghi',
    category: 'Veg & Green',
    ingredients: ['potato', 'mushrooms', 'parmesan'],
    optionalIngredients: ['mozzarella', 'eggs'],
    tags: ['isVegetarian', 'isGourmand', 'containsLactose'],
    prepTime: 45,
    instructions: "1. Lessare e schiacciare le patate.\n2. Trifolare i funghi.\n3. Alternare strati in teglia e infornare.",
    nutrition: { calories: 420, protein: 12 }
  },
  {
    id: 'pure_olio',
    name: 'Purè all\'Olio',
    category: 'Veg & Green',
    ingredients: ['potato', 'olive_oil'],
    optionalIngredients: ['parmesan'],
    tags: ['isVegetarian'],
    prepTime: 25,
    instructions: "1. Lessare le patate.\n2. Schiacciare e montare con olio e acqua di cottura.",
    nutrition: { calories: 300, protein: 5 }
  },
  {
    id: 'zucchine_melanzane_trifolate',
    name: 'Zucchine e Melanzane Trifolate',
    category: 'Veg & Green',
    ingredients: ['zucchini', 'eggplant', 'garlic'],
    optionalIngredients: ['herbs', 'olive_oil'],
    tags: ['isVegetarian'],
    prepTime: 20,
    instructions: "1. Tagliare a cubetti.\n2. Saltare in padella con aglio e prezzemolo.",
    nutrition: { calories: 150, protein: 4 }
  },
  {
    id: 'finocchi_gratinati',
    name: 'Finocchi Gratinati',
    category: 'Veg & Green',
    ingredients: ['fennel', 'parmesan'],
    optionalIngredients: ['butter', 'bread'],
    tags: ['isVegetarian', 'containsLactose'],
    prepTime: 30,
    instructions: "1. Lessare i finocchi.\n2. Cospargere di parmigiano e gratinare in forno.",
    nutrition: { calories: 200, protein: 8 }
  },
  {
    id: 'cavolfiore_arrosto',
    name: 'Cavolfiore Arrosto',
    category: 'Veg & Green',
    ingredients: ['cauliflower', 'herbs'],
    optionalIngredients: ['olive_oil', 'chili'],
    tags: ['isVegetarian'],
    prepTime: 30,
    instructions: "1. Dividere in cimette.\n2. Condire con spezie e olio.\n3. Arrostire in forno.",
    nutrition: { calories: 120, protein: 5 }
  },
  {
    id: 'funghi_trifolati',
    name: 'Funghi Trifolati',
    category: 'Veg & Green',
    ingredients: ['mushrooms', 'garlic', 'herbs'],
    optionalIngredients: ['olive_oil'],
    tags: ['isVegetarian'],
    prepTime: 15,
    instructions: "1. Affettare i funghi.\n2. Saltare con aglio e prezzemolo a fiamma viva.",
    nutrition: { calories: 100, protein: 4 }
  },
  {
    id: 'fagiolini_umido',
    name: 'Fagiolini in Umido',
    category: 'Veg & Green',
    ingredients: ['green_beans', 'tomato_sauce'],
    optionalIngredients: ['onion', 'garlic'],
    tags: ['isVegetarian'],
    prepTime: 25,
    instructions: "1. Soffriggere la cipolla.\n2. Aggiungere fagiolini e pomodoro.\n3. Cuocere coperto.",
    nutrition: { calories: 150, protein: 5 }
  },
  {
    id: 'insalatona_ricca',
    name: 'Insalatona Ricca',
    category: 'Veg & Green',
    ingredients: ['salad', 'tomatoes', 'mozzarella'],
    optionalIngredients: ['eggs', 'olives', 'corn'],
    tags: ['isVegetarian', 'isLunchbox', 'isHighProtein'],
    prepTime: 10,
    instructions: "1. Unire tutti gli ingredienti in una ciotola.\n2. Condire a piacere.",
    nutrition: { calories: 450, protein: 20 }
  },
  {
    id: 'insalata_fagiolini_patate',
    name: 'Insalata Fagiolini e Patate',
    category: 'Veg & Green',
    ingredients: ['green_beans', 'potato'],
    optionalIngredients: ['onion', 'olive_oil'],
    tags: ['isVegetarian', 'isLunchbox'],
    prepTime: 25,
    instructions: "1. Lessare patate e fagiolini.\n2. Lasciar raffreddare e condire con olio e aceto.",
    nutrition: { calories: 250, protein: 6 }
  },
  {
    id: 'insalata_mista',
    name: 'Insalata Mista',
    category: 'Veg & Green',
    ingredients: ['salad', 'tomatoes', 'carrots'],
    optionalIngredients: ['fennel', 'olives'],
    tags: ['isVegetarian'],
    prepTime: 10,
    instructions: "1. Lavare e tagliare le verdure.\n2. Unire in ciotola e condire.",
    nutrition: { calories: 100, protein: 2 }
  }
];