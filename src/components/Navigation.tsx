import React from 'react';
import { Home, Calendar, ShoppingCart } from 'lucide-react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItemClass = (view: AppView) =>
    `flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === view ? 'text-chef-600' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center h-full max-w-md mx-auto">
        <button onClick={() => setView('home')} className={navItemClass('home')}>
          <Home size={24} />
          <span className="text-xs font-medium">Start</span>
        </button>

        <button onClick={() => setView('planner')} className={navItemClass('planner')}>
          <Calendar size={24} />
          <span className="text-xs font-medium">Plan</span>
        </button>

        <button onClick={() => setView('shopping')} className={navItemClass('shopping')}>
          <ShoppingCart size={24} />
          <span className="text-xs font-medium">Einkauf</span>
        </button>
      </div>
    </div>
  );
};