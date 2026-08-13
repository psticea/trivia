/**
 * Reacția de la finalul rundei.
 *
 * Pentru fiecare scor posibil există cinci formulări, iar una se alege la
 * întâmplare. Sunt scrise pe scor exact, nu pe intervale: 9 din 10 și 10 din 10
 * merită reacții diferite, la fel 0 din 20 și 0 din 10.
 *
 * În fiecare grup, cel puțin una e de râs. Gluma e mereu despre situație sau
 * despre joc, niciodată pe seama jucătorului — diferența dintre „hai că mai
 * încerci” și „ești prost”. Câteva se sprijină pe un fapt real: ghicitul pe
 * nimereală, cu patru variante, dă în medie 2,5 din 10 și 5 din 20.
 *
 * Toate sunt scurte: apar ca titlu mare pe ecranul de rezultate.
 */

/** Cinci reacții pentru fiecare scor de la 0 la 10, într-o rundă de zece. */
const VERDICTS_10: string[][] = [
  // 0
  [
    'Zero. Măcar punctul de plecare e clar.',
    'Statistic, ghicitul pe nimereală dădea 2,5.',
    'Runda asta a fost a întrebărilor. Toate.',
    'Nimic nimerit. Se întâmplă.',
    'Niciunul. Mai rău de atât nu are cum.',
  ],
  // 1
  [
    'Unul. Nu pleci chiar cu mâna goală.',
    'Cu ochii închiși ieșea statistic mai bine.',
    'Un punct, singur pe tablă.',
    'Unu din zece. Tot e un început.',
    'Un răspuns bun. Restul, data viitoare.',
  ],
  // 2
  [
    'Două. Începe să semene a scor.',
    'Exact cât scotea și o monedă aruncată.',
    'Două nimerite, opt ratate.',
    'Doar două. Întrebările au fost în formă.',
    'Două puncte. Puține, dar ale tale.',
  ],
  // 3
  [
    'Trei. Ai învins hazardul. La limită.',
    'Trei din zece. Ai prins câteva.',
    'Trei bune. Restul, altă dată.',
    'Sub jumătate, dar nu chiar de la zero.',
    'Trei. Mai încearcă, sunt destule.',
  ],
  // 4
  [
    'Patru. Exact nota de pe teza aia.',
    'Patru. Aproape de jumătate.',
    'Puțin sub prag.',
    'Patru bune. Se putea și mai rău.',
    'Aproape jumătate. Aproape.',
  ],
  // 5
  [
    'Cinci curat. Trecere la limită.',
    'Jumătate. Fix la mijloc.',
    'Cinci și cinci. Perfect echilibrat.',
    'Ai împărțit dreptatea cu întrebările.',
    'La egalitate cu jocul.',
  ],
  // 6
  [
    'Șase. Trecut, dar fără laude.',
    'Șase din zece. Ai luat avantajul.',
    'Mai multe bune decât rele.',
    'Peste jumătate, cu ceva marjă.',
    'Șase. Un scor decent.',
  ],
  // 7
  [
    'Șapte. Nota care nu supăra pe nimeni.',
    'Șapte din zece. Solid.',
    'Ai pierdut doar trei.',
    'Șapte bune. Se vede că știi.',
    'Scor bun, cu trei scăpări.',
  ],
  // 8
  [
    'Opt. Media care ținea bursa.',
    'Opt din zece. Aproape de vârf.',
    'Doar două ți-au scăpat.',
    'Opt bune din zece. Serios.',
    'Aproape perfect.',
  ],
  // 9
  [
    'Nouă. Una singură ți-a stricat carnetul.',
    'Nouă din zece. O singură scăpare.',
    'Doar una ți-a scăpat.',
    'Aproape tot. Aproape.',
    'Nouă bune. Excelent.',
  ],
  // 10
  [
    'Zece. Poți să-l pui pe frigider.',
    'Zece din zece. Impecabil.',
    'Tot. Fără nicio greșeală.',
    'Perfect. Nimic de comentat.',
    'Runda ta, de la cap la coadă.',
  ],
];

