
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  Book, 
  Gamepad2, 
  Trophy, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  Lightbulb,
  FileText,
  LogOut,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error-handling';
import { User } from '../types';

interface DashboardViewProps {
  user: User | null;
  onNavigate: (tab: string, item?: any) => void;
  searchQuery: string;
  t: any;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate, searchQuery, t, onLogout }) => {
  const [stats, setStats] = useState({ kmzh: 0, games: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, 'library'), 
        where('userId', '==', user.uid),
        limit(50) // Fetch more to allow in-memory sorting
      );
      const querySnapshot = await getDocs(q);
      const library = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
      
      const kmzhCount = library.filter((item: any) => item.type === 'ҚМЖ').length;
      const gamesCount = library.filter((item: any) => item.type === 'Ойын').length;
      setStats({ kmzh: kmzhCount, games: gamesCount });
      setRecent(library.slice(0, 10));
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      handleFirestoreError(err, OperationType.GET, 'library');
    }
  };

  const filteredRecent = recent.filter(item => {
    const query = searchQuery.toLowerCase();
    const title = (item.title || '').toLowerCase();
    const subject = (item.subject || '').toLowerCase();
    const type = (item.type || '').toLowerCase();
    return title.includes(query) || subject.includes(query) || type.includes(query);
  }).slice(0, 5);

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fu relative"
    >
      <div className="hero mb-8">
        <div className="hero-tag">
          <Zap size={14} className="text-yellow-300" />
          <span translate="no">Bilge AI</span> — Сіздің көмекшіңіз
        </div>
        <h1>{t.welcome}, <span>{user.name}!</span></h1>
        <p className="max-w-2xl">Бүгін сабақ жоспарын жасауға немесе жаңа ойындар генерациялауға дайынсыз ба? AI сізге көмектеседі.</p>
        <div className="hero-btns">
          <button className="hero-btn-main" onClick={() => onNavigate('kmzh')}>
            {t.startWork} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Account Section - Shown only on small screens inside hero or as a card */}
      <div className="lg:hidden w-full bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-white mb-8">
        <div className="flex items-center gap-3 mb-4">
          {user.picture ? (
            <img src={user.picture} alt={user.name || ''} className="w-12 h-12 rounded-full border-2 border-white/30" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
              <UserIcon size={24} />
            </div>
          )}
          <div className="overflow-hidden">
            <div className="font-bold truncate">{user.name}</div>
            <div className="text-xs opacity-70 truncate">{user.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            <LogOut size={16} />
            {t.logout}
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            <RefreshCw size={16} />
            {t.switchAccount}
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card cursor-pointer" onClick={() => onNavigate('library')}>
          <div className="stat-icon text-blue-600"><Book size={24} /></div>
          <div className="stat-num">{stats.kmzh}</div>
          <div className="stat-label">{t.stats.kmzh}</div>
        </div>
        <div className="stat-card cursor-pointer" onClick={() => onNavigate('library')}>
          <div className="stat-icon text-green-500"><Gamepad2 size={24} /></div>
          <div className="stat-num">{stats.games}</div>
          <div className="stat-label">{t.stats.games}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon text-orange-500"><Trophy size={24} /></div>
          <div className="stat-num">15</div>
          <div className="stat-label">{t.stats.points}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon text-violet-500"><Target size={24} /></div>
          <div className="stat-num">100%</div>
          <div className="stat-label">{t.stats.quality}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card card-pad">
          <div className="card-title">
            <TrendingUp size={18} className="text-blue-600" />
            {t.recentMaterials}
          </div>
          <div className="space-y-3">
            {filteredRecent.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                {searchQuery ? 'Іздеу бойынша нәтиже жоқ' : t.noMaterials}
              </p>
            ) : (
              filteredRecent.map((item, i) => (
                <div key={i} className="recent-item" onClick={() => onNavigate('library', item)}>
                  <div className={`recent-icon ${item.type === 'ҚМЖ' ? 'bg-blue-50 text-blue-600' : item.type === 'Ойын' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                    {item.type === 'ҚМЖ' ? <Book size={16} /> : item.type === 'Ойын' ? <Gamepad2 size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="recent-info">
                    <div className="recent-title">{item.title}</div>
                    <div className="recent-meta">{item.subject} • {item.date}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card card-pad bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
          <div className="card-title text-blue-800 dark:text-blue-200">
            <Lightbulb size={18} className="text-blue-600 dark:text-blue-400" />
            {t.ideas}
          </div>
          <div className="space-y-4 text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
            <p>🚀 <strong>PDF Экспорт:</strong> ҚМЖ-ны бірден PDF форматында жүктеу мүмкіндігін қосу.</p>
            <p>📊 <strong>Оқушылар аналитикасы:</strong> Ойындардың нәтижесін бақылайтын мұғалім кабинеті.</p>
            <p>🌍 <strong>Көптілділік:</strong> Платформаны толықтай орыс және ағылшын тілдеріне аудару.</p>
            <p>🤖 <strong>Дауыстық көмекші:</strong> <span translate="no">DostUstaz</span>-бен дауыс арқылы сөйлесу.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
