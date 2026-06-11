export interface PredictionTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export const predictionThemes: PredictionTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    primaryColor: '#1a365d',
    secondaryColor: '#c53030',
    backgroundColor: '#ffffff',
    textColor: '#1a202c',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    primaryColor: '#2b6cb0',
    secondaryColor: '#63b3ed',
    backgroundColor: '#1a202c',
    textColor: '#e2e8f0',
  },
  {
    id: 'fiesta',
    name: 'Fiesta',
    primaryColor: '#d69e2e',
    secondaryColor: '#38a169',
    backgroundColor: '#fffaf0',
    textColor: '#2d3748',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    primaryColor: '#0ea5e9',
    secondaryColor: '#06b6d4',
    backgroundColor: '#f0f9ff',
    textColor: '#0c4a6e',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    primaryColor: '#ea580c',
    secondaryColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    textColor: '#431407',
  },
];

export const DEFAULT_THEME_ID = 'classic';
