import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { X, LogIn } from 'lucide-react';
import { Logo } from './components/Common/Logo';
import { Sidebar } from './components/Layout/Sidebar';
import { Topbar } from './components/Layout/Topbar';
import { Toast } from './components/Common/Toast';
import { FeedbackModal } from './components/Common/FeedbackModal';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { db, isFirebaseConfigured } from './lib/firebase';
import { doc, setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/error-handling';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useTheme } from './hooks/useTheme';
import { useApiKeys } from './hooks/useApiKeys';
import { useKmzh } from './hooks/useKmzh';
import { KMZHParams, GameParams, KMZHData, GameData, AssessmentData } from './types';
import { translations, Language } from './lib/translations';
import { SettingsView } from './views/SettingsView';

// Lazy load views
import { DashboardView } from './views/DashboardView';
import { KMZHView } from './views/KMZHView';
// const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
// const KMZHView = lazy(() => import('./views/KMZHView').then(m => ({ default: m.KMZHView })));
const GamesView = lazy(() => import('./views/GamesView').then(m => ({ default: m.GamesView })));
const ChatView = lazy(() => import('./views/ChatView').then(m => ({ default: m.ChatView })));
const LibraryView = lazy(() => import('./views/LibraryView').then(m => ({ default: m.LibraryView })));
const PricingView = lazy(() => import('./views/PricingView').then(m => ({ default: m.PricingView })));
const AssessmentView = lazy(() => import('./views/AssessmentView').then(m => ({ default: m.AssessmentView })));
const StudentAssessmentView = lazy(() => import('./views/StudentAssessmentView').then(m => ({ default: m.StudentAssessmentView })));
const CodingView = lazy(() => import('./views/CodingView').then(m => ({ default: m.CodingView })));
const GamePlayerView = lazy(() => import('./views/GamePlayerView'));
const MapView = lazy(() => import('./views/MapView').then(m => ({ default: m.MapView })));

const ViewLoader = () => (
  <div className="flex items-center justify-center p-20">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('kz');

  const t = translations[language];

  // Custom Hooks
  const { user, setUser, loading: authLoading, isApiOk, setIsApiOk, isClaudeApiOk, setIsClaudeApiOk, login, logout } = useAuth();
  const { notifications, addNotification } = useNotifications(user);
  const { theme, toggleTheme } = useTheme();

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }, []);

  const {
    isApiModalOpen, setIsApiModalOpen,
    isClaudeModalOpen, setIsClaudeModalOpen,
    apiKeyInput, setApiKeyInput,
    claudeKeyInput, setClaudeKeyInput,
    isSavingApi, isSavingClaude,
    saveApiKey, saveClaudeKey, clearApiKey
  } = useApiKeys(user, showToast);

  const {
    kmzhLoading, setKmzhLoading,
    kmzhResult, setKmzhResult,
    assessmentResult, setAssessmentResult,
    kmzhParams, setKmzhParams
  } = useKmzh();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    const msgs = {
      kz: 'Тіл ауыстырылды: Қазақша 🌐',
      ru: 'Язык изменен: Русский 🌐',
      en: 'Language changed: English 🌐'
    };
    showToast(msgs[lang]);
  };

  // Global safety timeout for loading screen
  const [isSafetyTimeoutReached, setIsSafetyTimeoutReached] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.warn("Global safety timeout reached: forcing loading screen dismissal");
        setIsSafetyTimeoutReached(true);
      }
    }, 10000); // 10 seconds
    return () => clearTimeout(timer);
  }, [authLoading]);

  const effectiveLoading = authLoading && !isSafetyTimeoutReached;

  const [kmzhLoaderStep, setKmzhLoaderStep] = useState(0);

  // Games States
  const [gameLoading, setGameLoading] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameParams, setGameParams] = useState<GameParams>({
    topic: '',
    grade: '5',
    lang: 'Қазақша',
    type: 'Kahoot',
    count: 5
  });
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Ойын жасалуда...');

  const kmzhSteps = [
    'Тақырыпты талдау...',
    'Оқу мақсаттарын жүйелеу...',
    'Сабақ кезеңдерін құрастыру...',
    'Дескрипторларды дайындау...',
    'Ресми форматқа келтіру...'
  ];

  const handleNavigate = useCallback((tab: string, item?: any) => {
    setActiveTab(tab);
    if (item) {
      if (item.type === 'ҚМЖ') setKmzhResult(item.data);
      if (item.type === 'БЖБ' || item.type === 'ТЖБ') setAssessmentResult(item.data);
    }
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      await login();
      showToast('Қош келдіңіз! 👋');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/popup-blocked') {
        showToast('Браузер терезесі бұғатталды! 🔓');
      } else if (err.code === 'auth/cancelled-popup-request') {
        showToast('Кіру тоқтатылды ⚠️');
      } else {
        showToast(`Қате: ${err.code || 'белгісіз'} ❌`);
      }
    }
  }, [login, showToast]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      showToast('Жүйеден шықтыңыз 👋');
    } catch (err) {
      console.error(err);
      showToast('Шығу кезінде қате туындады ❌');
    }
  }, [logout, showToast]);

  const openApiModal = useCallback(() => setIsApiModalOpen(true), [setIsApiModalOpen]);
  const openProfileModal = useCallback(() => setIsProfileModalOpen(true), []);

  const handleGenerateGame = useCallback(async () => {
    if (!isApiOk) return openApiModal();
    if (!gameParams.topic.trim()) {
      addNotification('Қате ⚠️', 'Тақырыпты енгізіңіз!', 'error');
      return;
    }

    setGameLoading(true);
    setLoadingMessage('Ойын логикасы құрастырылуда...');
    
    const messages = [
      'Тақырыпты талдау...',
      'Ойын механикасын ойластыру...',
      'Сұрақтар мен тапсырмаларды дайындау...',
      'Интерфейсті безендіру...',
      'Логиканы тексеру...',
      'Дайын болуға жақын...'
    ];
    
    let step = 0;
    const interval = setInterval(() => {
      setLoadingMessage(messages[step % messages.length]);
      step++;
    }, 3000);

    try {
      const generationParams = {
        ...gameParams,
        count: isNaN(gameParams.count) ? 5 : gameParams.count
      };
      
      let data;
      if (gameParams.type === 'Web') {
        const { generateGameIterative } = await import('./services/geminiService');
        data = await generateGameIterative(`${gameParams.topic} тақырыбына арналған интерактивті оқу ойынын жаса. Сынып: ${gameParams.grade}. Тіл: ${gameParams.lang}.`, [], null);
      } else {
        const { generateGame } = await import('./services/geminiService');
        data = await generateGame(generationParams);
      }

      setGameData(data);
      if (data) {
        const gameType = (data.type || gameParams.type).toLowerCase();
        setActiveGame(gameType);
        addNotification('Ойын Дайын! 🎮', `${gameParams.topic} тақырыбы бойынша ${gameParams.type} ойыны сәтті жасалды.`, 'success');
      }
    } catch (err: any) {
      console.error("Game Generation Error:", err);
      let errorMsg = 'Ойын жасау кезінде қате шықты. Қайта көріңіз.';
      
      if (err.message?.includes('429') || err.message?.toLowerCase().includes('quota')) {
        errorMsg = 'API сұраныс шегінен асты (Rate limit). Платформаның ортақ кілті уақытша бос емес. Өз жеке API кілтіңізді Профиль бөлімінде қосуды ұсынамыз.';
      } else if (err.message?.includes('403') || err.message?.toLowerCase().includes('permission')) {
        errorMsg = 'API кілтіне рұқсат жоқ немесе аймақтық шектеу бар. Өз жеке API кілтіңізді тексеріңіз.';
      } else if (err.message?.includes('қауіпсіздік')) {
        errorMsg = err.message;
      }
      
      addNotification('Генерация қатесі ❌', errorMsg, 'error');
    } finally {
      clearInterval(interval);
      setGameLoading(false);
      setLoadingMessage('Ойын жасалуда...');
    }
  }, [gameParams, isApiOk, openApiModal, addNotification]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const testConnection = async () => {
      try {
        // Use a timeout for the connection test
        const testPromise = getDocFromServer(doc(db, 'test', 'connection'));
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        await Promise.race([testPromise, timeoutPromise]);
      } catch (error: any) {
        console.warn('Firebase connection test failed:', error);
        if (error.message?.includes('offline')) {
          showToast('Firebase баптаулары қате немесе интернет байланысы жоқ. ⚠️');
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    if (user) {
      setKmzhParams(prev => ({
        ...prev,
        teacherName: user.name || '',
        schoolName: user.school || '№1 мектеп-лицей'
      }));
    }
  }, [user]);

  const isStudentView = window.location.pathname.includes('/assessment/');
  const isGameView = window.location.pathname.includes('/game/');

  if (!isFirebaseConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="card card-pad max-w-md w-full text-center">
          <div className="mx-auto mb-8 w-64">
            <Logo className="w-full h-auto" />
          </div>
          <h1 className="text-3xl font-black mb-2">Баптау қажет</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Firebase баптаулары табылмады. Жалғастыру үшін AI Studio Settings мәзірінде 
            Firebase айнымалыларын (VITE_FIREBASE_...) орнатыңыз.
          </p>
        </div>
      </div>
    );
  }

  if (effectiveLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-64 mb-8">
          <Logo className="w-full h-auto" />
        </div>
        <ViewLoader />
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 mb-4">Жүктелуде, күте тұрыңыз...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs text-blue-600 underline hover:text-blue-700"
          >
            Бетті қайта жаңарту
          </button>
        </div>
      </div>
    );
  }

  if (isStudentView) {
    return (
      <Suspense fallback={<ViewLoader />}>
        <StudentAssessmentView addNotification={addNotification} />
      </Suspense>
    );
  }

  if (isGameView) {
    return (
      <Suspense fallback={<ViewLoader />}>
        <GamePlayerView />
      </Suspense>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="card card-pad max-w-md w-full text-center">
          <div className="mx-auto mb-8 w-64">
            <Logo className="w-full h-auto" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Мұғалімдерге арналған заманауи білім беру платформасына қош келдіңіз. 
            Жалғастыру үшін Google арқылы кіріңіз.
          </p>
          <button className="btn btn-primary btn-wide py-4 text-lg mb-4" onClick={handleLogin}>
            <LogIn size={20} className="mr-2" />
            Google арқылы кіру
          </button>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
            <p className="mb-2 font-bold">Кіру кезінде қиындықтар туындаса:</p>
            <ul className="list-disc list-inside text-left space-y-2">
              <li>Браузерде "Third-party cookies" рұқсат етілгенін тексеріңіз.</li>
              <li>
                Firebase консолінде мына доменнің рұқсат етілгенін тексеріңіз:
                <code className="block mt-1 p-2 bg-white/50 dark:bg-black/20 rounded border border-blue-200 dark:border-blue-800 break-all select-all">
                  {window.location.hostname}
                </code>
              </li>
              <li>Сайтты <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="font-bold underline">жеке терезеде (Incognito)</a> ашып көріңіз.</li>
            </ul>
          </div>
        </div>
      </div>
    );
}

  const activeTabLabel = {
    dashboard: t.dashboard,
    kmzh: t.kmzh,
    assessment: t.assessment,
    map: t.map,
    coding: t.coding,
    games: t.games,
    chat: t.chat,
    library: t.library,
    pricing: t.pricing,
    settings: t.settings
  }[activeTab] || '';

  return (
    <div className="app">
      <Toast show={toast.show} message={toast.message} />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        isApiOk={isApiOk}
        onFeedbackClick={() => setIsFeedbackModalOpen(true)}
        onOpenApiModal={openApiModal}
        language={language}
      />

      <main className="main-area">
        <Topbar 
          activeTabLabel={activeTabLabel} 
          setIsSidebarOpen={setIsSidebarOpen} 
          setIsApiModalOpen={setIsApiModalOpen}
          onProfileClick={openProfileModal}
          isApiOk={isApiOk}
          userName={user.name || ''}
          theme={theme}
          toggleTheme={toggleTheme}
          notifications={notifications}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          language={language}
          setLanguage={handleLanguageChange}
        />

        <div className="page-content">
          <ErrorBoundary>
            <Suspense fallback={<ViewLoader />}>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  user={user}
                  searchQuery={searchQuery}
                  onNavigate={handleNavigate} 
                  t={t}
                  onLogout={handleLogout}
                />
              )}
              {activeTab === 'kmzh' && (
                <KMZHView 
                  isApiOk={isApiOk}
                  onOpenApiModal={openApiModal}
                  loading={kmzhLoading} 
                  setLoading={setKmzhLoading}
                  result={kmzhResult}
                  setResult={setKmzhResult}
                  params={kmzhParams}
                  setParams={setKmzhParams}
                  loaderStep={kmzhLoaderStep}
                  steps={kmzhSteps}
                  addNotification={addNotification}
                />
              )}
              {activeTab === 'assessment' && (
                <AssessmentView 
                  isApiOk={isApiOk} 
                  onOpenApiModal={openApiModal}
                  addNotification={addNotification} 
                  result={assessmentResult}
                  setResult={setAssessmentResult}
                  onNavigate={handleNavigate}
                  t={t}
                />
              )}
              {activeTab === 'map' && <MapView addNotification={addNotification} />}
              {activeTab === 'coding' && (
                <CodingView 
                  isApiOk={isApiOk} 
                  isClaudeApiOk={isClaudeApiOk}
                  onOpenApiModal={openApiModal} 
                  onOpenClaudeApiModal={() => setIsClaudeModalOpen(true)}
                  addNotification={addNotification} 
                />
              )}
              {activeTab === 'chat' && <ChatView isApiOk={isApiOk} onOpenApiModal={openApiModal} />}
              {activeTab === 'library' && <LibraryView searchQuery={searchQuery} isApiOk={isApiOk} onOpenApiModal={openApiModal} addNotification={addNotification} t={t} />}
              {activeTab === 'games' && (
                <GamesView 
                  isApiOk={isApiOk}
                  onOpenApiModal={openApiModal}
                  activeGame={activeGame}
                  setActiveGame={setActiveGame}
                  loading={gameLoading}
                  setLoading={setGameLoading}
                  gameData={gameData}
                  setGameData={setGameData}
                  params={gameParams}
                  setParams={setGameParams}
                  addNotification={addNotification}
                  onGenerate={handleGenerateGame}
                  loadingMessage={loadingMessage}
                />
              )}
              {activeTab === 'pricing' && <PricingView />}
              {activeTab === 'settings' && (
                <SettingsView 
                  language={language}
                  setLanguage={handleLanguageChange}
                  apiKeyInput={apiKeyInput}
                  setApiKeyInput={setApiKeyInput}
                  saveApiKey={saveApiKey}
                  isSavingApi={isSavingApi}
                  isApiOk={isApiOk}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  t={t}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {isProfileModalOpen && (
        <div className="modal-ov show">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Профиль</h3>
              <button onClick={() => setIsProfileModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <img src={user.picture || ''} alt={user.name || ''} className="w-20 h-20 rounded-full mb-3 border-4 border-blue-100 dark:border-blue-900" referrerPolicy="no-referrer" />
              <div className="text-lg font-bold">{user.name}</div>
              <div className="text-sm text-slate-500">{user.email}</div>
            </div>
            <div className="space-y-4">
              <div className="fg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flabel mb-0">API Кілті</label>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isApiOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isApiOk ? 'Белсенді' : 'Орнатылмаған'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      className="inp flex-1" 
                      value={isApiOk ? '••••••••••••••••' : ''} 
                      disabled 
                      placeholder={isApiOk ? 'Кілт сақталған' : 'Кілт жоқ'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button className="btn btn-primary btn-sm" onClick={() => { setIsProfileModalOpen(false); setIsApiModalOpen(true); }}>
                      {isApiOk ? 'Өзгерту' : 'Қосу'}
                    </button>
                    {isApiOk && (
                      <button className="btn btn-ghost btn-sm text-red-500 border-red-100" onClick={clearApiKey}>
                        Өшіру
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button className="btn btn-ghost w-full text-red-500 border-red-100 dark:border-red-900" onClick={handleLogout}>Жүйеден шығу</button>
            </div>
          </div>
        </div>
      )}

      {isApiModalOpen && (
        <div className="modal-ov show">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Gemini API Кілті</h3>
              <button onClick={() => setIsApiModalOpen(false)}><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Бұл сайтта әрбір пайдаланушы <b>өз жеке Gemini API кілтін</b> пайдаланады. 
              Бұл сіздің лимиттеріңізді басқаруға және қауіпсіздікті қамтамасыз етуге мүмкіндік береді.
              Кілтті <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-600 underline font-bold">Google AI Studio</a> сайтынан тегін алуға болады.
            </p>
            <div className="fg mb-6">
              <label className="flabel">API Кілті</label>
              <input 
                type="password" 
                className="inp" 
                placeholder="AIza..." 
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </div>
            <button 
              className={`btn btn-primary btn-wide ${isSavingApi ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={saveApiKey}
              disabled={isSavingApi}
            >
              {isSavingApi ? 'Сақталуда...' : 'Сақтау'}
            </button>
          </div>
        </div>
      )}

      {isClaudeModalOpen && (
        <div className="modal-ov show">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Claude API Кілті</h3>
              <button onClick={() => setIsClaudeModalOpen(false)}><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Claude API кілтін қосу арқылы сіз Кодинг бөлімінде Anthropic ұсынған Claude 3.5 Sonnet моделін пайдалана аласыз.
              Кілтті <a href="https://console.anthropic.com/" target="_blank" className="text-blue-600 underline font-bold">Anthropic Console</a> сайтынан алуға болады.
            </p>
            <div className="fg mb-6">
              <label className="flabel">Claude API Кілті</label>
              <input 
                type="password" 
                className="inp" 
                placeholder="sk-ant-..." 
                value={claudeKeyInput}
                onChange={(e) => setClaudeKeyInput(e.target.value)}
              />
            </div>
            <button 
              className={`btn btn-primary btn-wide ${isSavingClaude ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={saveClaudeKey}
              disabled={isSavingClaude}
            >
              {isSavingClaude ? 'Сақталуда...' : 'Сақтау'}
            </button>
          </div>
        </div>
      )}

      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
        showToast={showToast}
      />
    </div>
  );
}
