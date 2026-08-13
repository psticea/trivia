/**
 * Reacția de la finalul rundei.
 *
 * Pentru fiecare scor posibil există cinci formulări, iar una se alege la
 * întâmplare. Sunt scrise pe scor exact, nu pe intervale: 9 din 10 și 10 din 10
 * merită reacții diferite, la fel 0 din 20 și 0 din 10.
 *
 * La adulți, cele cinci nu sunt cinci variante ale aceleiași propoziții — asta
 * era plictiseala versiunii dintâi, unde patru din cinci spuneau „șase din
 * douăzeci” cu alte cuvinte. Fiecare grup are un amestec fix, pe poziții:
 *
 *   [0]    ironică — seacă, cu o întorsătură
 *   [1..2] amuzante — glumă adevărată, cu imagine
 *   [3..4] neutre — spun ceva relevant despre scor, fără glumă
 *
 * Poziția nu schimbă alegerea, care rămâne la întâmplare; e doar rețeta după
 * care se scriu, ca să nu alunece iar toate cinci în același registru.
 *
 * Gluma e mereu despre situație sau despre joc, niciodată pe seama jucătorului
 * — diferența dintre „hai că mai încerci” și „ești prost”. Câteva se sprijină
 * pe un fapt real: ghicitul pe nimereală, cu patru variante, dă în medie 2,5
 * din 10 și 5 din 20.
 *
 * Toate sunt scurte: apar ca titlu mare pe ecranul de rezultate.
 */

/** Cinci reacții pentru fiecare scor de la 0 la 10, într-o rundă de zece. */
const VERDICTS_10: string[][] = [
  // 0
  [
    'Zero. Măcar e un rezultat curat.',
    'Zece întrebări au trecut pe lângă tine fluierând.',
    'Nici măcar din greșeală. Impresionant în felul lui.',
    'Zero din zece. Se întâmplă, mai ales pe necunoscut.',
    'Niciunul. De aici, orice rundă e mai bună.',
  ],
  // 1
  [
    'Unul. Nu pleci chiar cu mâna goală.',
    'Un punct singur pe tablă. Ca un pahar uitat.',
    'Ghicitul pe nimereală ieșea mai bine. Serios.',
    'Unu din zece. Un început, atât.',
    'Un răspuns bun. Restul, data viitoare.',
  ],
  // 2
  [
    'Două. Începe să semene a scor.',
    'Exact cât scotea și o monedă aruncată de zece ori.',
    'Două. Cam cât nimerește pisica pe tastatură.',
    'Două bune din zece. Puține, dar ale tale.',
    'Sub prag, dar nu de la zero.',
  ],
  // 3
  [
    'Trei. Ai învins hazardul. La limită.',
    'Trei. Cu doar o jumătate de punct peste pura nimereală.',
    'Trei. Cât o notă de la un profesor bine dispus.',
    'Trei din zece. Ai prins câteva.',
    'Trei bune. Mai sunt destule întrebări.',
  ],
  // 4
  [
    'Patru. Exact nota de pe teza aia.',
    'Patru. Restul întrebărilor s-au făcut că plouă.',
    'Patru. Jumătatea ți-a făcut cu mâna de departe.',
    'Patru bune din zece. Puțin sub prag.',
    'Aproape jumătate. Aproape.',
  ],
  // 5
  [
    'Cinci curat. Trecere la limită.',
    'Cinci și cinci. Nici tu, nici întrebările.',
    'Jumate-jumate, ca la împărțit ultima felie.',
    'Jumătate. Fix la mijloc.',
    'Cinci bune, cinci ratate.',
  ],
  // 6
  [
    'Șase. Trecut, dar fără laude.',
    'Șase. Suficient cât să spui că a fost ușor.',
    'Șase din zece, adică patru povești de spus acasă.',
    'Peste jumătate, cu ceva marjă.',
    'Șase bune. Un scor decent.',
  ],
  // 7
  [
    'Șapte. Nota care nu supăra pe nimeni.',
    'Șapte. Trei întrebări îți poartă pică.',
    'Șapte. Destul cât să te crezi bun la toate.',
    'Șapte din zece. Solid.',
    'Ai pierdut doar trei.',
  ],
  // 8
  [
    'Opt. Media care ținea bursa.',
    'Opt. Două întrebări au scăpat cu viață.',
    'Opt din zece. Restul două se prefac că nu te cunosc.',
    'Opt bune din zece. Serios.',
    'Doar două ți-au scăpat.',
  ],
  // 9
  [
    'Nouă. Una singură ți-a stricat carnetul.',
    'Nouă. Aia una o să-ți vină în minte diseară.',
    'Nouă din zece. A rămas o întrebare să te țină modest.',
    'Nouă bune. Excelent.',
    'Doar una ți-a scăpat.',
  ],
  // 10
  [
    'Zece. Poți să-l pui pe frigider.',
    'Zece din zece. Cineva a învățat pentru asta.',
    'Tot. Întrebările se retrag ofensate.',
    'Perfect. Nimic de comentat.',
    'Zece din zece, de la cap la coadă.',
  ],
];

