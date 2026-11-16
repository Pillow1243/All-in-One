import React, { Suspense, lazy } from 'react';
import { EngineProps } from '../types';

const PdfStudioEngine = lazy(() => import('../engines/PdfStudioEngine').then((m) => ({ default: m.PdfStudioEngine })));
const ImageStudioEngine = lazy(() => import('../engines/ImageStudioEngine').then((m) => ({ default: m.ImageStudioEngine })));
const VideoStudioEngine = lazy(() => import('../engines/VideoStudioEngine').then((m) => ({ default: m.VideoStudioEngine })));
const AudioDawEngine = lazy(() => import('../engines/AudioDawEngine').then((m) => ({ default: m.AudioDawEngine })));
const MathSuiteEngine = lazy(() => import('../engines/MathSuiteEngine').then((m) => ({ default: m.MathSuiteEngine })));
const ConverterEngine = lazy(() => import('../engines/ConverterEngine').then((m) => ({ default: m.ConverterEngine })));
const HardwareEngine = lazy(() => import('../engines/HardwareEngine').then((m) => ({ default: m.HardwareEngine })));
const SecurityEngine = lazy(() => import('../engines/SecurityEngine').then((m) => ({ default: m.SecurityEngine })));
const TextStudioEngine = lazy(() => import('../engines/TextStudioEngine').then((m) => ({ default: m.TextStudioEngine })));
const DeveloperEngine = lazy(() => import('../engines/DeveloperEngine').then((m) => ({ default: m.DeveloperEngine })));
const FileManagerEngine = lazy(() => import('../engines/FileManagerEngine').then((m) => ({ default: m.FileManagerEngine })));
const NetworkEngine = lazy(() => import('../engines/NetworkEngine').then((m) => ({ default: m.NetworkEngine })));
const HealthEngine = lazy(() => import('../engines/HealthEngine').then((m) => ({ default: m.HealthEngine })));
const FinanceEngine = lazy(() => import('../engines/FinanceEngine').then((m) => ({ default: m.FinanceEngine })));
const ProductivityEngine = lazy(() => import('../engines/ProductivityEngine').then((m) => ({ default: m.ProductivityEngine })));
const TravelEngine = lazy(() => import('../engines/TravelEngine').then((m) => ({ default: m.TravelEngine })));
const CookingEngine = lazy(() => import('../engines/CookingEngine').then((m) => ({ default: m.CookingEngine })));
const GamesArcadeEngine = lazy(() => import('../engines/GamesArcadeEngine').then((m) => ({ default: m.GamesArcadeEngine })));
const AiStudioEngine = lazy(() => import('../engines/AiStudioEngine').then((m) => ({ default: m.AiStudioEngine })));
const CloudSyncEngine = lazy(() => import('../engines/CloudSyncEngine').then((m) => ({ default: m.CloudSyncEngine })));
const PersonalizationEngine = lazy(() => import('../engines/PersonalizationEngine').then((m) => ({ default: m.PersonalizationEngine })));
const AccessibilityEngine = lazy(() => import('../engines/AccessibilityEngine').then((m) => ({ default: m.AccessibilityEngine })));
const FamilyKidsEngine = lazy(() => import('../engines/FamilyKidsEngine').then((m) => ({ default: m.FamilyKidsEngine })));
const BusinessEngine = lazy(() => import('../engines/BusinessEngine').then((m) => ({ default: m.BusinessEngine })));
const PrintScanEngine = lazy(() => import('../engines/PrintScanEngine').then((m) => ({ default: m.PrintScanEngine })));
const ArStudioEngine = lazy(() => import('../engines/ArStudioEngine').then((m) => ({ default: m.ArStudioEngine })));
const WearableIotEngine = lazy(() => import('../engines/WearableIotEngine').then((m) => ({ default: m.WearableIotEngine })));
const AutomotiveEngine = lazy(() => import('../engines/AutomotiveEngine').then((m) => ({ default: m.AutomotiveEngine })));
const NatureAgriEngine = lazy(() => import('../engines/NatureAgriEngine').then((m) => ({ default: m.NatureAgriEngine })));
const PlatformOsEngine = lazy(() => import('../engines/PlatformOsEngine').then((m) => ({ default: m.PlatformOsEngine })));

class EngineBoundary extends React.Component<{ children: React.ReactNode }, { err: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { err: error.message };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="glass-card rounded-2xl p-6 text-center space-y-2 border border-rose-500/40">
          <div className="text-rose-400 font-bold">خطا در بارگذاری ماژول</div>
          <div className="text-xs text-slate-400 font-mono">{this.state.err}</div>
          <button onClick={() => this.setState({ err: null })} className="omni-btn omni-btn-primary text-xs">تلاش مجدد</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const EngineRouter: React.FC<EngineProps> = (props) => {
  const renderEngine = () => {
    switch (props.tool.categoryId) {
      case 'pdf': return <PdfStudioEngine {...props} />;
      case 'image': return <ImageStudioEngine {...props} />;
      case 'video': return <VideoStudioEngine {...props} />;
      case 'audio': return <AudioDawEngine {...props} />;
      case 'math': return <MathSuiteEngine {...props} />;
      case 'converter': return <ConverterEngine {...props} />;
      case 'hardware': return <HardwareEngine {...props} />;
      case 'security': return <SecurityEngine {...props} />;
      case 'text': return <TextStudioEngine {...props} />;
      case 'developer': return <DeveloperEngine {...props} />;
      case 'files': return <FileManagerEngine {...props} />;
      case 'network': return <NetworkEngine {...props} />;
      case 'health': return <HealthEngine {...props} />;
      case 'finance': return <FinanceEngine {...props} />;
      case 'productivity': return <ProductivityEngine {...props} />;
      case 'travel': return <TravelEngine {...props} />;
      case 'cooking': return <CookingEngine {...props} />;
      case 'games': return <GamesArcadeEngine {...props} />;
      case 'ai': return <AiStudioEngine {...props} />;
      case 'cloud': return <CloudSyncEngine {...props} />;
      case 'personalization': return <PersonalizationEngine {...props} />;
      case 'accessibility': return <AccessibilityEngine {...props} />;
      case 'family': return <FamilyKidsEngine {...props} />;
      case 'business': return <BusinessEngine {...props} />;
      case 'print': return <PrintScanEngine {...props} />;
      case 'ar': return <ArStudioEngine {...props} />;
      case 'iot': return <WearableIotEngine {...props} />;
      case 'automotive': return <AutomotiveEngine {...props} />;
      case 'nature': return <NatureAgriEngine {...props} />;
      case 'platform': return <PlatformOsEngine {...props} />;
      default: return <PlatformOsEngine {...props} />;
    }
  };

  return (
    <EngineBoundary key={props.tool.id}>
      <Suspense
        fallback={
          <div className="glass-card rounded-2xl p-10 text-center space-y-3 animate-pulse">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600" />
            <div className="text-xs text-slate-400">در حال آماده‌سازی موتور ابزار...</div>
          </div>
        }
      >
        {renderEngine()}
      </Suspense>
    </EngineBoundary>
  );
};
