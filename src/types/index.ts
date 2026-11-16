export type AppLanguage = 'fa' | 'en' | 'ar' | 'de' | 'fr' | 'es' | 'tr' | 'ru' | 'zh' | 'ja' | 'ko' | 'hi';

export type ThemeMode = 'dark' | 'light' | 'oled';

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface CategoryMeta {
  id: string;
  number: number;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  icon: string;
  gradient: string;
  accentHex: string;
  toolCountTarget: number;
}

export interface ToolItem {
  id: string;
  categoryId: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  mode: string;
  tags: string[];
  badge?: 'AI' | 'LIVE' | 'PRO' | 'NATIVE' | 'OFFLINE' | 'GAME';
}

export interface EngineProps {
  tool: ToolItem;
  category: CategoryMeta;
  lang: AppLanguage;
  onSelectTool: (toolId: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: 'on_open' | 'battery_low' | 'night_time' | 'focus_start' | 'manual';
  action: 'enable_oled' | 'enable_dnd' | 'open_tool' | 'notify' | 'speak_greeting' | 'vibrate';
  actionValue?: string;
  lastRun?: string;
}

export interface CustomPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  code: string;
}

export interface AppSettings {
  language: AppLanguage;
  theme: ThemeMode;
  accentPrimary: string;
  accentSecondary: string;
  fontScale: number;
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;
  hapticsEnabled: boolean;
  ttsAutoRead: boolean;
  focusMode: boolean;
  dndMode: boolean;
  kidsMode: boolean;
  parentalPin: string;
  appLockEnabled: boolean;
  appLockPin: string;
  betaChannel: boolean;
  offlineMode: boolean;
  screenTimeLimitMin: number;
  userName: string;
  userEmail: string;
  widgets: string[];
  shortcuts: string[];
  automations: AutomationRule[];
  plugins: CustomPlugin[];
}

export interface PublicApiEntry {
  name: string;
  category: string;
  description: string;
  url: string;
  sampleEndpoint?: string;
  auth: 'No' | 'apiKey';
  https: boolean;
  cors: 'Yes' | 'No' | 'Unknown';
}
