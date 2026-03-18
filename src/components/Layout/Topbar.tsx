
import React, { useState } from 'react';
import { 
  Menu, 
  Key, 
  Search, 
  Bell, 
  User,
  Sun,
  Moon,
  X,
  Check
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface TopbarProps {
  activeTabLabel: string;
  setIsSidebarOpen: (open: boolean) => void;
  setIsApiModalOpen: (open: boolean) => void;
  onProfileClick: () => void;
  isApiOk: boolean;
  userName: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  activeTabLabel, 
  setIsSidebarOpen, 
  setIsApiModalOpen,
  onProfileClick,
  isApiOk,
  userName,
  theme,
  toggleTheme,
  notifications,
  searchQuery,
  setSearchQuery,
  language,
  setLanguage
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
        <Menu size={20} />
      </button>
      
      {!isSearchOpen ? (
        <div className="topbar-title">
          {activeTabLabel}
        </div>
      ) : (
        <div className="flex-1 max-w-md mx-4 relative">
          <input 
            type="text" 
            className="inp w-full pl-10 pr-10 py-2" 
            placeholder="Материалдарды іздеу..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-4 ml-auto">
        <button 
          onClick={() => setIsApiModalOpen(true)}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${
            isApiOk 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400' 
              : 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400 animate-pulse'
          }`}
        >
          <Key size={14} />
          <span className="hidden md:inline">{isApiOk ? 'Gemini OK' : 'API Кілті жоқ'}</span>
        </button>

        <button className={`btn-icon w-8 h-8 sm:w-9 sm:h-9 ${isSearchOpen ? 'bg-slate-100 dark:bg-slate-800' : ''}`} onClick={() => setIsSearchOpen(!isSearchOpen)}>
          <Search size={16} />
        </button>

        <div className="relative">
          <button className="btn-icon w-8 h-8 sm:w-9 sm:h-9 relative" onClick={() => setIsNotifOpen(!isNotifOpen)}>
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
              <div className="p-4 border-bottom flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h4 className="font-bold text-sm">Хабарламалар</h4>
                {notifications.length > 0 && (
                  <button 
                    className="text-[10px] text-red-500 hover:underline"
                    onClick={async () => {
                      for (const n of notifications) {
                        await deleteNotification(n.id);
                      }
                    }}
                  >
                    Барлығын өшіру
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Хабарламалар жоқ</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-bottom hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                      onClick={() => deleteNotification(n.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-xs">{n.title}</div>
                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="text-slate-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{n.message}</div>
                      <div className="text-[9px] text-slate-400 mt-2">
                        {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Қазір'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="btn-icon w-8 h-8 sm:w-9 sm:h-9" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
};
