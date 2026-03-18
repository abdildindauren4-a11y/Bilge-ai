
import React from 'react';
import { Logo } from '../Common/Logo';
import { 
  LayoutDashboard, 
  BookOpen, 
  Gamepad2, 
  MessageSquare, 
  Book, 
  Settings,
  FileText,
  Code,
  MapPin,
  Calendar
} from 'lucide-react';

import { translations, Language } from '../../lib/translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isApiOk: boolean;
  onFeedbackClick: () => void;
  onOpenApiModal: () => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen,
  isApiOk,
  onFeedbackClick,
  onOpenApiModal,
  language
}) => {
  const t = translations[language];
  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={18} /> },
    { id: 'kmzh', label: t.kmzh, icon: <Book size={18} /> },
    { id: 'assessment', label: t.assessment, icon: <FileText size={18} /> },
    { id: 'map', label: t.map, icon: <MapPin size={18} /> },
    { id: 'coding', label: t.coding, icon: <Code size={18} /> },
    { id: 'games', label: t.games, icon: <Gamepad2 size={18} /> },
    { id: 'chat', label: t.chat, icon: <MessageSquare size={18} /> },
    { id: 'calendar', label: t.calendar, icon: <Calendar size={18} /> },
    { id: 'library', label: t.library, icon: <BookOpen size={18} /> },
  ];

  return (
    <>
      <div 
        className={`overlay ${isSidebarOpen ? 'show' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-wrap">
            <Logo className="w-full h-auto max-h-12" />
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Мәзір</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.id === 'chat' && <span className="nav-badge">Жаңа</span>}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">{t.settings}</div>
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('settings');
                setIsSidebarOpen(false);
              }}
            >
              <span className="nav-icon"><Settings size={18} /></span>
              {t.settings}
            </button>
            <button className="nav-item" onClick={onFeedbackClick}>
              <span className="nav-icon"><MessageSquare size={18} /></span>
              Кері байланыс
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className={`api-pill w-full flex items-center gap-2 ${isApiOk ? 'ok' : 'missing'}`}>
            <div className={`api-dot ${isApiOk ? 'ok' : 'missing'}`}></div>
            {isApiOk ? 'Gemini API Қосулы' : 'API Кілті жоқ'}
          </div>
        </div>
      </aside>
    </>
  );
};
