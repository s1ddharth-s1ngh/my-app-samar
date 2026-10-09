import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.samar.app',
  appName: 'Samar',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
