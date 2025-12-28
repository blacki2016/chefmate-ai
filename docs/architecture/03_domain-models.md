# Domänenmodelle

## Übersicht
Die Anwendung verwendet klar definierte TypeScript-Typen für alle zentralen Entitäten.

## Typen (src/types.ts)
- **Recipe**: id, title, description, ingredients, steps, categories
- **Ingredient**: name, amount, unit
- **PlannerDay**: date, recipes[]
- **ShoppingItem**: name, amount, unit, checked

## Datenfluss
- Rezepte werden von der KI generiert und im State gehalten
- Planung und Einkaufsliste sind rein clientseitig

## Validierung
- Schema-Normalisierung nach KI-Antwort
- Fehlerbehandlung bei fehlenden Feldern

## Beispiel: Recipe
```ts
export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  categories?: string[];
}
```