/** Cinci reacții pentru fiecare scor de la 0 la 20, într-o rundă dublă. */
const VERDICTS_20: string[][] = [
  // 0
  [
    'Douăzeci de întrebări și niciun accident fericit.',
    'Zero din douăzeci. Statistic, e o performanță.',
    'Douăzeci la zero. Întrebările sărbătoresc undeva.',
    'Zero. Runda a trecut complet pe lângă tine.',
    'Niciunul din douăzeci. O luăm altfel.',
  ],
  // 1
  [
    'Unul. Și ăla pare venit din întâmplare.',
    'Un punct în douăzeci de întrebări. Aproape o colecție.',
    'Unul. L-ai găsit cum găsești un leu pe stradă.',
    'Unu din douăzeci. Început greu.',
    'Un răspuns bun în toată runda.',
  ],
  // 2
  [
    'Două. Zarul ar fi făcut treabă mai bună.',
    'Două. Ai bătut moneda, dar nu și zarul.',
    'Două din douăzeci, adică optsprezece păreri de rău.',
    'Două din douăzeci. Drum greu.',
    'Două puncte. Puțin, dar nu nimic.',
  ],
  // 3
  [
    'Trei. Hazardul te-ar fi ajutat mai mult.',
    'Trei. Nimereala pură scotea cinci, dar cine numără.',
    'Trei din douăzeci. Restul s-au ascuns bine.',
    'Trei din douăzeci. Începutul e greu.',
    'Trei bune. Mai e mult teren.',
  ],
  // 4
  [
    'Patru. Cu un punct sub pura nimereală.',
    'Patru. O monedă aruncată ar cere procent.',
    'Patru din douăzeci. Un sfert de sfert, cum ar veni.',
    'Patru corecte, șaisprezece ratate.',
    'Patru puncte. Se adună încet.',
  ],
  // 5
  [
    'Cinci. Fix cât nimerea și o pisică pe tastatură.',
    'Exact media ghicitului. Nici mai sus, nici mai jos.',
    'Cinci din douăzeci. Ai jucat la egalitate cu norocul.',
    'Cinci din douăzeci. Un sfert exact.',
    'Un sfert din runda dublă.',
  ],
  // 6
  [
    'Șase. Ai depășit hazardul cu un fir de păr.',
    'Șase. Cu un punct peste ce dădea aruncatul cu banul.',
    'Șase din douăzeci. Paisprezece te-au refuzat politicos.',
    'Șase din douăzeci. Prinde contur.',
    'Șase bune. Încă sub jumătate.',
  ],
  // 7
  [
    'Șapte. De aici încolo contează priceperea.',
    'Șapte. Norocul și-a luat mâna, se vede.',
    'Șapte din douăzeci. Câteva domenii te-au ținut la ușă.',
    'Șapte din douăzeci. Mai e până la mijloc.',
    'Șapte puncte adunate.',
  ],
  // 8
  [
    'Opt. Încă două și era jumătate. Clasic.',
    'Opt. Jumătatea se vede de aici, dar nu se atinge.',
    'Opt din douăzeci. Douăsprezece stau și se uită la tine.',
    'Opt din douăzeci. Aproape de mijloc.',
    'Opt bune. Se apropie jumătatea.',
  ],
  // 9
  [
    'Nouă. Una singură până la egalitate. Clasic.',
    'Nouă. Îți lipsește exact răspunsul ăla pe care-l știai.',
    'Nouă din douăzeci. Mijlocul e la o întrebare distanță.',
    'Nouă din douăzeci. Un pas până la jumătate.',
    'Nouă bune. Aproape echilibru.',
  ],
  // 10
  [
    'Zece și zece. Perfect indecis.',
    'Zece și zece. Nici tu, nici ele. Remiză.',
    'Jumate-jumate, ca la împărțit nota de plată.',
    'Zece din douăzeci. Jumătate exact.',
    'Jumătate din runda dublă.',
  ],
  // 11
  [
    'Unsprezece. Ai câștigat la puncte.',
    'Victorie la limită, ca un gol în minutul 90.',
    'Un punct de demnitate peste jumătate.',
    'Unsprezece din douăzeci. Peste jumătate.',
    'Ai trecut de mijloc.',
  ],
  // 12
  [
    'Doisprezece. Peste linia de plutire.',
    'Doisprezece. Suficient cât să spui că runda a fost grea.',
    'Opt întrebări nu-ți mai răspund la mesaje.',
    'Doisprezece din douăzeci. Trei cincimi.',
    'Doisprezece bune. Scor rezonabil.',
  ],
  // 13
  [
    'Treisprezece. Noroc că nu ești superstițios.',
    'Cifra care sperie pe toată lumea, dar nu și pe tine.',
    'Treisprezece din douăzeci. Șapte au plecat cu alții.',
    'Treisprezece din douăzeci. Scor bun.',
    'Peste prag, cu marjă.',
  ],
  // 14
  [
    'Paisprezece. Ai fi luat șapte la teză.',
    'Paisprezece. Șase greșeli și zero regrete, sperăm.',
    'Paisprezece din douăzeci. Restul s-au dat la fund.',
    'Paisprezece din douăzeci. Scor bun pe distanță.',
    'Șase scăpări din douăzeci.',
  ],
  // 15
  [
    'Trei sferturi. Cât o oră de curs.',
    'Cinci întrebări te-au prins pe picior greșit.',
    'Restul de cinci rămân materie pentru altă dată.',
    'Cincisprezece din douăzeci. Scor puternic.',
    'Cincisprezece bune, cinci ratate.',
  ],
  // 16
  [
    'Șaisprezece. Deja se laudă cineva cu tine.',
    'Patru întrebări au scăpat printre degete și se laudă.',
    'Opt din zece, ținut douăzeci de întrebări.',
    'Șaisprezece din douăzeci. Foarte bine.',
    'Patru scăpări în douăzeci de întrebări.',
  ],
  // 17
  [
    'Șaptesprezece. Trei scăpări și-un orgoliu intact.',
    'Trei întrebări au reușit să nu se dea bătute.',
    'Șaptesprezece din douăzeci. Se aude de aici cum știi.',
    'Șaptesprezece din douăzeci. Aproape de vârf.',
    'Doar trei ratate în runda lungă.',
  ],
  // 18
  [
    'Optsprezece. Două greșeli și mult regret.',
    'Cele două o să-ți vină în minte pe la miezul nopții.',
    'Practic ai epuizat întrebările.',
    'Optsprezece din douăzeci. Excelent.',
    'Nouă din zece, ținut pe distanța dublă.',
  ],
  // 19
  [
    'Nouăsprezece. Aia una o să te bântuie.',
    'O singură întrebare ține perfectul ostatic.',
    'Ai ratat exact cât să rămâi om.',
    'Nouăsprezece din douăzeci. La un pas de tot.',
    'O singură scăpare în douăzeci.',
  ],
  // 20
  [
    'Douăzeci din douăzeci. Ne dăm bătuți.',
    'Cineva a citit toată enciclopedia.',
    'Tot. Întrebările își caută alt adversar.',
    'Perfect, pe distanța lungă.',
    'Douăzeci de întrebări, nicio greșeală.',
  ],
];

