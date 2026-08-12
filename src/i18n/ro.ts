/**
 * Toate textele vizibile, într-un singur loc, ca să poată fi corectate dintr-o
 * singură citire. Jocul este exclusiv în română — fără mecanism de traducere.
 */

export const ro = {
  meta: {
    title: 'Fișier de întrebări',
    tagline: 'Nouă sute de fișe despre lume și despre noi.',
    subtitle: 'Zece întrebări pe rundă. Alegi nivelul, alegi domeniile, restul ține de tine.',
  },

  start: {
    play: 'Începe jocul',
    newRound: 'Joc nou',
    chooseDifficulty: 'Alege dificultatea',
    categories: 'Categorii',
    allCategories: 'Toate categoriile',
    minWarning: 'Selectează cel puțin 3 categorii',
    selected: (n: number) => `${n} din 10 selectate`,
    fondLabel: 'Fond',
    fondValue: (n: number) => `${n} de fișe`,
    challengeIntro: 'Ai primit o provocare',
    challengeDetail: (score: number, total: number) =>
      `Cine ți-a trimis linkul a răspuns corect la ${score} din ${total}. Primești exact aceleași întrebări.`,
    challengeStart: 'Acceptă provocarea',
    challengeDismiss: 'Nu, vreau o rundă nouă',
  },

  difficulty: {
    usor: 'Ușor',
    mediu: 'Mediu',
    dificil: 'Dificil',
    usorHint: 'Lucruri pe care le știe aproape toată lumea',
    mediuHint: 'Îți trebuie ceva atenție la subiect',
    dificilHint: 'Pentru cine chiar ține la cultura generală',
  },

  round: {
    progress: (current: number, total: number) => `Întrebarea ${current} din ${total}`,
    progressShort: (current: number, total: number) => `${current}/${total}`,
    advance: 'Continuă',
    finish: 'Vezi rezultatele',
    correct: 'Corect',
    incorrect: 'Greșit',
    reveal: 'Răspuns corect:',
    explanation: 'Explicație',
    source: 'Sursă',
    timeUp: 'A expirat timpul',
    quit: 'Renunță',
    quitConfirm: 'Închizi runda și pierzi răspunsurile de până acum?',
    keyHint: 'Taste 1–4 pentru răspuns, Enter pentru a continua',
  },

  results: {
    heading: 'Rezultate',
    scoreLine: (score: number, total: number) => `Ai răspuns corect la ${score} din ${total} întrebări`,
    perfect: 'Fișier curat. Zece din zece.',
    strong: 'Solid. Puține scăpări.',
    fair: 'Rezonabil, dar mai e loc.',
    weak: 'Runda asta a fost a întrebărilor.',
    breakdown: 'Pe categorii',
    review: 'Revezi răspunsurile',
    playAgain: 'Joacă din nou',
    share: 'Trimite provocarea',
    shareCopied: 'Link copiat',
    shareFallback: 'Copiază linkul de mai jos',
    backToStart: 'Înapoi la început',
    newRecord: (difficulty: string) => `Record personal la ${difficulty}`,
  },

  review: {
    heading: 'Revezi răspunsurile',
    yourAnswer: 'Răspunsul tău',
    noAnswer: 'Fără răspuns',
    correctAnswer: 'Răspuns corect',
    back: 'Înapoi la rezultate',
    counter: (correct: number, total: number) => `${correct} corecte din ${total}`,
  },

  stats: {
    heading: 'Statistici',
    empty: 'Nicio rundă terminată încă. Statisticile apar după prima.',
    rounds: 'Runde',
    average: 'Medie',
    best: 'Cel mai bun',
    perDifficulty: 'Pe dificultăți',
    strongest: 'Cele mai bune categorii',
    weakest: 'Categoriile care îți dau bătăi de cap',
    needMore: 'Mai joacă puțin ca să se adune date pe categorii.',
    close: 'Închide',
  },

  settings: {
    heading: 'Setări',
    theme: 'Aspect',
    themeHint: 'Întunecat pentru serile pe canapea, luminos pentru afară, la soare.',
    dark: 'Întunecat',
    light: 'Luminos',
    timer: 'Cronometru pe întrebare',
    timerHint: '30 de secunde de întrebare. Implicit oprit — explicațiile merită citite.',
    on: 'Pornit',
    off: 'Oprit',
    data: 'Datele tale',
    dataHint:
      'Totul stă în acest browser: nivelul ales, întrebările deja văzute și statisticile. Nimic nu pleacă de aici.',
    clear: 'Șterge toate datele',
    clearConfirm: 'Ștergi statisticile și evidența întrebărilor văzute?',
    cleared: 'Datele au fost șterse',
    close: 'Închide',
  },

  footer: {
    repo: 'Codul sursă',
    questions: (n: number) => `${n} de întrebări verificate`,
    built: 'Fonturi Bricolage Grotesque, Archivo și IBM Plex Mono, servite de pe acest site.',
    noTracking: 'Fără urmărire, fără cereri către alte servere.',
  },

  a11y: {
    openStats: 'Deschide statisticile',
    openSettings: 'Deschide setările',
    progressRegion: 'Progresul rundei',
    answerFeedback: 'Rezultatul răspunsului',
    optionPrefix: (letter: string) => `Varianta ${letter}`,
    categoryToggle: (name: string) => `Categoria ${name}`,
    lockedCategory: 'Trebuie să rămână cel puțin trei categorii selectate',
  },
} as const;

export const DIFFICULTY_LABEL: Record<'usor' | 'mediu' | 'dificil', string> = {
  usor: ro.difficulty.usor,
  mediu: ro.difficulty.mediu,
  dificil: ro.difficulty.dificil,
};

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
