# Domain-Modell & Datenflüsse

## Typen (`src/types.ts`)

### Ingredient
```ts
interface Ingredient {
  item: string;
  amount: number;
  unit: string;
  category?: string;
}
```
- `category` ist optional im Type, wird aber von der Gemini-Schema-Definition als **required** behandelt (siehe AI-Doc).

### RecipeVersion
```ts
interface RecipeVersion {
  title: string;
  prepTime: string;
  ingredients: Ingredient[];
  steps: string[];
  tips: string;
  calories?: number;
}
```

### Recipe
```ts
interface Recipe {
  recipeId: string;
  originalName: string;
  versions: RecipeVersions;
  imageUrl?: string;
  sourceType: 'search' | 'pantry' | 'scan' | 'social';
  createdAt: number;
}
```
- `recipeId` wird in `geminiService.ts` via `uuidv4()` erzeugt.
- `createdAt` ist `Date.now()`.

### PlannerDay
```ts
interface PlannerDay {
  date: string; // YYYY-MM-DD
  slots: {
    breakfast?: { recipeId: string; version: VersionType };
    lunch?: { recipeId: string; version: VersionType };
    dinner?: { recipeId: string; version: VersionType };
  };
}
```

### ShoppingItem
```ts
interface ShoppingItem extends Ingredient {
  checked: boolean;
  recipeIds: string[];
}
```

## Datenfluss: Generate → Recipe → Planner → Shopping

### 1) Generate
Input:
- Textprompt (search/pantry/social)
- oder Image Base64 (scan)

Output:
- `Recipe` Objekt

### 2) Recipe Detail
- UI zeigt `Recipe.versions[activeVersion]`.
- Umschalten ändert ausschließlich Darstellung, nicht Daten.

### 3) Add to Plan
- Auswahl: `(recipe, version)`.
- Planner slot speichert nur Referenz (`recipeId`) + Version.

### 4) Shopping Aggregation
- Source: `recipe.versions[version].ingredients`.
- Aggregation-Key:
  - `item` (case-insensitive)
  - `unit`

## Invarianten & implizite Annahmen
- Ingredients haben sinnvolle Einheiten, sonst ist Summierung semantisch falsch.
- `category` sollte konsistent sein (Gemüse/Milchprodukte/...) – wird durch System Instruction angestoßen.

## Fehler-/Edge-Cases
- Gemini liefert nicht parsebares JSON → `JSON.parse` wirft.
- Schema kann fehlen/abweichen → runtime error bei Zugriffen.
- `category` in Types optional vs. Schema required: UI nutzt Fallback „Sonstiges“.
