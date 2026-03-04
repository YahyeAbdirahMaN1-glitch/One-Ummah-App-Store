export const env = {
  VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL || process.env.VITE_SERVER_URL || '',
  PORT: import.meta.env.PORT || process.env.PORT || '4500',
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
};
