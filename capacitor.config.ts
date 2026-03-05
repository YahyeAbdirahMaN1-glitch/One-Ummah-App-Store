import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oneummah.app',
  appName: 'Ummah Unity',
  webDir: 'dist',

  // iOS uses local files, API calls handled by environment variable
  // server: {
  //   url: 'https://one-ummah-yahyeabdirahman1526404989.adaptive.ai',
  //   cleartext: true
  // },

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
