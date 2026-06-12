/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonalizationPanel } from '../../src/features/predictions/components/PersonalizationPanel';
import type { PredictionCard } from '../../src/types/prediction';
import { predictionThemes } from '../../src/data/predictionThemes';

const defaultCard: PredictionCard = {
  title: 'My 2026 World Cup Path',
  creatorName: null,
  themeId: 'classic',
  championTeamId: null,
};

describe('PersonalizationPanel', () => {
  let onCardChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCardChange = vi.fn();
  });

  it('renders title input with current card title', () => {
    render(<PersonalizationPanel card={defaultCard} onCardChange={onCardChange} />);
    const input = screen.getByLabelText(/card title/i);
    expect(input).toHaveValue('My 2026 World Cup Path');
  });

  it('renders export credit input', () => {
    render(<PersonalizationPanel card={defaultCard} onCardChange={onCardChange} />);
    const input = screen.getByLabelText(/export credit/i);
    expect(input).toBeInTheDocument();
  });

  it('calls onCardChange with updated title on blur', () => {
    render(<PersonalizationPanel card={defaultCard} onCardChange={onCardChange} />);
    const input = screen.getByLabelText(/card title/i);
    fireEvent.change(input, { target: { value: 'Champions Road' } });
    fireEvent.blur(input);
    expect(onCardChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'Champions Road' }));
  });

  it('calls onCardChange with updated creatorName on blur', () => {
    render(<PersonalizationPanel card={defaultCard} onCardChange={onCardChange} />);
    const input = screen.getByLabelText(/export credit/i);
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.blur(input);
    expect(onCardChange).toHaveBeenCalledWith(expect.objectContaining({ creatorName: 'Alice' }));
  });

  it('renders theme swatches and calls onCardChange on selection', () => {
    render(<PersonalizationPanel card={defaultCard} onCardChange={onCardChange} />);
    const midnightBtn = screen.getByLabelText(/midnight/i);
    fireEvent.click(midnightBtn);
    expect(onCardChange).toHaveBeenCalledWith(expect.objectContaining({ themeId: 'midnight' }));
  });

  it('marks the current theme as selected (aria-pressed)', () => {
    const card = { ...defaultCard, themeId: 'midnight' };
    render(<PersonalizationPanel card={card} onCardChange={onCardChange} />);
    const midnightBtn = screen.getByLabelText(/midnight/i);
    expect(midnightBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
