# Frontend-Architektur: State, Views, Komponenten

## Einstieg
- Mount: `src/index.tsx` rendert `<App />` in `#root`.
- `index.html` lädt Tailwind via CDN und setzt ein Theme-Extend (Farben `chef.*`, Font `Inter`).

## Hauptkomponente: `App.tsx`
`App.tsx` ist ein „Single-Page“-State-Container mit View-Switching.

### Views (Navigation)
`AppView` steuert die Oberfläche:
- `home`
- `planner`
- `shopping`
- `recipe-detail`

Navigation wird **nicht** gezeigt, wenn `view === 'recipe-detail'`.

### State-Objekte
- `view: AppView` (Start: `home`)
- `recipes: Recipe[]` (generierte Rezepte, Verlauf)
- `currentRecipe: Recipe | null` (Detailanzeige)
- `planner: PlannerDay[]` (7 Tage, ab Montag der aktuellen Woche initialisiert)
- `shoppingList: ShoppingItem[]`
- UI: `loading: boolean`, `prompt: string`

### User-Flows
#### 1) Suche („Gericht eingeben“)
- Enter/Los → `handleGenerate(prompt, 'search')`

#### 2) Vorrat
- Prompt via `window.prompt()` → `handleGenerate(ingredients, 'pantry')`

#### 3) Scan
- File Upload → Base64 (DataURL) → Prefix entfernen → `handleGenerate("Analysiere dieses Bild", 'scan', base64Data)`

#### 4) Social Link
- URL via `window.prompt()` → `handleGenerate(
  `Rezept von ${url}`, 'social'
)`

### Async-Lifecycle (Generate)
`handleGenerate`:
1. `setLoading(true)`
2. `generateRecipe(...)` (Gemini)
3. Bei Erfolg:
   - Recipe in `recipes` vorne einfügen
   - `currentRecipe` setzen
   - `view = 'recipe-detail'`
4. Bei Fehler: `alert(...)`
5. `setLoading(false)`

## Komponenten
### `Navigation`
- Bottom-Bar, Buttons: Start/Plan/Einkauf.
- Klasse hängt am `currentView`.

### `RecipeCard`
- Interner State: `activeVersion` (`student|profi|airfryer`) + `isAnimating`.
- Darstellung:
  - Title, PrepTime, (optional) Calories
  - Zutatenliste
  - Schritte
  - „Chef-Tipp“
- Action:
  - Back → `onBack()`
  - Plus-Button → `onAddToPlan(recipe, activeVersion)`

## Planner & Shopping (MVP-Logik)
### Planner
- `addToPlan(recipe, version)` wählt Zieltag (heute, sonst Index 0).
- Slots werden in Reihenfolge gefüllt: Dinner → Lunch → Breakfast.
- Remove entfernt nur Slot aus Planner (keine Rückrechnung Einkaufsliste).

### Einkaufsliste
- `updateShoppingList` aggregiert sehr simpel:
  - Match nach `item.toLowerCase()` und `unit`
  - Summiert `amount`
  - `recipeIds` werden gepflegt
- `toggleShoppingItem` toggelt `checked`.

## UI-/Layout-Constraints
- App ist auf Mobile-Card (max width `max-w-md`, centered) optimiert.
- Kein Routing (React Router etc.).

## Erweiterungspunkte
- Persistenz (LocalStorage/IndexedDB)
- Richtiger Planner-Selector (Tag/Slot wählen)
- ShoppingList „Remove“-Reconciliation
