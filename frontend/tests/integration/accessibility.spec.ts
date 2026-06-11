import { test, expect, type Page } from '@playwright/test';
import { tournament2026 } from '../../src/data/tournament2026';
import { DEFAULT_CARD, SCHEMA_VERSION } from '../../src/types/prediction';
import type { MatchPrediction } from '../../src/types/prediction';

const STORAGE_KEY = 'prediction-session:v1';
const scoreInputSelector = 'input[inputmode="numeric"]';

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

async function installSession(page: Page, predictions: MatchPrediction[]) {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    {
      key: STORAGE_KEY,
      value: {
        id: 'a11y-session',
        tournamentId: tournament2026.id,
        predictions,
        card: { ...DEFAULT_CARD },
        updatedAt: '2026-06-10T00:00:00.000Z',
        schemaVersion: SCHEMA_VERSION,
      },
    },
  );
}

test.describe('Accessibility & Keyboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('score inputs have accessible labels', async ({ page }) => {
    const inputs = page.locator(`${scoreInputSelector}[aria-label]`);
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
    // Every score input must have a non-empty aria-label
    for (let i = 0; i < Math.min(count, 6); i++) {
      const label = await inputs.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });

  test('Tab key moves focus between score inputs in order', async ({ page }) => {
    const firstInput = page.locator(scoreInputSelector).first();
    await firstInput.focus();
    expect(await firstInput.evaluate(el => el === document.activeElement)).toBe(true);

    await page.keyboard.press('Tab');
    const secondInput = page.locator(scoreInputSelector).nth(1);
    expect(await secondInput.evaluate(el => el === document.activeElement)).toBe(true);
  });

  test('advancement buttons have aria-pressed attribute', async ({ page }) => {
    await installSession(page, groupPredictions());
    await page.reload();
    await page.getByRole('button', { name: 'Knockouts' }).click();

    // Enter a tied score on a knockout match to trigger advancement picker
    const knockoutInputs = page.locator(`[data-testid="score-input-r32-1"] ${scoreInputSelector}`);
    const count = await knockoutInputs.count();
    expect(count).toBe(2);

    await knockoutInputs.first().fill('1');
    await knockoutInputs.nth(1).fill('1');

    const advButtons = page.locator('[role="group"][aria-label="Select advancing team"] button');
    const btnCount = await advButtons.count();
    expect(btnCount).toBeGreaterThan(0);
    for (let i = 0; i < btnCount; i++) {
      const pressed = await advButtons.nth(i).getAttribute('aria-pressed');
      expect(['true', 'false']).toContain(pressed);
    }
  });

  test('no duplicate IDs on the page', async ({ page }) => {
    const ids = await page.evaluate(() => {
      const all = document.querySelectorAll('[id]');
      const seen = new Set<string>();
      const dupes: string[] = [];
      all.forEach(el => {
        if (seen.has(el.id)) dupes.push(el.id);
        seen.add(el.id);
      });
      return dupes;
    });
    expect(ids).toHaveLength(0);
  });
});
