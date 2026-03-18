import { useState, useEffect } from 'react';

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export type DayKey = typeof DAY_KEYS[number];

export interface Lesson {
  id: string;
  time: string;
  cabinet: string;
  grade: string;
  subject: string;
}

export interface DaySchedule {
  dayKey: DayKey;
  lessons: Lesson[];
}

export interface ScheduleCycle {
  id: string;
  startDate: string;
  endDate?: string;
  days: DaySchedule[];
}

export type WeekTopics = Record<string, Record<string, string>>;

const CYCLES_KEY = 'bilge_calendar_cycles';
const TOPICS_KEY = 'bilge_calendar_topics';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function getCycleForWeek(cycles: ScheduleCycle[], weekStart: Date): ScheduleCycle | null {
  const ws = fmt(weekStart);
  for (let i = cycles.length - 1; i >= 0; i--) {
    const c = cycles[i];
    if (c.startDate <= ws && (!c.endDate || c.endDate > ws)) return c;
  }
  return null;
}

export function useCalendar() {
  const [cycles, setCycles] = useState<ScheduleCycle[]>(() => load(CYCLES_KEY, []));
  const [weekTopics, setWeekTopics] = useState<WeekTopics>(() => load(TOPICS_KEY, {}));
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupDays, setSetupDays] = useState<DaySchedule[]>(
    DAY_KEYS.map(k => ({ dayKey: k, lessons: [] }))
  );

  useEffect(() => { localStorage.setItem(CYCLES_KEY, JSON.stringify(cycles)); }, [cycles]);
  useEffect(() => { localStorage.setItem(TOPICS_KEY, JSON.stringify(weekTopics)); }, [weekTopics]);

  const activeCycle = cycles.find(c => !c.endDate) || null;
  const weekCycle = getCycleForWeek(cycles, currentWeekStart);

  const getTopic = (weekStart: Date, lessonId: string): string => {
    return weekTopics[fmt(weekStart)]?.[lessonId] || '';
  };

  const setTopic = (weekStart: Date, lessonId: string, topic: string) => {
    const ws = fmt(weekStart);
    setWeekTopics(prev => ({
      ...prev,
      [ws]: { ...(prev[ws] || {}), [lessonId]: topic },
    }));
  };

  const saveNewCycle = () => {
    const startDate = fmt(currentWeekStart);
    // Close any previous active cycle or cycles that start after this one
    const updated = cycles.map(c => {
      if (c.startDate >= startDate) return null;
      if (!c.endDate || c.endDate >= startDate) {
        return { ...c, endDate: fmt(addDays(currentWeekStart, -1)) };
      }
      return c;
    }).filter(Boolean) as ScheduleCycle[];

    const newCycle: ScheduleCycle = { id: Date.now().toString(), startDate, days: setupDays };
    setCycles([...updated, newCycle]);
    setIsSettingUp(false);
  };

  const endCycle = () => {
    setSetupDays(DAY_KEYS.map(k => ({ dayKey: k, lessons: [] })));
    setIsSettingUp(true);
  };

  const addLessonToSetup = (dayKey: DayKey, lesson: Omit<Lesson, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setSetupDays(prev => prev.map(d =>
      d.dayKey === dayKey
        ? { ...d, lessons: [...d.lessons, { ...lesson, id }].sort((a, b) => a.time.localeCompare(b.time)) }
        : d
    ));
  };

  const addLessonToActive = (cycleId: string, dayKey: DayKey, lesson: Omit<Lesson, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        days: c.days.map(d => 
          d.dayKey === dayKey 
            ? { ...d, lessons: [...d.lessons, { ...lesson, id }].sort((a, b) => a.time.localeCompare(b.time)) }
            : d
        )
      };
    }));
  };

  const removeLessonFromActive = (cycleId: string, dayKey: DayKey, lessonId: string) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        days: c.days.map(d => 
          d.dayKey === dayKey 
            ? { ...d, lessons: d.lessons.filter(l => l.id !== lessonId) }
            : d
        )
      };
    }));
  };

  const removeLessonFromSetup = (dayKey: DayKey, lessonId: string) => {
    setSetupDays(prev => prev.map(d =>
      d.dayKey === dayKey ? { ...d, lessons: d.lessons.filter(l => l.id !== lessonId) } : d
    ));
  };

  const updateLessonInSetup = (dayKey: DayKey, lessonId: string, updated: Partial<Lesson>) => {
    setSetupDays(prev => prev.map(d =>
      d.dayKey === dayKey
        ? { ...d, lessons: d.lessons.map(l => l.id === lessonId ? { ...l, ...updated } : l).sort((a, b) => a.time.localeCompare(b.time)) }
        : d
    ));
  };

  const goToPrevWeek = () => setCurrentWeekStart(d => addDays(d, -7));
  const goToNextWeek = () => setCurrentWeekStart(d => addDays(d, 7));
  const goToToday = () => setCurrentWeekStart(getWeekStart(new Date()));

  return {
    cycles, activeCycle, weekCycle,
    currentWeekStart, isSettingUp, setIsSettingUp, setupDays,
    getTopic, setTopic,
    saveNewCycle, endCycle,
    addLessonToSetup, removeLessonFromSetup, updateLessonInSetup,
    addLessonToActive, removeLessonFromActive,
    goToPrevWeek, goToNextWeek, goToToday,
  };
}
