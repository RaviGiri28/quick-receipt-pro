import { describe, it, expect } from 'vitest';
import { parseTransactionText } from './receiptParser';
import { generateSamples, type Expected } from './pasteGenerator';

const FIELDS: (keyof Expected)[] = ['accountHolder', 'accountNumber', 'ifscCode', 'amount', 'customerMobile'];

const norm = (field: keyof Expected, v: string | undefined) => {
  if (v === undefined || v === '') return '';
  if (field === 'amount') return String(parseFloat(v));
  if (field === 'accountHolder') return v.replace(/\./g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  return v;
};

// FUZZ_SEED / FUZZ_COUNT override the data set, e.g. to try fresh random pastes.
const SEED = Number(process.env.FUZZ_SEED) || 20261010;
const COUNT = Number(process.env.FUZZ_COUNT) || 20000;

describe(`parseTransactionText on ${COUNT} generated pastes`, () => {
  const samples = generateSamples(COUNT, SEED);

  it('gets every field right on every decidable paste', () => {
    const stats = new Map<string, { total: number; wrong: number }>();
    const failures: string[] = [];
    let ambiguousTotal = 0;
    let ambiguousRight = 0;

    for (const s of samples) {
      const got = parseTransactionText(s.text);
      const wrongFields = FIELDS.filter(f => norm(f, got[f] as string) !== norm(f, s.expected[f]));
      if (s.ambiguous) {
        ambiguousTotal++;
        if (!wrongFields.length) ambiguousRight++;
        continue;
      }
      const st = stats.get(s.template) || { total: 0, wrong: 0 };
      st.total++;
      if (wrongFields.length) {
        st.wrong++;
        if (failures.length < 25) {
          failures.push(`[${s.template}] ${JSON.stringify(s.text)}\n   ` +
            wrongFields.map(f => `${f}: got ${JSON.stringify(got[f])} want ${JSON.stringify(s.expected[f])}`).join('; '));
        }
      }
      stats.set(s.template, st);
    }

    const report = [...stats].sort().map(([t, s]) => `${t.padEnd(52)} ${s.total - s.wrong}/${s.total}`).join('\n');
    console.log(`${report}\nambiguous (not required) ${ambiguousRight}/${ambiguousTotal}`);
    if (failures.length) console.log(failures.join('\n'));
    expect(failures).toEqual([]);
  }, 120_000);
});