/** Reacții blânde pentru fiecare scor de la 0 la 10, într-o rundă de zece. */
const VERDICTS_KIDS_10: string[][] = [
  // 0
  [
    'Runda asta a fost grea.',
    'Dragonul a păzit răspunsurile.',
    'Mai încercăm cu curaj.',
    'Întrebări șirete azi.',
    'Start greu, jocul continuă.',
  ],
  // 1
  [
    'Un răspuns a ieșit la lumină.',
    'Primul punct e în rucsac.',
    'Robotul a găsit o piesă.',
    'Început mic, curaj mare.',
    'Mai vine o rundă bună.',
  ],
  // 2
  [
    'Două stele aprinse.',
    'Dinozaurul a prins două.',
    'Ai pornit motorul jocului.',
    'Runda a fost cam năzdrăvană.',
    'Două bune, hai mai departe.',
  ],
  // 3
  [
    'Trei răspunsuri curajoase.',
    'Pinguinul a bătut din aripi.',
    'Ai prins câteva capcane.',
    'Trei pași pe potecă.',
    'Încă o rundă poate schimba tot.',
  ],
  // 4
  [
    'Patru comori găsite.',
    'Sandvișul magic a ajutat.',
    'Aproape de mijloc.',
    'Întrebările au fost sprintene.',
    'Ai adunat puncte bune.',
  ],
  // 5
  [
    'Jumătate e cucerită.',
    'Cinci lumini pe hartă.',
    'Un extraterestru ar aplauda.',
    'Egal cu întrebările.',
    'Runda s-a ținut bine.',
  ],
  // 6
  [
    'Șase răspunsuri istețe.',
    'Dragonul începe să zâmbească.',
    'Ai trecut de mijloc.',
    'Mai multe bune decât grele.',
    'Scor frumos, pas sigur.',
  ],
  // 7
  [
    'Șapte comori în buzunar.',
    'Robotul face dansul victoriei.',
    'Foarte bine prins.',
    'Doar câteva ți-au scăpat.',
    'Runda arată tare bine.',
  ],
  // 8
  [
    'Opt răspunsuri strălucite.',
    'Dinozaurul ridică trofeul.',
    'Aproape de tot.',
    'Ai fost pe fază.',
    'Doar două capcane au rămas.',
  ],
  // 9
  [
    'Nouă stele pe cer.',
    'Pinguinul poartă coroană.',
    'O singură întrebare a scăpat.',
    'Aproape perfect, bravo.',
    'Runda a fost a ta.',
  ],
  // 10
  [
    'Totul corect!',
    'Dragonul cere autograf.',
    'Zece din zece, minunat.',
    'Ai curățat harta.',
    'Rundă fără nicio capcană.',
  ],
];

