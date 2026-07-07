# Future Tasks — gamifikace a rozvoj aplikace

Navazuje na `gamification-design.md` (návrh) a `task.md` (hotový VPS scaffold).
Stav k 2026-07-06: MVP 1+2 hotové (timer, streak s perlami, Taktovka dne / Balance week,
truhla se samolepkami, album Zvířecí orchestr, Cellino se 3 náladami; localStorage).

## MVP 3 — Rodič jako kanál

- [ ] Rodičovské potvrzení sezení jedním tapem (anti-cheat z návrhu §4/§8).
  - Acceptance: sezení má `confirmed_by_parent`; nepotvrzená se po X dnech vizuálně odliší; učitel vidí rozdíl.
- [ ] Push/e-mail notifikace rodiči v nastavený čas („Cellino čeká na Emmu 🎻, streak: 6 perel").
  - Acceptance: max 1 denně, čas volí rodič, obsah bez citlivých dat; vyžaduje backend (viz níže).
- [ ] Týdenní rekap pro rodiče (mini „Spotify Wrapped"): graf 7 kyvadel, streak, nové samolepky.
  - Acceptance: sdílitelný obrázek/stránka; věta pro učitele; generuje se v neděli.
- [ ] Comeback balíček: po 2+ dnech pauzy „Willkommen zurück!" + 1 truhla zdarma při návratu.

## MVP 4 — Sociální vrstva a dlouhodobost

- [ ] Akvárium/Orchestr školy: každé dokončené cvičení kohokoli přidá zvířátko do společné scény.
  - Acceptance: bez jmen a minut, jen avatary; týdenní cíl třídy odemyká novou kulisu. Vyžaduje backend.
- [ ] Nedělní koncert: jednou týdně Cellino „zahraje" program z toho, co dítě ten týden cvičilo.
- [ ] Obchod s oblečky: za noty (duplicity) čepičky/šály/motýlky pro Cellina; žádné reálné peníze.
  - Assets: vygenerovat varianty Cellina s oblečky (stejný Gemini chat kvůli stylu).
- [ ] Perlový náhrdelník vizuálně: řetěz perel s milníkovými perlami 3/7/14/30/100 místo číselného badge.

## Gamifikace — dolaďovačky (kdykoli)

- [ ] Zvuky: violoncellová fanfára po cvičení, cinknutí Taktovky, akord při kompletní sadě samolepek.
- [ ] Animace truhly: otevírání jako animace (ne jen výměna obrázku); záblesk u legendární samolepky.
- [ ] Druhá a třetí sada samolepek (Lesní orchestr → Mořský orchestr…), ať album po 6 kusech nekončí.
- [ ] Kouzelná kalafuna viditelná v UI (kolik freeze zbývá) + obnova streaku „z krabičky" po 3 dnech (návrh §3).
- [ ] Německá lokalizace textů gamifikace (děti v Curychu; teď anglicky jako zbytek appky).
- [ ] Učitelský pohled: minuty/streak/Taktovky žáka v TeacherDashboardu, ať může na hodině konkrétně pochválit.
- [ ] Denní úkol generovaný z přiřazených materiálů („Übe dein Stück 3× langsam").

## Backend a nasazení (podmínka pro MVP 3/4)

- [ ] Přesun gamifikace z localStorage na server: tabulky `practice_sessions`,
      `student_gamification`, `rewards`, `school_weekly_goal` (schéma v gamification-design.md §11)
      + rozšíření `src/api.js` o server mode pro gamifikaci.
- [ ] Nasadit VPS portál podle `DEPLOYMENT.md` / `task.md` (Docker Compose, Caddy, PostgreSQL, zálohy).
- [ ] Otestovat restore záloh před zadáním reálných žáků (PRD požadavek).

## Poznámky ke generování grafiky

- Postup: Gemini web (Pro předplatné) přes CDP automatizaci — detaily v paměti projektu.
  Vždy generovat ve stejném chatu „Generování maskota dětské aplikace" kvůli konzistenci stylu.
- Gemini občas vrátí dva motivy v jednom obrázku → ořezat (System.Drawing).
- Chybějící assety: stavy Cellina s oblečky, kulisy akvária, milníkové perly, druhá sada samolepek.
