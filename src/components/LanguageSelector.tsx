import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
        <Languages className="w-3.5 h-3.5" />
      </div>
      <select
        value={i18n.language}
        onChange={changeLanguage}
        className="appearance-none bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 pl-8 pr-8 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 transition-all shadow-sm cursor-pointer focus:outline-none focus:border-indigo-500"
      >
        <option value="en">English</option>
        <option value="zh-CN">简体中文</option>
        <option value="zh-TW">繁體中文</option>
      </select>
      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