/** Cinci reacții pentru fiecare scor de la 0 la 20, într-o rundă dublă. */
const VERDICTS_20: string[][] = [
  // 0
  [
    'Douăzeci de întrebări și niciun accident fericit.',
    'Zero din douăzeci. Runda a trecut pe lângă tine.',
    'Nimic. Măcar ai mers până la capăt.',
    'Zero. Rar se întâmplă, în ambele sensuri.',
    'Niciunul din douăzeci. O luăm altfel.',
  ],
  // 1
  [
    'Unul. Și ăla pare venit din întâmplare.',
    'Un punct la douăzeci de întrebări.',
    'Unul singur a nimerit.',
    'Unu din douăzeci. Început greu.',
    'Un răspuns bun în toată runda.',
  ],
  // 2
  [
    'Două. Zarul ar fi făcut treabă mai bună.',
    'Două din douăzeci. Drum greu.',
    'Două nimerite din douăzeci.',
    'Doi din douăzeci. Se poate construi.',
    'Două puncte. Puțin, dar nu nimic.',
  ],
  // 3
  [
    'Trei. Hazardul te-ar fi ajutat mai mult.',
    'Trei din douăzeci. Începutul e greu.',
    'Trei bune. Restul, la revanșă.',
    'Trei. Runda a fost lungă și dură.',
    'Trei puncte. Mai e mult teren.',
  ],
  // 4
  [
    'Patru. Cu un punct sub pura nimereală.',
    'Patru din douăzeci. Un sfert de sfert.',
    'Patru. Se adună încet.',
    'Patru bune din douăzeci.',
    'Patru puncte. Mergem mai departe.',
  ],
  // 5
  [
    'Cinci. Fix cât nimerea și o pisică pe tastatură.',
    'Cinci din douăzeci. Un sfert exact.',
    'Un sfert din runda dublă.',
    'Cinci bune. Mai e mult.',
    'Un sfert. Nu-i rău de unde ai plecat.',
  ],
  // 6
  [
    'Șase. Ai depășit hazardul cu un fir de păr.',
    'Șase din douăzeci. Prinde contur.',
    'Șase bune. Încă sub jumătate.',
    'Șase. Runda lungă cere răbdare.',
    'Șase puncte. Se vede progresul.',
  ],
  // 7
  [
    'Șapte. De aici încolo contează priceperea.',
    'Șapte din douăzeci. Mai e până la mijloc.',
    'Șapte bune. Drumul continuă.',
    'Șapte. Câteva domenii te-au încurcat.',
    'Șapte puncte adunate.',
  ],
  // 8
  [
    'Opt. Încă două și era jumătate. Clasic.',
    'Opt din douăzeci. Aproape de mijloc.',
    'Opt bune. Se apropie jumătatea.',
    'Opt. Runda lungă cere rezistență.',
    'Opt puncte. Prinde bine.',
  ],
  // 9
  [
    'Nouă. Una singură până la egalitate. Clasic.',
    'Nouă din douăzeci. Un pas până la jumătate.',
    'Nouă bune. Aproape echilibru.',
    'Nouă. Foarte aproape de mijloc.',
    'Nouă puncte. Aproape jumătate.',
  ],
  // 10
  [
    'Zece și zece. Perfect indecis.',
    'Zece din douăzeci. Jumătate exact.',
    'Jumătate din runda dublă.',
    'Jumătate. Nici bine, nici rău.',
    'La egalitate cu întrebările.',
  ],
  // 11
  [
    'Unsprezece. Ai câștigat la puncte.',
    'Unsprezece din douăzeci. Peste jumătate.',
    'Ai trecut de mijloc.',
    'Peste jumătate, cu puțin.',
    'Unsprezece puncte. Bun sens.',
  ],
  // 12
  [
    'Doisprezece. Peste linia de plutire.',
    'Doisprezece din douăzeci. Peste prag.',
    'Doisprezece bune. Scor rezonabil.',
    'Trei cincimi. Se ține.',
    'Doisprezece puncte. Solid pe distanță.',
  ],
  // 13
  [
    'Treisprezece. Noroc că nu ești superstițios.',
    'Treisprezece din douăzeci. Scor bun.',
    'Treisprezece bune. Se vede consistența.',
    'Treisprezece. Ai dus bine runda lungă.',
    'Peste prag, cu marjă.',
  ],
  // 14
  [
    'Paisprezece. Ai fi luat șapte la teză.',
    'Paisprezece din douăzeci. Scor bun pe distanță.',
    'Paisprezece bune. Cultură generală solidă.',
    'Șase scăpări din douăzeci.',
    'Paisprezece puncte. Bine dus.',
  ],
  // 15
  [
    'Trei sferturi. Cât o oră de curs.',
    'Cincisprezece din douăzeci. Trei sferturi.',
    'Cincisprezece bune. Foarte bine.',
    'Cincisprezece. Doar cinci scăpări.',
    'Trei sferturi. Scor puternic.',
  ],
  // 16
  [
    'Șaisprezece. Deja se laudă cineva cu tine.',
    'Șaisprezece din douăzeci. Foarte bine.',
    'Șaisprezece bune. Patru scăpări.',
    'Opt din zece, ținut pe distanță dublă.',
    'Șaisprezece puncte. Impresionant.',
  ],
  // 17
  [
    'Șaptesprezece. Trei scăpări și-un orgoliu intact.',
    'Șaptesprezece din douăzeci. Aproape de vârf.',
    'Șaptesprezece bune. Doar trei ratate.',
    'Șaptesprezece. Runda lungă nu te-a clintit.',
    'Șaptesprezece puncte. Foarte solid.',
  ],
  // 18
  [
    'Optsprezece. Două greșeli și mult regret.',
    'Optsprezece din douăzeci. Excelent.',
    'Optsprezece bune. Doar două ratate.',
    'Nouă din zece, ținut douăzeci de întrebări.',
    'Optsprezece. Aproape fără fisură.',
  ],
  // 19
  [
    'Nouăsprezece. Aia una o să te bântuie.',
    'Nouăsprezece din douăzeci. La un pas de tot.',
    'O singură scăpare în douăzeci.',
    'Nouăsprezece bune. Aproape perfect.',
    'Nouăsprezece. Cât pe ce.',
  ],
  // 20
  [
    'Douăzeci din douăzeci. Ne dăm bătuți.',
    'Perfect, pe distanța lungă.',
    'Tot. Douăzeci de întrebări, nicio greșeală.',
    'Douăzeci din douăzeci. Foarte rar.',
    'Runda dublă, fără nicio fisură.',
  ],
];

