import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2] ?? '/tmp/third_place_table.wiki';
const outputPath = process.argv[3]
  ?? path.resolve('frontend/src/data/thirdPlaceRoundOf32Assignments.ts');

const COLUMN_ORDER = ['A', 'B', 'D', 'E', 'G', 'I', 'K', 'L'];

const source = fs.readFileSync(inputPath, 'utf8');
const lines = source.split(/\r?\n/);

const rows = [];
let current = null;

function flushCurrent() {
  if (!current) return;
  if (current.qualifiers.length === 8 && current.assignments.length === 8) {
    rows.push(current);
  }
  current = null;
}

for (const line of lines) {
  if (line.startsWith('! scope="row"')) {
    flushCurrent();
    const numberMatch = line.match(/\|\s*([0-9]+)\*?$/);
    current = {
      rowNumber: numberMatch ? Number(numberMatch[1]) : null,
      qualifiers: [],
      assignments: [],
    };
    continue;
  }

  if (!current || !line.startsWith('|') || line.startsWith('|-')) {
    continue;
  }

  current.qualifiers.push(...Array.from(line.matchAll(/'''([A-L])'''/g), (match) => match[1]));
  current.assignments.push(...Array.from(line.matchAll(/\b3([A-L])\b/g), (match) => match[1]));
}

flushCurrent();

const mapping = Object.fromEntries(rows.map((row) => {
  const key = row.qualifiers.join('');
  const value = Object.fromEntries(COLUMN_ORDER.map((column, index) => [column, row.assignments[index]]));
  return [key, value];
}));

const fileContents = `export const THIRD_PLACE_SLOT_COLUMNS = ${JSON.stringify(COLUMN_ORDER)} as const;

export type ThirdPlaceSlotColumn = typeof THIRD_PLACE_SLOT_COLUMNS[number];

export type ThirdPlaceRoundOf32Assignment = Record<ThirdPlaceSlotColumn, string>;

export const THIRD_PLACE_ROUND_OF_32_ASSIGNMENTS: Record<string, ThirdPlaceRoundOf32Assignment> = ${JSON.stringify(mapping, null, 2)} as const;
`;

fs.writeFileSync(outputPath, fileContents);

console.log(`Wrote ${Object.keys(mapping).length} third-place assignment combinations to ${outputPath}`);
