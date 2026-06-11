import { useState } from 'react';

export interface UsePredictionThemeResult extends Readonly<{
  selectedThemeId: string;
  selectTheme: (themeId: string) => void;
}> {}

export function usePredictionTheme(initialThemeId: string): UsePredictionThemeResult {
  const [selectedThemeId, setSelectedThemeId] = useState(initialThemeId);

  return {
    selectedThemeId,
    selectTheme: setSelectedThemeId,
  };
}
