import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.omniforge.allinone',
  appName: 'OmniForge Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#050814',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1400,
      backgroundColor: '#050814',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050814',
    },
  },
};

export default config;
