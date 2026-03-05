// API configuration for different environments
export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://one-ummah-yahyeabdirahman1526404989.on.adaptive.ai'
  : '';

export const API_URL = `${API_BASE_URL}/rpc`;
