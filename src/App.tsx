import React, { useState, useRef } from 'react';
import { generateRecipe } from './services/geminiService';
import { Recipe, AppView, PlannerDay, ShoppingItem, VersionType } from './types';
import { Navigation } from './components/Navigation';
import { RecipeCard } from './components/RecipeCard';
import { Camera, Search, Link as LinkIcon, ShoppingBag, Trash2, CheckCircle2, Circle, Loader2 } from 'lucide-react';

// --- Helper Components for Views ---

const FeatureButton = ({ icon: Icon, label, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`${color} text-white p-4 rounded-2xl shadow-lg shadow-orange-900/5 active:scale-95 transition-transform duration-200 flex flex-col items-center justify-center h-28 w-full`}
  >
    <Icon size={28} className="mb-2" />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const PlannerView = ({ planner, recipes, onRemove }: { planner: PlannerDay[], recipes: Recipe[], onRemove: (dayIdx: number, slot: 'breakfast' | 'lunch' | 'dinner') => void }) => {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const slotLabels = {
    breakfast: 'Frühstück',
    lunch: 'Mittag',
    dinner: 'Abend'
  };

  return (
    <div className="p-4 pb-20 space-y-6 animate-in fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Wochenplan</h1>
      <div className="space-y-4">
        {planner.map((day, dayIdx) => (
          <div key={dayIdx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-700">{days[dayIdx]}</span>
              <span className="text-xs text-gray-400">{day.date}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {(['breakfast', 'lunch', 'dinner'] as const).map(slot => {
                const slotData = day.slots[slot];
                const recipe = slotData ? recipes.find(r => r.recipeId === slotData.recipeId) : null;
                return (
                  <div key={slot} className="flex items-center p-3 hover:bg-gray-50 transition-colors">
                    <span className="text-xs uppercase font-bold text-gray-400 w-16">{slotLabels[slot]}</span>
                    {recipe ? (
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{recipe.originalName}</p>
                          <p className="text-xs text-chef-600 capitalize">{slotData?.version} Edition</p>
                        </div>
                        <button onClick={() => onRemove(dayIdx, slot)} className="text-gray-300 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-300 italic">Leer</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ShoppingListView = ({ items, toggleItem }: { items: ShoppingItem[], toggleItem: (idx: number) => void }) => {
  const categories = Array.from(new Set(items.map(i => i.category || 'Sonstiges')));

  return (
    <div className="p-4 pb-20 space-y-6 animate-in fade-in">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold text-gray-900">Einkaufsliste</h1>
        <span className="text-sm text-gray-500">{items.filter(i => !i.checked).length} Artikel offen</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
          <p>Deine Einkaufsliste ist leer.</p>
          <p className="text-sm">Füge Rezepte zum Plan hinzu, um die Liste zu füllen.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.sort().map(cat => (
            <div key={cat}>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {items.map((item, idx) => {
                  if ((item.category || 'Sonstiges') !== cat) return null;
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleItem(idx)}
                      className="w-full flex items-center p-3 hover:bg-gray-50 text-left transition-colors group"
                    >
                      <div className={`mr-3 transition-colors ${item.checked ? 'text-chef-500' : 'text-gray-300 group-hover:text-chef-400'}`}>
                        {item.checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </div>
                      <div className={`flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        <span className="font-medium">{item.item}</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
                        {item.amount} {item.unit}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  // Global State
  const [view, setView] = useState<AppView>('home');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);

  // Planner State
  const [planner, setPlanner] = useState<PlannerDay[]>(() => {
    // Init current week
    const today = new Date();
    // Start from Monday (simple approximation)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        slots: {}
      };
    });
  });

  // Shopping List State
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logic ---

  const handleGenerate = async (text: string, type: Recipe['sourceType'], imageBase64?: string) => {
    setLoading(true);
    setStreamingText('');
    try {
      const newRecipe = await generateRecipe(text, type, imageBase64, {
        onUpdate: setStreamingText,
      });
      setRecipes(prev => [newRecipe, ...prev]);
      setCurrentRecipe(newRecipe);
      setView('recipe-detail');
      setPrompt('');
    } catch (e) {
      console.error('Generate failed:', e);
      const message = e instanceof Error ? e.message : String(e);
      alert(`Fehler beim Erstellen des Rezepts: ${message}`);
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Strip data:image/jpeg;base64, prefix for Gemini
      const base64Data = base64.split(',')[1];
      handleGenerate("Analysiere dieses Bild", 'scan', base64Data);
    };
    reader.readAsDataURL(file);
  };

  const addToPlan = (recipe: Recipe, version: VersionType) => {
    // For MVP, just add to the first available slot in the current day or tomorrow
    const todayStr = new Date().toISOString().split('T')[0];
    const todayIdx = planner.findIndex(p => p.date === todayStr);
    const targetIdx = todayIdx === -1 ? 0 : todayIdx;

    const newPlanner = [...planner];
    const day = newPlanner[targetIdx];

    // Simple logic: fill Dinner -> Lunch -> Breakfast
    let slotName: 'dinner' | 'lunch' | 'breakfast' | null = null;
    if (!day.slots.dinner) slotName = 'dinner';
    else if (!day.slots.lunch) slotName = 'lunch';
    else if (!day.slots.breakfast) slotName = 'breakfast';

    const slotLabels: Record<string, string> = { dinner: 'Abendessen', lunch: 'Mittagessen', breakfast: 'Frühstück' };

    if (slotName) {
      day.slots[slotName] = { recipeId: recipe.recipeId, version };
      setPlanner(newPlanner);
      updateShoppingList(recipe, version);
      alert(`Habe ${recipe.originalName} (${version}) am ${day.date} zum ${slotLabels[slotName]} hinzugefügt.`);
      setView('planner');
    } else {
      alert("Tag ist voll! (Logik ist im MVP begrenzt)");
    }
  };

  const updateShoppingList = (recipe: Recipe, version: VersionType) => {
    const newIngredients = recipe.versions[version].ingredients;
    setShoppingList(prev => {
      const next = [...prev];
      newIngredients.forEach(ing => {
        // Very simple aggregation by name
        const existingIdx = next.findIndex(i => i.item.toLowerCase() === ing.item.toLowerCase() && i.unit === ing.unit);
        if (existingIdx >= 0) {
          next[existingIdx].amount += ing.amount;
          if (!next[existingIdx].recipeIds.includes(recipe.recipeId)) {
            next[existingIdx].recipeIds.push(recipe.recipeId);
          }
        } else {
          next.push({
            ...ing,
            checked: false,
            recipeIds: [recipe.recipeId]
          });
        }
      });
      return next;
    });
  };

  const toggleShoppingItem = (idx: number) => {
    setShoppingList(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  };

  const removeFromPlan = (dayIdx: number, slot: 'breakfast' | 'lunch' | 'dinner') => {
    const newPlanner = [...planner];
    delete newPlanner[dayIdx].slots[slot];
    setPlanner(newPlanner);
    // Note: Removing from shopping list is complex without strict tracking, skipping for MVP simplification.
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white space-y-4 px-6">
        <Loader2 className="animate-spin text-chef-500" size={48} />
        <p className="text-gray-600 font-medium animate-pulse">ChefMate AI kreiert Rezepte...</p>
        {streamingText ? (
          <div className="w-full max-w-xl bg-gray-900 text-gray-100 rounded-xl p-4 shadow-lg border border-gray-800">
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Live-Stream</div>
            <pre className="text-sm whitespace-pre-wrap max-h-64 overflow-auto leading-relaxed">{streamingText.slice(-1200)}</pre>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Verbinde mit Gemini…</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Hidden File Input for Scan */}
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      {/* VIEW: HOME */}
      {view === 'home' && (
        <div className="pb-20">
          {/* Header */}
          <header className="bg-white p-6 pt-12 pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2 mb-1">
              <div className="bg-chef-500 text-white p-1.5 rounded-lg">
                <ShoppingBag size={20} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">ChefMate</h1>
            </div>
            <p className="text-gray-500">Was kochen wir heute?</p>
          </header>

          <div className="p-6 space-y-8">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Gericht eingeben (z.B. Lasagne)..."
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-chef-500 focus:border-transparent outline-none transition-all"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && prompt && handleGenerate(prompt, 'search')}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              {prompt && (
                <button
                  onClick={() => handleGenerate(prompt, 'search')}
                  className="absolute right-2 top-2 bottom-2 bg-chef-500 text-white px-4 rounded-xl font-medium text-sm hover:bg-chef-600 transition-colors"
                >
                  Los
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Schnell-Import</h2>
              <div className="grid grid-cols-3 gap-3">
                <FeatureButton
                  icon={Camera}
                  label="Karte scannen"
                  color="bg-gradient-to-br from-gray-800 to-gray-900"
                  onClick={() => fileInputRef.current?.click()}
                />
                <FeatureButton
                  icon={ShoppingBag}
                  label="Vorrat"
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  onClick={() => {
                    const ingredients = window.prompt("Zutaten eingeben (mit Komma getrennt):");
                    if (ingredients) handleGenerate(ingredients, 'pantry');
                  }}
                />
                <FeatureButton
                  icon={LinkIcon}
                  label="Social Link"
                  color="bg-gradient-to-br from-pink-500 to-rose-600"
                  onClick={() => {
                    const url = window.prompt("Rezept-URL einfügen:");
                    if (url) handleGenerate(`Rezept von ${url}`, 'social');
                  }}
                />
              </div>
            </div>

            {/* Recent Generations */}
            {recipes.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Verlauf</h2>
                <div className="space-y-3">
                  {recipes.map(r => (
                    <button
                      key={r.recipeId}
                      onClick={() => { setCurrentRecipe(r); setView('recipe-detail'); }}
                      className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-chef-200 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-chef-50 text-chef-600 flex items-center justify-center font-bold">
                          {r.originalName.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 group-hover:text-chef-600 transition-colors">{r.originalName}</p>
                          <p className="text-xs text-gray-500 capitalize">{r.sourceType} • {new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-gray-300">→</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: PLANNER */}
      {view === 'planner' && (
        <PlannerView planner={planner} recipes={recipes} onRemove={removeFromPlan} />
      )}

      {/* VIEW: SHOPPING */}
      {view === 'shopping' && (
        <ShoppingListView items={shoppingList} toggleItem={toggleShoppingItem} />
      )}

      {/* VIEW: RECIPE DETAIL */}
      {view === 'recipe-detail' && currentRecipe && (
        <RecipeCard
          recipe={currentRecipe}
          onBack={() => setView('home')}
          onAddToPlan={addToPlan}
        />
      )}

      {/* Navigation Bar */}
      {view !== 'recipe-detail' && (
        <Navigation currentView={view} setView={setView} />
      )}
    </div>
  );
};

export default App;