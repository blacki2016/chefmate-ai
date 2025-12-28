import React, { useState } from 'react';
import { Recipe, VersionType, RecipeVersion } from '../types';
import { Clock, Users, Flame, ChefHat, GraduationCap, Zap, ArrowLeft, PlusCircle } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onBack: () => void;
  onAddToPlan: (recipe: Recipe, version: VersionType) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onBack, onAddToPlan }) => {
  const [activeVersion, setActiveVersion] = useState<VersionType>('student');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleVersionChange = (version: VersionType) => {
    setIsAnimating(true);
    setActiveVersion(version);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const currentData: RecipeVersion = recipe.versions[activeVersion];

  const getThemeColor = (v: VersionType) => {
    switch (v) {
      case 'student': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'profi': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'airfryer': return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900 truncate flex-1 text-center">
          {recipe.originalName}
        </h1>
        <button 
          onClick={() => onAddToPlan(recipe, activeVersion)}
          className="p-2 -mr-2 text-chef-600 hover:bg-chef-50 rounded-full"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      {/* Version Toggles */}
      <div className="p-4 bg-gray-50/50">
        <div className="flex bg-gray-200/80 p-1 rounded-xl">
          {(['student', 'profi', 'airfryer'] as VersionType[]).map((v) => (
            <button
              key={v}
              onClick={() => handleVersionChange(v)}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeVersion === v
                  ? 'bg-white text-gray-900 shadow-sm scale-100'
                  : 'text-gray-500 hover:text-gray-700 scale-95'
              }`}
            >
              {v === 'student' && <GraduationCap size={16} className="mr-1.5" />}
              {v === 'profi' && <ChefHat size={16} className="mr-1.5" />}
              {v === 'airfryer' && <Zap size={16} className="mr-1.5" />}
              <span className="capitalize">{v}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 p-5 transition-opacity duration-200 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wide border ${getThemeColor(activeVersion)}`}>
          {activeVersion} Edition
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{currentData.title}</h2>
        
        <div className="flex items-center space-x-6 text-gray-500 text-sm mb-6">
          <div className="flex items-center">
            <Clock size={16} className="mr-1.5 text-gray-400" />
            {currentData.prepTime}
          </div>
          <div className="flex items-center">
            <Flame size={16} className="mr-1.5 text-gray-400" />
            {currentData.calories ? `${currentData.calories} kcal` : 'N/A'}
          </div>
        </div>

        {/* Ingredients */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-1.5 h-6 bg-chef-500 rounded-full mr-3"></span>
            Zutaten
          </h3>
          <ul className="space-y-3">
            {currentData.ingredients.map((ing, idx) => (
              <li key={idx} className="flex justify-between items-center text-gray-700 py-2 border-b border-gray-50 last:border-0">
                <span>{ing.item}</span>
                <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-sm text-gray-600">
                  {ing.amount} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
             <span className="w-1.5 h-6 bg-chef-500 rounded-full mr-3"></span>
            Zubereitung
          </h3>
          <div className="space-y-6">
            {currentData.steps.map((step, idx) => (
              <div key={idx} className="flex group">
                <div className="mr-4 flex-shrink-0 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-chef-100 text-chef-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm group-hover:bg-chef-500 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  {idx !== currentData.steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-100 my-1 group-hover:bg-chef-100"></div>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed pt-1 pb-4">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tip */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 rounded-2xl shadow-lg my-6">
          <div className="flex items-start">
            <div className="bg-white/20 p-2 rounded-lg mr-3">
               <ChefHat size={20} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-white/80 mb-1">Chef-Tipp</h4>
              <p className="text-gray-100 italic">"{currentData.tips}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};