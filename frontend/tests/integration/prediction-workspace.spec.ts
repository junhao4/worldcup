import { test, expect, type Page } from '@playwright/test';
import { tournament2026 } from '../../src/data/tournament2026';
import { DEFAULT_CARD, SCHEMA_VERSION } from '../../src/types/prediction';
import type { MatchPrediction } from '../../src/types/prediction';

const STORAGE_KEY = 'prediction-session:v1';

function seedSession(predictions: MatchPrediction[]) {
  return {
    id: 'e2e-session',
    tournamentId: tournament2026.id,
    predictions,
    card: { ...DEFAULT_CARD },
    updatedAt: '2026-06-10T00:00:00.000Z',
    schemaVersion: SCHEMA_VERSION,
  };
}

function groupPredictions(): MatchPrediction[] {
  return tournament2026.matches
    .filter(match => match.stage === 'group')
    .map(match => ({
      matchId: match.id,
      homeScore: 2,
      awayScore: 0,
      advancingTeamId: null,
    }));
}

function completePredictions(): MatchPrediction[] {
  return tournament2026.matches.map(match => ({
    matchId: match.id,
    homeScore: 2,
    awayScore: 0,
    advancingTeamId: null,
  }));
}

async function installSession(page: Page, predictions: MatchPrediction[]) {
  const session = seedSession(predictions);
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: session },
  );
}

test.describe('Prediction Workspace E2E', () => {
  test('user can enter group scores and see standings update', async ({ page }) => {
    await page.goto('/');
    // Expect the prediction workspace to be rendered
    const workspace = page.locator('[data-testid="prediction-workspace"]');
    await expect(workspace).toBeVisible();

    // Enter a score for the first group match
    const homeInput = page.locator('[data-testid="score-input-g-A-1"] input').first();
    const awayInput = page.locator('[data-testid="score-input-g-A-1"] input').last();
    await homeInput.fill('2');
    await awayInput.fill('0');

    // Standings should reflect the prediction
    const standingsPanel = page.locator('[data-testid="group-standings-A"]');
    await expect(standingsPanel).toBeVisible();
    // First row should be the winning team
    const firstRow = standingsPanel.locator('tbody tr').first();
    await expect(firstRow).toContainText('Mexico');
  });

  test('knockout tie prompts for advancing team selection', async ({ page }) => {
    await installSession(page, groupPredictions());
    await page.goto('/');
    await page.getByRole('button', { name: 'Knockouts' }).click();

    const knockoutInput = page.locator('[data-testid="score-input-r32-1"]');
    await expect(knockoutInput).toBeVisible();

    // Enter a tied score
    const homeInput = knockoutInput.locator('input').first();
    const awayInput = knockoutInput.locator('input').last();
    await homeInput.fill('1');
    await awayInput.fill('1');

    // Advancement picker should appear
    const advPicker = page.locator('[data-testid="score-input-r32-1"] [role="group"]');
    await expect(advPicker).toBeVisible();
  });

  test('completing all predictions shows champion', async ({ page }) => {
    await installSession(page, completePredictions());
    await page.goto('/');
    await page.getByRole('button', { name: 'Knockouts' }).click();
    await page.getByRole('button', { name: /Final/ }).click();

    const finalInput = page.locator('[data-testid="score-input-final-1"]');
    await expect(finalInput).toBeVisible();

    const homeInput = finalInput.locator('input').first();
    const awayInput = finalInput.locator('input').last();
    await homeInput.fill('3');
    await awayInput.fill('1');

    // Champion should be displayed
    const champion = page.locator('[data-testid="champion-display"]');
    await expect(champion).toBeVisible();
  });
});
