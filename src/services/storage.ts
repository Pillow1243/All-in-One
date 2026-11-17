import { AppSettings } from '../types';

const PREFIX = 'omniforge_v1_';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'fa',
  theme: 'dark',
  accentPrimary: '#06b6d4',
  accentSecondary: '#8b5cf6',
  fontScale: 1,
  highContrast: false,
  colorBlindMode: 'none',
  hapticsEnabled: true,
  ttsAutoRead: false,
  focusMode: false,
  dndMode: false,
  kidsMode: false,
  parentalPin: '1234',
  appLockEnabled: false,
  appLockPin: '0000',
  betaChannel: false,
  offlineMode: false,
  screenTimeLimitMin: 60,
  userName: 'کاربر همه‌کاره پرو',
  userEmail: 'local@omniforge.app',
  widgets: ['quick-calc', 'live-fx', 'pomodoro', 'weather', 'notes'],
  shortcuts: ['pdf-merge', 'img-editor', 'math-scientific', 'conv-currency', 'sec-password', 'ai-chatbot'],
  automations: [
    {
      id: 'auto-1',
      name: 'حالت شب خودکار (OLED)',
      enabled: true,
      trigger: 'night_time',
      action: 'enable_oled',
    },
    {
      id: 'auto-2',
      name: 'خوش‌آمدگویی صوتی هوشمند',
      enabled: false,
      trigger: 'manual',
      action: 'speak_greeting',
      actionValue: 'خوش آمدید به همه‌کاره پرو',
    },
  ],
  plugins: [
    {
      id: 'plugin-bmi-pro',
      name: 'پلاگین محاسبه سریع BMI و آب بدن',
      version: '2.0.0',
      author: 'OmniForge Community',
      description: 'محاسبه آنی شاخص توده بدنی و نیاز روزانه به آب',
      enabled: true,
      code: 'return { bmi: +(weight / ((height/100)**2)).toFixed(1), waterLiters: +(weight * 0.033).toFixed(2) };',
    },
    {
      id: 'plugin-persian-num',
      name: 'تبدیل عدد به حروف فارسی',
      version: '1.2.0',
      author: 'OmniForge Labs',
      description: 'تبدیل اعداد ریالی و تومانی به حروف فارسی برای چک و فاکتور',
      enabled: true,
      code: 'return String(input).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");',
    },
  ],
};

export function loadData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded - trim non-essential logs
  }
}

export function loadSettings(): AppSettings {
  const saved = loadData<Partial<AppSettings>>('settings', {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(settings: AppSettings): void {
  saveData('settings', settings);
}

export interface SnapshotVersion {
  id: string;
  timestamp: string;
  label: string;
  sizeBytes: number;
  data: Record<string, unknown>;
}

export function exportAllAppData(): Record<string, unknown> {
  const dump: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX) && !k.endsWith('snapshots')) {
      try {
        dump[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k) || 'null');
      } catch {
        dump[k.slice(PREFIX.length)] = localStorage.getItem(k);
      }
    }
  }
  return dump;
}

export function importAllAppData(dump: Record<string, unknown>): number {
  let count = 0;
  for (const [k, v] of Object.entries(dump)) {
    saveData(k, v);
    count++;
  }
  return count;
}

export function createSnapshot(label: string): SnapshotVersion {
  const data = exportAllAppData();
  const serialized = JSON.stringify(data);
  const snap: SnapshotVersion = {
    id: `snap_${Date.now()}`,
    timestamp: new Date().toISOString(),
    label,
    sizeBytes: new Blob([serialized]).size,
    data,
  };
  const list = loadData<SnapshotVersion[]>('snapshots', []);
  list.unshift(snap);
  saveData('snapshots', list.slice(0, 15));
  return snap;
}

export function logToolUsage(toolId: string, categoryId: string): void {
  const stats = loadData<Record<string, number>>('analytics_tools', {});
  stats[toolId] = (stats[toolId] || 0) + 1;
  saveData('analytics_tools', stats);

  const catStats = loadData<Record<string, number>>('analytics_cats', {});
  catStats[categoryId] = (catStats[categoryId] || 0) + 1;
  saveData('analytics_cats', catStats);

  const recents = loadData<string[]>('recents', []);
  const next = [toolId, ...recents.filter((id) => id !== toolId)].slice(0, 24);
  saveData('recents', next);
}

export function logCrashOrEvent(level: 'info' | 'warn' | 'error', message: string): void {
  const logs = loadData<{ time: string; level: string; message: string }[]>('crash_logs', []);
  logs.unshift({ time: new Date().toISOString(), level, message });
  saveData('crash_logs', logs.slice(0, 100));
}