/** Rezervă pentru lungimi de rundă neprevăzute; procentajul decide tonul. */
const VERDICTS_FALLBACK: string[][] = [
  [
    'Runda asta a fost a întrebărilor.',
    'Nimereala ar fi ieșit pe plus.',
    'Nu a mers. Se întâmplă.',
    'Întrebările au câștigat.',
    'O luăm de la capăt.',
  ],
  [
    'Sub jumătate. Se poate repara.',
    'Câteva bune, multe scăpate.',
    'Rezonabil, dar mai e loc.',
    'Un scor de mijloc de drum.',
    'Se vede că știi. Pe alocuri.',
  ],
  [
    'Peste jumătate. Bine.',
    'Mai multe bune decât rele.',
    'Un rezultat onorabil.',
    'Scor decent.',
    'Se ține.',
  ],
  [
    'Scor bun.',
    'Solid. Puține scăpări.',
    'Foarte bine dus.',
    'Aproape de vârf.',
    'Impresionant.',
  ],
  [
    'Aproape perfect.',
    'Ne dăm bătuți.',
    'Excelent.',
    'Fără fisuri.',
    'Runda ta.',
  ],
];

function table(total: number): string[][] | null {
  if (total === 10) return VERDICTS_10;
  if (total === 20) return VERDICTS_20;
  return null;
}

/**
 * Alege una dintre cele cinci reacții pentru scorul obținut.
 * `seed` face alegerea stabilă pentru o rundă anume, ca textul să nu sară
 * la fiecare re-randare — aceeași capcană ca la amestecarea opțiunilor.
 */
export function verdictFor(score: number, total: number, seed: number): string {
  const clamped = Math.max(0, Math.min(score, Math.max(0, total)));
  const exact = table(total);
  const bucket = exact
    ? exact[clamped]
    : VERDICTS_FALLBACK[
        Math.min(
          VERDICTS_FALLBACK.length - 1,
          Math.floor((clamped / Math.max(1, total)) * VERDICTS_FALLBACK.length),
        )
      ];
  const options = bucket ?? VERDICTS_FALLBACK[0];
  const pick = ((seed ^ Math.imul(clamped + 1, 2654435761)) >>> 0) % options.length;
  return options[pick];
}

/** Expus pentru teste: fiecare scor trebuie să aibă exact cinci variante. */
export const VERDICT_TABLES = {
  ten: VERDICTS_10,
  twenty: VERDICTS_20,
  fallback: VERDICTS_FALLBACK,
};
