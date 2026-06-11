export interface ThemeSwatchProps {
  readonly themeId: string;
  readonly themeName: string;
  readonly color: string;
  readonly isSelected?: boolean;
  readonly onSelect?: (themeId: string) => void;
}

/** Theme color swatch button (KB: 06i — explicit conditional rendering via aria-pressed) */
export function ThemeSwatch({ themeId, themeName, color, isSelected = false, onSelect }: ThemeSwatchProps) {
  return (
    <button
      aria-label={`Use ${themeName} theme`}
      aria-pressed={isSelected}
      className="swatch"
      data-selected={isSelected ? 'true' : 'false'}
      style={{ backgroundColor: color }}
      onClick={() => onSelect?.(themeId)}
      type="button"
    />
  );
}
