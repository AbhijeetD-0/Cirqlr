import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibego.app',
  appName: 'Cirqlr',
  webDir: 'dist',
  // @ts-expect-error bundledWebRuntime is deprecated in Capacitor v3+
  bundledWebRuntime: false,
};

export default config;
