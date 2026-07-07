# Gamifikace pravidelného cvičení — Suzuki Cello School App

Cílová skupina: děti 6–9 let (žáci Suzukiho metody, Curych — UI texty níže v němčině, interní názvy anglicky).
Cíl: odměnit **(a) každodenní cvičení** a **(b) přibližně stejnou dobu cvičení každý den** — tedy rytmus a rovnováhu, ne maximalizaci minut.

Návrh vědomě přebírá osvědčené retenční mechaniky sociálních sítí a mobilních her (streaky, variabilní odměny, sběratelství, FOMO, denní odměny, notifikace, sociální důkaz), ale v podobě přiměřené věku 6–9 let a důvěře rodičů. U každé mechaniky je uvedeno, z čeho vychází.

---

## 1. Ústřední smyčka (core loop)

```
Otevři appku → maskot tě přivítá a připomene streak
→ stiskni PLAY na cvičebním timeru → cvič (s přiřazeným videem/nahrávkou)
→ STOP → oslava (konfety + fanfára) → otevři truhlu s odměnou (variabilní!)
→ nakrm maskota / zalij zahrádku → ukaž rodiči → zítra znovu
```

Jedno sezení = jeden „oblouk napětí". Dítě má **vždy** něco, na co se těší zítra (neuzavřená smyčka = Zeigarnik efekt, stejný trik jako „nepřečtené" badge).

## 2. Maskot: Cellino 🎻

Malé chlupaté violoncello s očima (viz `src/assets/gamification/cellino-mascot.png`).

