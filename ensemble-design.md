# Souborový žebřík (Ensemble Ladder) — návrh rozšíření gamifikace

Navazuje na `gamification-design.md` a na existující kód v `src/gamification.js`
(`MUSICIANS`, `BANDS`, truhla, notičky, Taktovky). Stávající 4 kapely s oscilátorovými
motivy (`BandWorkshop.jsx`) tento systém **nahrazuje a pohlcuje**: 6 stávajících zvířat
zůstává, kapely se mění na „soubory" se skutečnými nahrávkami.

Cílová skupina a jazyk UI: stejné jako dosud (děti 6–9, texty německy, interní názvy anglicky).

---

## 1. Koncept ve třech větách

Dítě sbírá zvířecí muzikanty a skládá z nich soubory: **duo → trio → … → nonet →
komorní orchestr → symfonický orchestr**, plus žánrové odbočky (tango, fiddle).
Každé zvíře nese **skutečný nahraný part (stem)** — zkompletovaný soubor hraje
opravdovou skladbu ze Suzuki repertoáru, ne pípání oscilátoru. V každém souboru
je **jedna židle prázdná — ta dětská**: soubor „vystoupí" naplno teprve, když s ním
dítě svůj part zahraje živě (play-along).

## 2. Žebřík: soubory, skladby, sály

