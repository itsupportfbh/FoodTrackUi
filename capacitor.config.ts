import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ccspl.foodtrack',
  appName: 'FoodTrack',
  webDir: 'dist/vuexy-mobile',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http'
  }
};

export default config;
