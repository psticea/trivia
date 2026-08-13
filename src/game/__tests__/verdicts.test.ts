import { describe, expect, it } from 'vitest';
import { VERDICT_TABLES, verdictFor } from '../../i18n/verdicts';
import { averagePerQuestion, formatDuration, minutesPhrase, secondsPhrase } from '../duration';

describe('mesajele de final', () => {
  it('are exact cinci variante pentru fiecare scor posibil', () => {
    expect(VERDICT_TABLES.ten).toHaveLength(11); // 0..10
    expect(VERDICT_TABLES.twenty).toHaveLength(21); // 0..20
    for (const table of [VERDICT_TABLES.ten, VERDICT_TABLES.twenty, VERDICT_TABLES.fallback]) {
      for (const bucket of table) {
        expect(bucket).toHaveLength(5);
        expect(new Set(bucket).size).toBe(5);
      }
    }
  });

  it('ține mesajele scurte, ca să încapă ca titlu pe telefon', () => {
    for (const table of [VERDICT_TABLES.ten, VERDICT_TABLES.twenty, VERDICT_TABLES.fallback]) {
      for (const bucket of table) {
        for (const line of bucket) {
          expect(line.length).toBeLessThanOrEqual(56);
          expect(line.trim()).toBe(line);
        }
      }
    }
  });

  it('nu repetă niciun mesaj între scoruri diferite', () => {
    for (const table of [VERDICT_TABLES.ten, VERDICT_TABLES.twenty]) {
      const all = table.flat();
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it('întoarce mereu un mesaj valid pentru orice scor', () => {
    for (const total of [10, 20]) {
      for (let score = 0; score <= total; score += 1) {
        const msg = verdictFor(score, total, 12345);
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(3);
      }
    }
  });

  it('este stabil pentru aceeași rundă — nu sare la re-randare', () => {
    for (let seed = 0; seed < 30; seed += 1) {
      expect(verdictFor(7, 10, seed)).toBe(verdictFor(7, 10, seed));
    }
  });

  it('folosește toate cele cinci variante pe măsură ce se schimbă runda', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 400; seed += 1) seen.add(verdictFor(10, 10, seed));
    expect(seen.size).toBe(5);
  });

  it('rezistă la scoruri absurde și la lungimi neprevăzute', () => {
    expect(verdictFor(-3, 10, 1).length).toBeGreaterThan(3);
    expect(verdictFor(99, 10, 1).length).toBeGreaterThan(3);
    expect(verdictFor(7, 15, 1).length).toBeGreaterThan(3);
    expect(verdictFor(0, 0, 1).length).toBeGreaterThan(3);
  });
});

describe('durata rundei', () => {
  it('acordă corect numeralul cu „de”', () => {
    expect(secondsPhrase(1)).toBe('o secundă');
    expect(secondsPhrase(2)).toBe('2 secunde');
    expect(secondsPhrase(19)).toBe('19 secunde');
    expect(secondsPhrase(20)).toBe('20 de secunde');
    expect(secondsPhrase(47)).toBe('47 de secunde');
    expect(secondsPhrase(101)).toBe('101 secunde');
    expect(secondsPhrase(120)).toBe('120 de secunde');
    expect(minutesPhrase(1)).toBe('un minut');
    expect(minutesPhrase(3)).toBe('3 minute');
    expect(minutesPhrase(20)).toBe('20 de minute');
  });

  it('formatează duratele scurte în secunde', () => {
    expect(formatDuration(0)).toBe('mai puțin de o secundă');
    expect(formatDuration(1000)).toBe('o secundă');
    expect(formatDuration(47_000)).toBe('47 de secunde');
    expect(formatDuration(59_400)).toBe('59 de secunde');
  });

  it('trece la minute peste un minut', () => {
    expect(formatDuration(60_000)).toBe('un minut');
    expect(formatDuration(65_000)).toBe('un minut și 5 secunde');
    expect(formatDuration(180_000)).toBe('3 minute');
    expect(formatDuration(252_000)).toBe('4 minute și 12 secunde');
  });

  it('comută pe ore pentru runde lăsate deschise', () => {
    expect(formatDuration(3_600_000)).toBe('1 h 00 min');
    expect(formatDuration(3_780_000)).toBe('1 h 03 min');
  });

  it('calculează media pe întrebare', () => {
    expect(averagePerQuestion(200_000, 10)).toBe('20 de secunde');
    expect(averagePerQuestion(100_000, 10)).toBe('10 secunde');
    expect(averagePerQuestion(0, 10)).toBeNull();
    expect(averagePerQuestion(200_000, 0)).toBeNull();
    // Sub trei secunde de întrebare nu e un fapt divers, e zgomot.
    expect(averagePerQuestion(20_000, 10)).toBeNull();
    expect(averagePerQuestion(400, 10)).toBeNull();
  });
});