/** Reacții blânde pentru fiecare scor de la 0 la 20, într-o rundă dublă. */
const VERDICTS_KIDS_20: string[][] = [
  // 0
  [
    'Runda lungă a fost grea.',
    'Dragonul a închis cufărul.',
    'Curaj, o luăm de la capăt.',
    'Întrebări cu coadă azi.',
    'Data viitoare prindem una.',
  ],
  // 1
  [
    'Un punct a apărut.',
    'O stea mică pe hartă.',
    'Robotul a găsit un șurub.',
    'Început greu, dar jucat.',
    'Un răspuns bun e prins.',
  ],
  // 2
  [
    'Două puncte în rucsac.',
    'Dinozaurul a numărat două.',
    'Runda a fost foarte șireată.',
    'Două lumini aprinse.',
    'Ai făcut primii pași.',
  ],
  // 3
  [
    'Trei răspunsuri găsite.',
    'Pinguinul alunecă spre victorie.',
    'Întrebările au fost iuți.',
    'Trei puncte țin drumul.',
    'Mai încercăm cu zâmbet.',
  ],
  // 4
  [
    'Patru comori mici.',
    'Sandvișul curajos a mușcat.',
    'Ai prins câteva idei.',
    'Runda lungă cere răbdare.',
    'Patru puncte se adună.',
  ],
  // 5
  [
    'Cinci răspunsuri pe hartă.',
    'Robotul aprinde un bec.',
    'Un sfert e cucerit.',
    'Întrebările au fost năzdrăvane.',
    'Scor mic, curaj mare.',
  ],
  // 6
  [
    'Șase pași înainte.',
    'Dragonul clipește mirat.',
    'Ai adunat răspunsuri bune.',
    'Runda începe să se deschidă.',
    'Șase lumini pe traseu.',
  ],
  // 7
  [
    'Șapte puncte prinse.',
    'Extraterestrul face tumbe.',
    'Mai e drum, dar mergi bine.',
    'Ai învins câteva capcane.',
    'Șapte comori sunt ale tale.',
  ],
  // 8
  [
    'Opt răspunsuri bune.',
    'Dinozaurul poartă ochelari.',
    'Aproape de mijloc.',
    'Runda lungă merge mai bine.',
    'Ai prins ritmul jocului.',
  ],
  // 9
  [
    'Nouă stele adunate.',
    'Pinguinul bate toba.',
    'Un pas până la mijloc.',
    'Ai fost aproape de egal.',
    'Nouă capcane au cedat.',
  ],
  // 10
  [
    'Jumătate e cucerită.',
    'Robotul împarte tortul egal.',
    'Zece răspunsuri bune.',
    'La mijloc, cu zâmbet.',
    'Runda e echilibrată.',
  ],
  // 11
  [
    'Ai trecut de mijloc.',
    'Dragonul dă din coadă vesel.',
    'Unsprezece puncte solide.',
    'Mai multe bune decât grele.',
    'Drumul arată bine.',
  ],
  // 12
  [
    'Doisprezece răspunsuri bune.',
    'Extraterestrul cere bis.',
    'Scor frumos pe rundă lungă.',
    'Ai prins bine traseul.',
    'Douăsprezece stele aprinse.',
  ],
  // 13
  [
    'Treisprezece comori găsite.',
    'Dinozaurul dansează lent.',
    'Runda merge foarte bine.',
    'Ai dus bine provocarea.',
    'Capcanele au rămas puține.',
  ],
  // 14
  [
    'Paisprezece puncte frumoase.',
    'Pinguinul ridică fanionul.',
    'Ai fost atent pe traseu.',
    'Scor bun, cu pași siguri.',
    'Întrebările au obosit.',
  ],
  // 15
  [
    'Cincisprezece, foarte bine.',
    'Robotul cântă la trompetă.',
    'Trei sferturi cucerite.',
    'Ai prins multe răspunsuri.',
    'Runda strălucește frumos.',
  ],
  // 16
  [
    'Șaisprezece răspunsuri istețe.',
    'Dragonul îți păstrează loc.',
    'Doar patru au scăpat.',
    'Foarte bine pe distanță.',
    'Scor mare și curat.',
  ],
  // 17
  [
    'Șaptesprezece stele mari.',
    'Dinozaurul face reverență.',
    'Aproape de vârf.',
    'Doar trei capcane au rămas.',
    'Ai mers tare bine.',
  ],
  // 18
  [
    'Optsprezece, excelent.',
    'Pinguinul aruncă confetti.',
    'Doar două ți-au scăpat.',
    'Rundă lungă, scor grozav.',
    'Ai fost foarte pe fază.',
  ],
  // 19
  [
    'Nouăsprezece, uimitor.',
    'Robotul cere poză cu tine.',
    'O singură întrebare a fugit.',
    'Aproape totul corect.',
    'Runda aproape perfectă.',
  ],
  // 20
  [
    'Totul corect!',
    'Dragonul cere sfaturi.',
    'Douăzeci din douăzeci!',
    'Hartă curată, nicio capcană.',
    'Rundă perfectă pe bune.',
  ],
];

