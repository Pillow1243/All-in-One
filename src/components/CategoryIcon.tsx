import React from 'react';
import {
  FileText, Image, Film, Music, Calculator, ArrowLeftRight, Cpu, Shield, ShieldCheck,
  Type, Code2, FolderKanban, Wifi, HeartPulse, TrendingUp, GraduationCap, Compass,
  ChefHat, Gamepad2, Sparkles, Cloud, Palette, Eye, Accessibility, Baby, Briefcase,
  Printer, ScanEye, Watch, Car, Sprout, Settings2, Wrench,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Image, Film, Music, Calculator, ArrowLeftRight, Cpu, Shield, ShieldCheck,
  Type, Code2, FolderKanban, Wifi, HeartPulse, TrendingUp, GraduationCap, Compass,
  ChefHat, Gamepad2, Sparkles, Cloud, Palette, Eye, Accessibility, Baby, Briefcase,
  Printer, ScanEye, Watch, Car, Sprout, Settings2,
};

export const CategoryIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-5 h-5' }) => {
  const Comp = ICON_MAP[name] || Wrench;
  return <Comp className={className} />;
};
