export interface Ingredient {
  item: string;
  amount: number;
  unit: string;
  category?: string; // e.g., "Produce", "Dairy", "Pantry"
}

export interface RecipeVersion {
  title: string;
  prepTime: string;
  ingredients: Ingredient[];
  steps: string[];
  tips: string;
  calories?: number;
}

export interface RecipeVersions {
  student: RecipeVersion;
  profi: RecipeVersion;
  airfryer: RecipeVersion;
}

export interface Recipe {
  recipeId: string;
  originalName: string;
  versions: RecipeVersions;
  imageUrl?: string; // Optional URL for the dish
  sourceType: 'search' | 'pantry' | 'scan' | 'social';
  createdAt: number;
}

export type VersionType = 'student' | 'profi' | 'airfryer';

export interface PlannerDay {
  date: string; // ISO date string YYYY-MM-DD
  slots: {
    breakfast?: { recipeId: string; version: VersionType };
    lunch?: { recipeId: string; version: VersionType };
    dinner?: { recipeId: string; version: VersionType };
  };
}

export interface ShoppingItem extends Ingredient {
  checked: boolean;
  recipeIds: string[]; // Track which recipes triggered this item
}

export type AppView = 'home' | 'planner' | 'shopping' | 'recipe-detail';