/** Rezervă pentru lungimi de rundă neprevăzute; procentajul decide tonul. */
const VERDICTS_FALLBACK: string[][] = [
  [
    'Runda asta a fost a întrebărilor.',
    'Nimereala ar fi ieșit pe plus. Ceea ce spune ceva.',
    'Întrebările au câștigat și încă se laudă.',
    'Nu a mers deloc. Se întâmplă.',
    'O luăm de la capăt.',
  ],
  [
    'Sub jumătate. Se poate repara.',
    'Ai ciupit câteva, restul te-au ocolit elegant.',
    'Sub jumătate, dar cu momente de strălucire. Scurte.',
    'Câteva bune, multe scăpate.',
    'Un scor de mijloc de drum.',
  ],
  [
    'Peste jumătate. Bine.',
    'Peste jumătate, adică ai voie să comentezi la televizor.',
    'Contabilitatea e de partea ta: mai multe bune.',
    'Un rezultat onorabil.',
    'Scor decent, cu ceva scăpări.',
  ],
  [
    'Scor bun. Aproape suspect.',
    'Câteva întrebări se fac că nu s-a întâmplat nimic.',
    'Solid. Se aude de aici cum știi.',
    'Foarte bine dus. Puține scăpări.',
    'Aproape de vârf.',
  ],
  [
    'Ne dăm bătuți.',
    'Aproape fără fisură. Aproape.',
    'Întrebările își caută alt adversar.',
    'Excelent. Nimic de comentat.',
    'Runda ta, de la cap la coadă.',
  ],
];

