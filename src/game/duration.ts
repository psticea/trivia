/**
 * Formatarea duratei unei runde, în română.
 *
 * Regula acordului cu „de”: numeralele al căror rest la 100 e între 1 și 19
 * merg fără „de” (2 secunde, 19 secunde), restul cer „de” (20 de secunde,
 * 47 de secunde, 101 secunde — pentru că 101 mod 100 = 1).
 */

function needsDe(n: number): boolean {
  const rest = n % 100;
  return !(rest >= 1 && rest <= 19);
}

function plural(n: number, one: string, few: string): string {
  if (n === 1) return `o ${one}`;
  return needsDe(n) ? `${n} de ${few}` : `${n} ${few}`;
}

export function secondsPhrase(n: number): string {
  return n === 1 ? 'o secundă' : plural(n, 'secundă', 'secunde');
}

export function minutesPhrase(n: number): string {
  return n === 1 ? 'un minut' : plural(n, 'minut', 'minute');
}

/** „47 de secunde”, „un minut și 5 secunde”, „12 minute”, „1 h 03 min”. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));

  if (totalSeconds === 0) return 'mai puțin de o secundă';
  if (totalSeconds < 60) return secondsPhrase(totalSeconds);

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  }

  if (seconds === 0) return minutesPhrase(totalMinutes);
  return `${minutesPhrase(totalMinutes)} și ${secondsPhrase(seconds)}`;
}

/**
 * Media pe întrebare: „cam 18 secunde de întrebare”.
 * Sub trei secunde nu spune nimic interesant, așa că o ascundem.
 */
export function averagePerQuestion(ms: number, questions: number): string | null {
  if (questions <= 0 || ms <= 0) return null;
  const perQuestion = Math.round(ms / questions / 1000);
  if (perQuestion < 3) return null;
  return secondsPhrase(perQuestion);
}
