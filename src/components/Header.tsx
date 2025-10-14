import React from 'react';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';
import { ResetIcon } from './icons/ResetIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { User } from '../types';

interface HeaderProps {
    onReset: () => void;
    isSheetLoaded: boolean;
    language: string;
    onLanguageChange: (language: string) => void;
    view: 'chat' | 'admin';
    onViewToggle: () => void;
    user: User | null;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, isSheetLoaded, language, onLanguageChange, view, onViewToggle, user, onLogout }) => {
  return (
    <header className="bg-brand-primary text-white p-4 shadow-md flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <WrenchScrewdriverIcon className="h-8 w-8" />
        <h1 className="text-2xl font-bold">Service Engineer AI Assistant</h1>
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-2">
              <LanguageIcon className="h-6 w-6 text-white"/>
              <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="bg-brand-primary border border-brand-secondary rounded-md text-white text-sm font-semibold py-2 pl-2 pr-8 focus:ring-2 focus:ring-white appearance-none"
                  style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em'}}
                  aria-label="Select language"
              >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="pa">ਪੰਜਾਬੀ</option>
                  <option value="ta">தமிழ்</option>
                  <option value="kn">ಕನ್ನಡ</option>
                  <option value="gu">ગુજરાતી</option>
              </select>
          </div>
        )}

        {user?.role === 'admin' && (
          <button
              onClick={onViewToggle}
              aria-label={view === 'admin' ? "Back to Chat" : "Manage Knowledge Base"}
              title={view === 'admin' ? "Back to Chat" : "Manage Knowledge Base"}
              className="flex items-center space-x-2 px-3 py-2 rounded-md bg-brand-secondary hover:bg-blue-500 transition-colors"
          >
              <Cog6ToothIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">{view === 'admin' ? "Back to Chat" : "Admin Panel"}</span>
          </button>
        )}
        
        {user?.role === 'admin' && view === 'admin' && (
            <button
                onClick={onReset}
                disabled={!isSheetLoaded}
                aria-label="Reset Knowledge Base"
                title="Reset Knowledge Base"
                className="flex items-center space-x-2 px-3 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 transition-colors disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ResetIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Reset</span>
            </button>
        )}
        
        {user && (
           <button
                onClick={onLogout}
                aria-label="Logout"
                title="Logout"
                className="flex items-center space-x-2 px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 transition-colors"
            >
                <LogoutIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Logout</span>
            </button>
        )}
      </div>
    </header>
  );
};