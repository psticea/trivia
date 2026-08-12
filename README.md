# Fișier de întrebări

Un joc de trivia **în limba română**, gândit întâi pentru telefon: 900 de întrebări verificate, 10 categorii, 3 niveluri de dificultate, runde de 10 sau 20 de întrebări.

**Conceptul de design, într-o propoziție:** *un panou de control redus la esențial — fundal aproape negru, tipografie mare și un singur gest de culoare, verde citric, care înseamnă întotdeauna „corect”.* Fără ornament, fără umbre, fără sticlă. Există și o temă luminoasă, comutabilă din `Setări`.

Site: <https://psticea.github.io/trivia/>

**Provocări.** Orice rundă poate fi trimisă ca link, în două feluri: din timpul rundei (butonul `Invită`), ca să jucați aceleași întrebări în același timp, sau de la final, împreună cu scorul obținut. Linkul reproduce exact aceeași rundă — aceleași întrebări, în aceeași ordine, cu aceeași ordine a variantelor.

**Statistici.** Recordurile se țin separat pe dificultăți și se compară procentual, ca 10 din 10 să nu fie depășit de 11 din 20.

---

## Cuprins

- [Instalare și comenzi](#instalare-și-comenzi)
- [Cum e organizat proiectul](#cum-e-organizat-proiectul)
- [Cum adaugi sau corectezi o întrebare](#cum-adaugi-sau-corectezi-o-întrebare)
- [Validarea](#validarea)
- [Regula despre dependențe](#regula-despre-dependențe)
- [Fonturi și diacritice](#fonturi-și-diacritice)
- [Deploy](#deploy)
- [Cum a fost construită baza de întrebări](#cum-a-fost-construită-baza-de-întrebări)

---

## Instalare și comenzi

Ai nevoie de Node LTS.

```bash
npm ci            # instalare reproductibilă din package-lock.json
npm run dev       # server de dezvoltare
npm run validate  # verifică baza de întrebări (vezi mai jos)
npm test          # teste pentru selecția întrebărilor și punctaj
npm run build     # typecheck + build de producție în dist/
npm run preview   # servește dist/ respectând base-ul
```

`npm run validate` și `npm test` rulează și în CI. **Dacă validarea pică, deployul nu se face** — o bază de întrebări stricată e un rezultat mai prost decât un deploy ratat.

---

## Cum e organizat proiectul

```
src/
  data/                 baza de întrebări — singura sursă de adevăr
    types.ts            contractul unei întrebări
    categories.ts       cele 10 categorii și prefixele lor de id
    questions/*.ts      câte 90 de întrebări per categorie, un fișier fiecare
  game/                 logica jocului: pură, testabilă, fără React
    select.ts           alegerea stratificată a întrebărilor unei runde
    round.ts            construirea rundei și ordinea opțiunilor
    scoring.ts          punctaj, defalcare pe categorii, statistici
    share.ts            codificarea rundei într-un link, cu sau fără scor
    rng.ts              generator determinist (runde reproductibile)
    storage.ts          acces tolerant la localStorage
  store/useGame.ts      starea aplicației (zustand)
  components/           interfața
  i18n/ro.ts            toate textele vizibile, într-un singur fișier
scripts/
  validate.ts           poarta de calitate a bazei de întrebări
  og.html               sursa imaginii de previzualizare
  icons.ts              generează apple-touch-icon.png din favicon.svg
```

Logica de joc nu importă nimic din React și poate fi testată direct.

---

## Cum adaugi sau corectezi o întrebare

Cineva **va** găsi o greșeală. Iată drumul de la greșeală la remediere.

### Corectarea unei întrebări existente

1. Caută id-ul întrebării (apare în recapitulare, la finalul rundei) în `src/data/questions/`. Prefixul spune categoria: `ist` = istorie, `geo` = geografie, `sti` = știință, `art` = artă, `muz` = muzică, `flm` = film, `spo` = sport, `teh` = tehnologie, `gas` = gastronomie, `rom` = cultură românească.
2. Corectează câmpul greșit. **Nu schimba `id`-ul.** Linkurile de provocare deja trimise îl folosesc; renumerotarea le strică pe toate, tăcut.
3. Dacă modifici răspunsul corect, actualizează și `explanation`, și pune o sursă verificabilă în `source`.
4. `npm run validate` — trebuie să iasă `✔ Validare trecută`.

### Înlocuirea unei întrebări

Păstrează id-ul și rescrie conținutul, ori scoate întrebarea și adaugă alta cu **următorul id liber** din acea categorie. Validatorul cere exact 90 de întrebări pe categorie și 30 pe fiecare dificultate, deci o ștergere trebuie compensată cu o adăugare.

### Forma unei întrebări

```ts
{
  id: 'geo-042',              // stabil, niciodată renumerotat
  category: 'geografie',
  difficulty: 'mediu',        // 'usor' | 'mediu' | 'dificil'
  scope: 'international',     // 'ro' dacă subiectul e românesc
  question: 'Ce strâmtoare desparte Europa de Africa?',
  options: ['Gibraltar', 'Bosfor', 'Messina', 'Skagerrak'],
  correctIndex: 0,
  explanation: 'Strâmtoarea Gibraltar leagă Marea Mediterană de Oceanul Atlantic...',
  source: 'Encyclopaedia Britannica, „Strait of Gibraltar”',
}
```

Reguli care se verifică automat, dar merită știute dinainte:

- exact 4 opțiuni, distincte, **un singur** răspuns apărabil;
- cele trei variante greșite trebuie să fie **plauzibile și de același fel** cu răspunsul;
- răspunsul corect nu are voie să fie sistematic cel mai lung (prag: 35%);
- fără „toate variantele”, fără întrebări negative, fără fapte care expiră („campionul actual”, „în prezent”);
- întrebarea sub 140 de caractere, opțiunile sub 60 — trebuie să încapă pe un ecran de 390 px;
- `explanation` obligatorie: dacă nu poți scrie o explicație sigură într-o frază, nu știi răspunsul destul de bine ca să pui întrebarea;
- `source` obligatorie oriunde apar cifre sau superlative.

---

## Validarea

```bash
npm run validate                      # toate cele 900
npm run validate -- --category=sport  # o singură categorie, în timpul scrierii
npm run validate -- --quiet           # doar erorile
```

Ce verifică:

| Grup | Verificări |
|---|---|
| Structură | 900 în total; 90 pe categorie; 30/30/30 pe dificultăți; id-uri unice cu prefix corect; 4 opțiuni distincte; câmpuri necompletate; întrebarea se termină cu „?”; `source` unde e obligatorie |
| Echilibru `ro` | 25–35% global; 100% la Cultură Românească, 10–35% în rest; 20–40% în fiecare tier de dificultate |
| Limbă | **zero caractere cu sedilă** în date *și* în interfață; semnalează diacriticele lipsă; semnalează întrebările peste 140 și opțiunile peste 60 de caractere |
| Conținut | cvasi-duplicate, inclusiv între categorii; tell-ul de lungime; distribuția răspunsului corect; fraze interzise; procentul de întrebări negative |
| Jucabilitate | pentru **fiecare** dificultate × **fiecare** combinație de 3 categorii × **fiecare** lungime de rundă (720 în total), confirmă că se pot extrage întrebări unice cât ține runda |

Ultima verificare e cea mai importantă: prinde greșelile de distribuție pe care nicio recitire manuală nu le-ar găsi.

---

## Regula despre dependențe

> **Tot ce rulează în browser vine de pe acest site. Zero cereri către alte servere.**

- bibliotecile se instalează din npm, `package-lock.json` e comis, bundlerul produce ieșire autonomă;
- fără `<script src="https://...">`, fără Google Fonts prin URL, fără CDN, fără importuri din URL-uri externe;
- fonturile sunt găzduite local, prin `@fontsource*`;
- **fără API de trivia**: baza de întrebări e locală, comisă și versionată;
- fără analytics, fără telemetrie, fără pixeli de urmărire.

Un CDN căzut ți-ar doborî site-ul, iar cererile către terți divulgă adresele IP ale vizitatorilor. Nu e nevoie de niciuna, când oricum rulează un bundler.

**Verificare:** deschide site-ul publicat, DevTools → Network, reîncarcă forțat și confirmă că nu există nicio cerere către alt domeniu. Apoi caută `http` în `dist/` — fiecare apariție trebuie să fie inertă (un comentariu, o licență sau un link vizibil în text).

Nu există banner de cookie-uri, pentru că nu e nimic de consimțit. Așa trebuie să rămână.

---

## Fonturi și diacritice

Româna are nevoie de **ș** și **ț cu virgulă dedesubt** (U+0219, U+021B), nu de variantele cu sedilă (U+015F, U+0163). Sedilele sunt o rămășiță Windows-1250: se afișează inconsistent, strică sortarea și căutarea, și sar în ochi oricărui cititor român. Validatorul pică buildul la orice apariție, în date sau în interfață.

Mai există o capcană, mai subtilă. Subseturile de font împart alfabetul latin, iar **româna cade fix pe linia de despărțire**:

- subsetul `latin` acoperă `U+0000–00FF` — deci **â** și **î**, dar **nu** ă, ș, ț;
- subsetul `latin-ext` acoperă `U+0100–02BA` — acolo stau **ă** (U+0103), **ș** (U+0219), **ț** (U+021B);
- Fontsource și Google Fonts livrează implicit doar `latin`.

Rezultatul, dacă nu ești atent: â și î apar în fontul ales, iar ă, ș și ț cad pe fontul de sistem — glife amestecate în același cuvânt. Suficient de discret cât să ajungă în producție, suficient de vizibil cât să pară stricat.

De aceea `src/main.tsx` importă **explicit** fișierele care conțin și blocul `@font-face` pentru `latin-ext`, iar cele trei fonturi folosite — **Bricolage Grotesque** (titluri), **Archivo** (text) și **IBM Plex Mono** (cifre și etichete) — au fost alese verificând întâi că îl oferă.

### Regenerarea imaginii de previzualizare

`public/og-image.png` se produce din `scripts/og.html`, randat la 1200×630 cu fonturile reale citite din `node_modules`. Deschide fișierul în browser, fă o captură de 1200×630 și salveaz-o peste cea existentă. Iconița se regenerează cu `npx tsx scripts/icons.ts`.

---

## Deploy

GitHub Pages, prin GitHub Actions (`.github/workflows/deploy.yml`), la fiecare push pe `main`.

1. În repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. `base` din `vite.config.ts` trebuie să fie `'/<nume-repo>/'` pentru o pagină de proiect (aici `'/trivia/'`), sau `'/'` pentru domeniu propriu. Greșești asta și fiecare fișier dă 404, în timp ce HTML-ul se încarcă — o pagină albă, fără eroare evidentă.
3. `public/.nojekyll` există, ca Pages să nu proceseze ieșirea cu Jekyll.

Pipeline-ul rulează `npm ci`, `npm run validate`, `npm test`, `npm run build` — în ordinea asta.

---

## Cum a fost construită baza de întrebări

Fiecare categorie a fost scrisă după o hartă de acoperire făcută dinainte (subdomenii, epoci, regiuni), nu întrebare cu întrebare. Verificarea s-a concentrat acolo unde e riscul: date, cifre, recorduri, superlative și atribuiri de invenție sau paternitate — toate cele 900 de întrebări au un câmp `source` completat cu o referință verificabilă.

Echilibrul dintre subiectele românești și cele internaționale e impus de validator: 28,1% din întrebări au `scope: 'ro'`, dintre care 90 vin din categoria dedicată, iar restul sunt împrăștiate uniform prin celelalte nouă. Un joc despre lume, cu accent românesc — nu un joc despre România.

Cifre din ultima rulare a validatorului:

```
900 de întrebări · 90 pe categorie · 30/30/30 pe dificultăți
28,1% subiecte românești · 900 din 900 cu sursă
răspunsul corect e cea mai lungă opțiune în 27,4% din cazuri (prag 35%)
0 întrebări negative · 0 avertismente
720 de combinații dificultate × 3 categorii × lungime de rundă, toate jucabile
```

---

## Licență

Codul și întrebările din acest repo pot fi refolosite; întrebările sunt formulări originale, scrise pornind de la surse de referință, nu copiate din alte produse de quiz.
