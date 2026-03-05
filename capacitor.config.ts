import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oneummah.app',
  appName: 'Ummah Unity',
  webDir: 'dist',

  // Point to Adaptive web app (includes both UI and API)
  server: {
    url: 'https://one-ummah-yahyeabdirahman1526404989.on.adaptive.ai',
    cleartext: true
  },

  ios: {
    contentInset: 'always',
    allowsLinkPreview: true,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    },
    Camera: {
      presentationStyle: 'fullscreen'
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#FFD700'
    }
  }
};

export default config;