- **Tamagotchi mechanika** (Pou, Snapchat Bitmoji): Cellino roste a mění se podle pravidelnosti cvičení. Po cvičení je šťastný, tančí, zpívá tón dne.
- **Bez trestů**: když dítě necvičí, Cellino **neumírá ani nepláče** — jen usne a je „rozespalý" (šetrná verze loss-aversion; plný trest u 6letých vyvolává úzkost a rodiče appku smažou).
- Cellino mluví krátkými bublinami („Heute üben wir zusammen, oder?") — parasociální vazba, hlavní důvod, proč se děti vracejí k Duu z Duolinga.

## 3. Streak: Perlenkette (řetěz perel) 🔗

Klasický Snapchat/Duolingo streak, vizualizovaný jako **náhrdelník perel pro Cellina** — každý den cvičení přidá perlu.

- Milníky 3 / 7 / 14 / 30 / 100 dní → speciální perla + nová čepička/šála pro Cellina (kosmetické odměny à la Fortnite skiny).
- **Streak freeze = „Kouzelná kalafuna"** (Zauberkolophonium): 1× za 14 dní se vydělá sama; nemocný den nebo výlet streak nezlomí. (Duolingo data: streak freeze retenci zvyšuje, ne snižuje.)
- Ztráta streaku: perly se nesypou, ale „schovají do krabičky" — po 3 nových dnech se řetěz obnoví tam, kde byl (odpuštění místo resetu; u dětí reset = vztek a konec).

## 4. Klíčová novinka: Metronom rovnováhy ⚖️ (odměna za stejný čas)

Tohle plní vaše zadání „odměnit přibližně stejný čas", které streak sám neumí.

- S učitelem/rodičem se nastaví **denní cíl**, např. 15 min (věkově: 6–7 let 10–15 min, 8–9 let 15–20 min).
- **Zlaté pásmo**: skončí-li dnešní cvičení v pásmu ±25 % cíle (11–19 min při cíli 15), dítě získá **Taktovku dne** (zlatý metronom se rozhoupe do rovnoměrného kyvu a cinkne).
- **Přecvičení se neodměňuje navíc**: 45 minut nedá 3× víc — dá stejnou 1 Taktovku a Cellino zívne „Genug für heute! Morgen wieder!" To je záměrná anti-binge pojistka: učí rytmus, ne maraton, a rodičům se to dá prodat jako feature.
- **Rytmus týdne**: 5+ Taktovek ze 7 dní = **Zlatý takt** → garantovaná vzácná karta (viz §5) + Cellino se naučí novou taneční figuru.
- Vizuál: týdenní pohled = 7 kyvadel metronomu; stejně dlouhé kyvy vedle sebe „ladí" a hrají akord. Dítě *vidí* rovnoměrnost.

Měření času: in-app timer (PLAY/STOP na StudentDashboardu, běží při přehrávání přiřazeného videa/audia i samostatně). Proti šizení stačí měkká pojistka: mikrofonní detekce zvuku je zbytečně invazivní; místo ní **rodičovské potvrzení** jedním tapnutím (viz §8) a učitel výsledky stejně slyší na hodině.

## 5. Truhla po cvičení: variabilní odměny + sběratelské album 🎁

Nejsilnější trik sociálních sítí = **variable reward schedule** (slot-machine, pull-to-refresh). Dětská verze: po každém dokončeném cvičení se otevře truhla:

- 70 % běžná samolepka, 25 % vzácná, 5 % legendární (animace zlatého záblesku).
- Samolepky = **Zvířecí orchestr**: sady po 6 (Smyčcová myš, Medvěd kontrabasista, Liška houslistka…). Kompletní sada → zvířata zahrají dítěti krátký koncert (odměnou je *obsah*, ne nákup!).
- Sběratelské album s prázdnými siluetami — **completionism** (Panini/Pokémon efekt): prázdné okénko nutí vracet se víc než plné.
- Duplicitní samolepky se mění na „noty" (soft-měna) → za noty si dítě kupuje oblečky pro Cellina. Dvě měny = delší ekonomika, ale **žádné reálné peníze, žádné nákupy** — jinak COPPA/rodiče/AppStore peklo.

## 6. FOMO a denní rytmus (šetrně) ⏰

- **Denní úkol** (Fortnite daily quest): „Heute: Übe dein Stück 3× langsam" — generuje se z přiřazených materiálů od učitele, takže gamifikace táhne přesně to, co učitel zadal.
- **Šťastná hodina** ne! Místo časově omezených oken (u dětí toxické — nemohou si samy řídit čas) → **Nedělní koncert**: jednou týdně, v neděli, Cellino uspořádá „koncert týdne" z toho, co dítě nacvičilo — rituál, na který se čeká (appointment mechanics à la seriál, ale kotvený na víkend s rodičem).
- **Comeback mechanika** (retention push každé sítě): po 2 dnech pauzy notifikace rodiči + při návratu „Willkommen zurück!" balíček (1 truhla zdarma) — návrat se odměňuje, nikdy nekárá.

## 7. Sociální vrstva: společně, ne proti sobě 🐠

Leaderboardy podle minut jsou pro 6–9 let škodlivé (srovnávání, šikana, demotivace slabších) — místo nich **kooperativní sociální důkaz**:

- **Akvárium školy / Orchestr školy**: každé dokončené cvičení kteréhokoli žáka přidá rybičku/zvířátko do společné scény celé školy. Dítě vidí „dnes už cvičilo 7 dětí" (social proof, jádro každého feedu) a svůj kamínek do mozaiky.
- **Týdenní cíl třídy**: „Společně 40 cvičení tento týden" → všichni odemknou novou kulisu akvária. Skupinový tlak funguje, ale pozitivně.
- Jména se nezobrazují s minutami — jen avatary Cellinů. Žádné veřejné pořadí.

## 8. Rodič jako distribuční kanál 📲

Děti 6–9 nemají vlastní telefon — **notifikace jdou rodiči** a rodič je záměrně vtažen (Suzuki filozofie: rodič = domácí učitel):

- Push v nastavený čas: „Cellino čeká na Emmu 🎻 (streak: 6 perel)".
- Po cvičení rodič jedním tapem potvrdí sezení (anti-cheat z §4) a může poslat dítěti emoji-potlesk 👏, který Cellino přehraje jako aplaus.
- **Týdenní rekap pro rodiče** (Spotify Wrapped mini): graf 7 kyvadel, streak, nové samolepky, věta pro učitele. Sdílitelný obrázek → organická propagace školy.
- Učitel v TeacherDashboardu vidí totéž → na hodině pochválí konkrétně („Vidím 6 Taktovek!") — uzavírá smyčku mezi appkou a reálnou hodinou.

## 9. Oslavy a šťáva (juice) 🎉

Duolingo/TikTok lekce: odměna musí být **okamžitá, hlasitá a barevná**.

- STOP timeru → plné-obrazovkové konfety, fanfára (nahraná na violoncello!), Cellino tančí, čísla se počítají nahoru.
- Každý milník má jinou animaci — první otázka dítěte zní „co bude při 30?" (curiosity gap).
- Zvuky odměn = skutečné violoncellové tóny/akordy → i odměnový layer trénuje ucho.

## 10. Vědomé pojistky (co ze sociálních sítí NEpřebíráme)

Tyto pojistky jsou i marketingový argument pro rodiče:

1. Žádný infinite scroll, žádný obsah mimo přiřazené materiály.
2. Žádné nákupy, žádná reklama, žádné temné vzory kolem plateb.
3. Přecvičování se neodměňuje (viz §4) — appka sama říká „dost".
4. Ztráta streaku bez krutosti (krabička perel, kalafuna).
5. Žádné veřejné žebříčky minut; jen kooperace.
6. Notifikace pouze rodiči, max 1 denně, v čase, který si rodič zvolí.
7. Minimální data o dítěti (jen křestní jméno a minuty — v souladu s PRD „Child/student data should stay minimal and private").

## 11. Datový model (rozšíření stávajícího schématu)

```sql
practice_sessions (id, student_id, started_at, duration_min, confirmed_by_parent bool)
student_gamification (student_id PK, daily_target_min int, streak_days int,
                      streak_frozen_until date, pearls int, notes_currency int)
rewards (id, student_id, type enum(sticker, pearl, baton, outfit), item_key, earned_at)
school_weekly_goal (week, target_sessions, achieved_sessions)
```

Frontend: nový komponent `PracticeTimer.jsx` na StudentDashboardu (PLAY/STOP + napojení na přehrávač — přehrávání přiřazeného média timer spouští automaticky), `CellinoWidget.jsx` (stav maskota), `RewardChest.jsx` (animace truhly), `StickerAlbum.jsx`, `BalanceWeek.jsx` (7 metronomů). Lokální režim: vše do `localStorage` přes stávající vzor v `src/api.js`.

## 12. Fáze nasazení

| Fáze | Obsah | Efekt |
|------|-------|-------|
| MVP 1 | Timer + streak (perly) + konfety + Cellino (statický, 3 nálady) | denní návyk |
| MVP 2 | Taktovka dne + Zlatý takt + truhla se samolepkami + album | stejný čas + variabilní odměny |
| MVP 3 | Rodičovské notifikace + týdenní rekap + potvrzení sezení | distribuce, anti-cheat |
| MVP 4 | Akvárium školy + Nedělní koncert + oblečky za noty | sociální vrstva, dlouhodobost |

## 13. Assety

Generované obrázky (Gemini / Nano Banana) ukládat do `src/assets/gamification/`:
- `cellino-mascot.png` — maskot Cellino
- `sticker-album-animals.png` — ukázka sady Zvířecího orchestru
- dále bude potřeba: stavy Cellina (spící, tančící), truhla, perly, metronom, kulisy akvária