Skladby jsou z public domain Suzuki repertoáru ve vlastních aranžích → žádné licenční
problémy. Všechny party lze nahrát na violoncello v různých polohách (multitrack, styl
„12 cellistů Berlínské filharmonie") — jedna osoba, jeden nástroj, autentické pro
violoncellovou školu. Fikce „každé zvíře má svůj nástroj" zůstává ve vizuálu karet.

| Tier | Soubor | Hráčů | Skladba (kniha) | Sál (kulisa) |
|------|--------|-------|-----------------|--------------|
| 1 | **Twinkle Duo** | 2 | Twinkle Variations (1) | Obývák |
| 2 | Lightly Trio | 3 | Lightly Row (1) | Zahrada |
| 3 | May Quartet | 4 | May Song (1) | Třída |
| 4 | Allegro Quintet | 5 | Allegro (1) | Školní sál |
| 5 | Farmer Sextet | 6 | The Happy Farmer (1) | Náměstí |
| 6 | Minuet Septet | 7 | Minuet No. 2 (1) | Kavárna |
| 7 | Hunters' Octet | 8 | Hunters' Chorus (2) | Lesní paseka |
| 8 | Maccabeus Nonet | 9 | Judas Maccabaeus (2) | Kostel |
| 9 | Komorní orchestr | 13 | Bourrée (3) | Tonhalle foyer |
| 10 | Symfonický orchestr | 24 | Óda na radost | Velký sál |

Žánrové odbočky (mimo hlavní linii, sezónní/sběratelské speciality):

- **Tango Quinteto** (vlastní tango à la milonga, 5 hráčů) — odemyká se po tieru 4.
- **Fiddle Band** (lidová/irská, 4 hráči) — po tieru 3.
- **Vánoční soubor** (koleda, prosinec) — sezónní edice.

Tier N vyžaduje zkompletovaný tier N−1 → obtížnost roste přirozeně se Suzuki knihami.
Do orchestru (tier 9–10) přispívají i **sekce**: 24 zvířat nesbírá jedno dítě samo —
viz §7 třídní quest.

## 3. Získávání zvířat (bez grindu, s váhou)

Muzikanti se **nedají vyhrát z truhly** (truhla dál dává jen samolepky — beze změny).
Zdroje, v pořadí důležitosti:

1. **Učitel na hodině** — za milník (dohraná skladba, checkpoint) udělí zvíře
   v TeacherDashboardu, nebo předá **fyzickou kartu s QR** (§8). Sbírka má váhu
   odměny z ruky učitele a nedá se „vycvičit" doma.
2. **Zlatý takt** (existující mechanika, 5+ Taktovek/týden) — místo dnešní garantované
   vzácné karty dává **volitelně** dalšího muzikanta do aktuálně stavěného souboru
   (max 1/týden → rytmus cvičení plní soubor).
3. **Premiéra** souboru odemkne prvního muzikanta dalšího tieru (most mezi tiery).
4. **Zlatá karta za vystoupení** (recitál/besídka) — speciální foil verze zvířete.

## 4. Zkoušky a premiéra (streak převlečený do fikce)

- Zkompletovaný soubor hned nekoncertuje: potřebuje **N zkoušek** (`rehearsalsNeeded`,
  tier 1 = 3, dále +1 za tier, strop 7). 1 zkouška = 1 den, kdy dítě odcvičilo
  aspoň své minimum (napojeno na existující `finishSession`).
- Po N zkouškách **Premiéra**: plnoobrazovkový koncert v kulise sálu, všechny stemy
  dohromady, konfety, fanfára, aplaus (existující juice vzory z `RewardModal`).
- Po premiéře zůstává soubor v síni slávy a lze ho kdykoli „přehrát znovu".

## 5. Koncertní mód a prázdná židle (jádro hodnoty)

Obrazovka souboru = pódium se zvířaty na židlích + **mixážní pult**:

- Každá židle má tlačítka **mute/solo** → dítě si poslechne libovolný hlas zvlášť
  nebo proti ostatním. (Pedagogicky: poslech druhého hlasu je přesně to, co při
  cvičení souhry potřebuje.)
- **Prázdná židle** (zvýrazněná, pulsuje) = dětský part. Režimy:
  - **Poslech s předehrávkou**: dětský part hraje „duch" (nahraný stem) — dítě slyší, jak má znít.
  - **Play-along**: odpočítání (existující metronom klik z `TunerMetronome`) + všechny
    stemy KROMĚ dětského partu; volitelně zpomalení 0.7–1.0× (time-stretch, viz §9).
  - Play-along běží jako cvičební sezení → počítá se do timeru, Taktovek i zkoušek.
- Noty dětského partu: PDF přes existující `MediaOverlay` (kategorie book), odkaz z židle.

## 6. Roster zvířat

Stávajících 6 (`MUSICIANS` v `src/gamification.js`) se zachová a rozšíří na ~15 pro
tiery 1–8 + žánrové kapely; orchestr (tier 9–10) doplní **sekce bezejmenných hráčů**
vedené pojmenovanými zvířaty (nesbírá se 24 unikátů). Rarita = exotičnost zvířete:
common (myš, králík, ježek…), rare (medvěd, sova, vydra…), legendary (Felix the
Cello Fox — duo partner v tieru 1, výjimka: legendárka hned na startu, protože
první parťák dítěte má být nejcennější).

Assety: art zvířat stejnou pipeline jako dosud (Gemini/Nano Banana →
`src/assets/gamification/musicians/*.webp`), jednotný styl s Cellinem.

## 7. Sociální vrstva

- **Třídní quest — orchestr**: komorní a symfonický orchestr se plní zvířaty **všech
  dětí školy** (každé dítě „posílá" své zvíře do společného orchestru, o zvíře nepřijde).
  Orchestr „vystoupí" na obrazovce při reálné besídce. Nahrazuje/rozšiřuje „Akvárium
  školy" z `gamification-design.md` §7 — stejná kooperativní mechanika, hudebnější fikce.
- Výměny duplikátů fyzických karet mezi dětmi — mimo appku, záměrně (důvod bavit se o hudbě).

## 8. Fyzické karty a QR

- Formát 63×88 mm (standardní sleeve). Líc: art zvířete, jméno, nástroj, rarita.
  Rub: QR + krátký kód.
- **QR vede na veřejnou přehrávací stránku** `/card/<musicianKey>` — bez přihlášení,
  art + jeho stem v jednoduchém přehrávači. Funguje komukoli (marketing školy).
- **Claim do sbírky**: v serverovém režimu tabulka `card_claims` s jednorázovými kódy
  (učitel tiskne dávky z TeacherDashboardu); v lokálním režimu MVP stačí, že kartu
  fyzicky předal učitel a zvíře zároveň udělil v appce — QR na kartě je pak jen
  přehrávač, žádná claim infrastruktura.
- **Luxusní 3D tisk — pódium**: základna s očíslovanými sloty na karty/figurky pro
  aktuální tier; rozestavěný kvartet na poličce = viditelný stav hry bez obrazovky.
  QR na podstavci. (Samostatný projekt, až po ověření digitální smyčky.)

## 9. Technika zvuku (stems)

- **Formát**: OPUS/AAC mono, ~96 kbps, délka 30–90 s (jedna reprízovaná fráze stačí,
  nemusí to být celá skladba). Duo = 2 soubory, orchestr = ~8 sekčních stemů.
- **Sync**: `fetch` → `decodeAudioData` → `AudioBufferSourceNode` na společný
  `AudioContext.currentTime + offset`, jeden `GainNode` na židli (mute/solo).
  Sample-accurate, žádná knihovna. Nový modul `src/audio/stemPlayer.js`.
  (Ne `<audio>` elementy — nedrží sync.)
- **Zpomalení pro play-along**: `playbackRate` na buffer source mění výšku → pro MVP
  místo time-stretche **nahrát každý stem ve 2 tempech** (cvičné/koncertní). Prostší a zní líp.
- **Uložení**: rozšířit `src/mediaManifest.json` o sekci `stems/…`, soubory do
  `src/stems/<ensembleKey>/<part>.<tempo>.opus` — funguje v obou režimech
  (local Vite / R2 přes `mapToR2()` v `src/mediaConfig.js`), nic nového v infrastruktuře.
- **Nahrávání**: Vladimír, multitrack cello, klik z metronomu; na tier 1–3 stačí
  jedno odpoledne (Twinkle duo = 4 soubory: 2 party × 2 tempa).

## 10. Datový model

### Frontend (`src/gamification.js` — rozšíření, lokální režim)

```js
export const ENSEMBLES = [
  {
    key: "twinkle-duo",
    tier: 1,
    name: "Twinkle Duo",
    piece: { title: "Twinkle Variations", book: 1 },
    venue: "living-room",
    rehearsalsNeeded: 3,
    tempos: { practice: 0.75, concert: 1.0 },
    chairs: [
      // dítě hraje melodii (svou suzuki skladbu), zvíře doprovod
      { part: "cello1", label: "Melody", playerChair: true, stem: "twinkle-duo/cello1" },
      { part: "cello2", label: "Second cello", musician: "fox-cello", stem: "twinkle-duo/cello2" }
    ]
  },
  // … tiery 2–10 + žánrové: unlockAfter: "allegro-quintet", seasonal: "12" …
];
```

Stav v `gamify_<studentId>` (nové klíče vedle stávajících):

```js
{
  musicians: { "fox-cello": { ownedAt, source: "teacher" } },   // vlastněná zvířata
  ensembles: { "twinkle-duo": { rehearsals: ["2026-07-12"], premieredAt: null } }
}
```

Nové funkce: `awardMusician(studentId, key, source)`, `logRehearsal(studentId, ensembleKey)`
(volá se z `finishSession`), `canPremiere`, `premiere(studentId, ensembleKey)`,
`getLadderState(studentId)`.

### Server (fáze 4, `server/migrations/002_ensembles.sql`)

```sql
musician_awards (id, student_id, musician_key, source, awarded_by, awarded_at);
ensemble_progress (student_id, ensemble_key, rehearsals int, premiered_at, PRIMARY KEY(student_id, ensemble_key));
card_claims (code PK, musician_key, batch, claimed_by_student, claimed_at);
school_orchestra (id, season, contributions jsonb);  -- třídní quest
```

## 11. Obrazovky a komponenty

| Co | Kde | Obsah |
|----|-----|-------|
| **Síň souborů** (ladder) | nový panel na `StudentDashboard` + route `/student/:id/ensembles` | vertikální žebřík sálů; každý soubor = pódium se siluetami (Panini efekt prázdných míst), vyplněné vlastněnými zvířaty; zamčené tiery šedě |
| **Koncertní mód** | `EnsembleStage.jsx` (fullscreen à la `MediaOverlay`) | pódium, mixér mute/solo, prázdná židle, tlačítka Anhören / Mitspielen / Probe, po N zkouškách Premiere |
| **Karta muzikanta** | `MusicianCardModal.jsx` | art, jméno, nástroj, rarita, přehrání jeho stemu, „ukázat QR" |
| **Veřejný přehrávač karty** | route `/card/:musicianKey` (bez auth, mimo `RequireTeacher`) | art + stem + logo školy |
| **Udělení zvířete** | rozšíření `TeacherDashboard` | výběr žáka → výběr muzikanta → důvod; v serverovém režimu i tisk claim kódů |

Nahrazuje se: `BandWorkshop.jsx` (oscilátorové kapely) → migrace: vlastněná zvířata
zůstávají, staré `BANDS` se přemapují na tiery 1, 2, 3 a 5.

Design: stávající tokeny (`--color-rosin` pro audio prvky, Fraunces na názvy souborů),
karty stejný vzor rounded-3xl + barevný levý okraj jako assignment karty.

## 12. Pojistky (doplněk k §10 stávajícího dokumentu)

- Žádný gacha prvek u muzikantů — zvířata jen za milníky/od učitele, truhla zůstává jen na samolepky.
- Play-along se počítá jako cvičení, ale premiéru nelze „prokoukat" — zkoušky vyžadují odcvičené dny, ne přehrané minuty.
- Veřejná stránka karty nenese žádná data dítěte (jen zvíře a stem).

## 13. Fáze nasazení

| Fáze | Obsah | Ověřuje |
|------|-------|---------|
| **E1 — Duo MVP** | `ENSEMBLES` (jen tier 1), stemPlayer, EnsembleStage s mixérem + play-along, awardMusician lokálně, zkoušky+premiéra; nahrát 4 stemy Twinkle | celou smyčku sbírání→poslech→hraní na 1 souboru |
| E2 — Žebřík | tiery 2–5, Síň souborů, migrace BandWorkshop, Zlatý takt → muzikant | progrese, retence |
| E3 — Karty | `/card/:key` veřejná stránka, tisk QR karet (PDF šablona), zlaté karty za recitál | fyzická vrstva, marketing |
| E4 — Server + třída | migrace 002, claim kódy, TeacherDashboard tisk, třídní orchestr | multi-device, sociální vrstva |
| E5 — Luxus | 3D tisk pódia, žánrové kapely, sezónní edice | dlouhodobost |

## 14. Otevřené otázky

1. Duo: dítě + 1 zvíře (prázdná židle od tieru 1), nebo 2 zvířata a prázdná židle až od tria? → návrh: **prázdná židle hned od dua**, je to jádro hodnoty.
2. Německé názvy souborů (Twinkle-Duo, Zwitscher-Trio…?) — dořešit s texty UI.
3. Tango/fiddle: vlastní kompozice (Vladimír) vs. aranže public domain (La Cumparsita je PD).