/** Rezervă blândă pentru lungimi de rundă neprevăzute. */
const VERDICTS_KIDS_FALLBACK: string[][] = [
  [
    'Runda asta a fost grea.',
    'Dragonul a ascuns răspunsurile.',
    'Mai încercăm cu zâmbet.',
    'Întrebări șirete azi.',
    'Curaj, jocul continuă.',
  ],
  [
    'Câteva comori găsite.',
    'Robotul a prins câteva.',
    'Mai e drum, dar e bine.',
    'Runda cere încă o încercare.',
    'Ai aprins primele stele.',
  ],
  [
    'Mai multe bune decât grele.',
    'Pinguinul aplaudă încet.',
    'Scor frumos.',
    'Ai trecut de mijloc.',
    'Traseul arată bine.',
  ],
  [
    'Foarte bine prins.',
    'Dinozaurul ridică trofeul.',
    'Puține capcane au rămas.',
    'Scor mare și frumos.',
    'Ai fost pe fază.',
  ],
  [
    'Aproape perfect.',
    'Dragonul cere autograf.',
    'Excelent pe traseu.',
    'Runda a fost a ta.',
    'Stelele sunt aprinse.',
  ],
];

function table(total: number): string[][] | null {
  if (total === 10) return VERDICTS_10;
  if (total === 20) return VERDICTS_20;
  return null;
}

function kidTable(total: number): string[][] | null {
  if (total === 10) return VERDICTS_KIDS_10;
  if (total === 20) return VERDICTS_KIDS_20;
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

/** Alege una dintre cele cinci reacții blânde pentru scorul obținut. */
export function kidVerdictFor(score: number, total: number, seed: number): string {
  const clamped = Math.max(0, Math.min(score, Math.max(0, total)));
  const exact = kidTable(total);
  const bucket = exact
    ? exact[clamped]
    : VERDICTS_KIDS_FALLBACK[
        Math.min(
          VERDICTS_KIDS_FALLBACK.length - 1,
          Math.floor((clamped / Math.max(1, total)) * VERDICTS_KIDS_FALLBACK.length),
        )
      ];
  const options = bucket ?? VERDICTS_KIDS_FALLBACK[0];
  const pick = ((seed ^ Math.imul(clamped + 1, 2654435761)) >>> 0) % options.length;
  return options[pick];
}

/** Expus pentru teste: fiecare scor trebuie să aibă exact cinci variante. */
export const VERDICT_TABLES = {
  ten: VERDICTS_10,
  twenty: VERDICTS_20,
  fallback: VERDICTS_FALLBACK,
  kidsTen: VERDICTS_KIDS_10,
  kidsTwenty: VERDICTS_KIDS_20,
  kidsFallback: VERDICTS_KIDS_FALLBACK,
};
