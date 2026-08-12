# Where this app stands — 12 August 2026

A handover note for whoever picks this up next, including me. It records what
was built, **why it was built that way**, and what is deliberately switched off.
Decisions are the expensive part; code can be re-read.

## The idea in one paragraph

A teacher's app and a child's app in one. The teacher keeps the students and
assigns material. Each child gets a private link to a screen with exactly two
halves: the lesson the teacher set on top, and practice below. Practising every
day earns a beautifully drawn card. Nothing else competes for attention —
*"nechci aby se děti hrabaly tisícemi tlačítek a obrazovek. teď chci aby hráli
a cvičili."*

## What the child sees

`StudentHomeView` renders the whole student screen and nothing else is reachable
from it:

1. **Today's lesson** — one full-width row per assigned item, tap to play.
2. **Cellino and the practice knob** — the brass button is the only bright thing
   on the screen; pressing it starts the timer.
3. **My week** — seven pearls, today's filling live with the minutes played.

The reward arrives on top of this as a single tappable card ("Yesterday's chest
is ready!") and opens into the earned picture.

### What is switched off, and why

`src/features.js` holds the switches. Nothing is deleted; the engine keeps the
data maintained, so flipping a flag back on loses no progress.

| Flag | State | Why |
| --- | --- | --- |
| `collectionScreen` | off | The shelf, the bands, instrument equipping and the "what you are playing for today" card. Turned off to keep the child's screen to one button. Turn on if practice stalls and the collection needs to pull. |
| `ensembleHall` | off | Chairs can only be filled by the teacher, so a child practising alone would watch a section that never moves. |

## The reward loop, and the reasoning behind it

**A card is never dealt twice.** `rollSticker` draws only from cards not yet
owned. Rarity therefore only decides the *order* cards arrive in — the legendary
one tends to come last, which is what makes it feel earned. Duplicates were
removed on request; they are also the mechanic that makes sticker albums
frustrating (the coupon-collector tail).

**A chest is earned by a day, not by a session.** `chestBlockReason` says no
unless the day reached the daily goal *and* the day before it did too. The day
after a gap rebuilds the run and pays nothing; the very first practice day ever
is not treated as a gap, so a new child is not left empty-handed. One chest per
day maximum, so restarting the timer cannot farm rewards.

**The chest is sealed on the day it is earned and opens the next day.** The
reveal — the loudest moment of the loop — therefore lands when the app is opened
in the morning, never while fingers should be on the fingerboard. The card is
drawn at opening time, so nothing is decided in advance.

**Playing from memory** earns one extra chest a day, claimed by the child on the
celebration screen. It is self-declared: the collection lives in `localStorage`,
so a teacher tapping a button on their own device would never reach the child.
Since no card is ever dealt twice, claiming it dishonestly only brings a card
forward slightly. Move this to teacher confirmation once state is server-side.

**Practising at the same hour** is recognised (`isAtUsualTime`, median start time
over 21 days) and praised, never required. Habits are built by a stable cue.

**Golden week** needs no separate bonus any more: five full pearls means five
qualifying days, which is five chests.

## Design: Club 1920

The whole app wears the style described in the `club-1920` skill, taken from the
Fortin Piccolo metronome (`~/Documents/Projects/piccolo-metronome`): dark green
salon, mahogany, brass, ivory dials, serif type. The Material-3 token names in
`index.css` were kept and only their meanings changed, so no JSX had to be
rewritten. Two classes carry the style: `club-brass` (the one action that matters
on a screen) and `club-leather` (everything else).

Two things that are easy to get wrong when editing:

- **Artwork drawn on pale paper needs a frame** on the dark ground, or it reads
  as a cut-out white square. The chests use `rounded-2xl border-outline-variant/30`.
- **Cellino is the exception**: he is cut out of his paper entirely, because a
  framed picture that bounces looks like a photo being shaken. Only the character
  hops (`gami-hop`), and only in the cheering mood.

The Born landscape backdrop was removed. The asset stays at
`src/assets/backdrop-town.webp` in case a calmer place for it turns up.

## Artwork

Everything is drawn with the `born-poster` skill (Gemini via Chrome CDP) and
converted to 512×512 webp.

- **Cellino** — three moods of one character: sleeping, waiting, cheering. Big
  eyes on purpose; large eyes relative to the face are the core of the "baby
  schema" children respond to. Two arms and two legs, stated explicitly in the
  prompt — the earlier version's f-holes read as extra limbs.
- **Chests** — closed and open, mahogany and brass with a treble clef carved in
  the front. The open one appears when the collection is complete.
- **Animals** — the six collectible cards, unchanged.

## Deployment

Oracle VPS **144.24.244.244**, `/opt/suzuki-cello-school`, Docker Compose
(Caddy + Fastify + Postgres 16). Deploy with:

```powershell
.\ops\deploy-vps.ps1 -HostName 144.24.244.244
```

The script tars the working tree (no commit needed), preserves `.env` and
backups, rebuilds the image and re-runs the idempotent migration.

Traps that have already been paid for — do not re-learn them:

- **Line endings.** `.gitattributes` pins `*.sh`, `Dockerfile`, `Caddyfile` and
  the compose files to LF. A CR at the end of `set -eu` makes dash fail with
  `set: Illegal option -` and the provisioning step dies.
- **The SSH user is `ubuntu`**, not `opc`. The script defaults to it now.
- **Port 3000 is not published on the host.** Health checks must run inside the
  container; the old `curl http://127.0.0.1:3000/...` could never succeed and
  made every successful deploy report failure.
- **Secure cookies.** `useSecureCookie()` derives the flag from
  `PUBLIC_APP_ORIGIN`, so login works over plain HTTP today and switches itself
  on when TLS arrives. `COOKIE_SECURE` overrides it.
- **`app.suzukicello.ch` is a different site** hosted elsewhere. It must not be
  pointed at this VPS. The app lives on the bare IP over HTTP.

## Open questions waiting on a decision

- **Magic rosin vs chests.** The streak necklace still bridges one missed day,
  so the pearls can show an unbroken run while the chests are paused. Unify it:
  either drop the bridge or let it count for chests too.
- **The sidebar** still offers the tuner, the metronome and "Teacher Mode" to a
  child behind the hamburger. Hide it for students with the same flag?
- **Teacher-side awarding** (`MusicianAwarder`) writes to the teacher's own
  `localStorage` and never reaches the child. It needs server-side state to mean
  anything.
- **Printing the cards.** Specs worked out but not built: 63 × 88 mm at 300 DPI
  = 744 × 1039 px, +3 mm bleed = 815 × 1110 px, nine to an A4 sheet.
- **Season two.** The collection ends at 15 cards. One set per Suzuki book is the
  natural expansion, and it means no artificial limited-time events are ever
  needed.

## Testing

```
npm run lint
npx vitest run src/gamification.test.js          # 60
npx vitest run src/backupValidation.test.js src/mediaConfig.test.js   # 15
npm run build
```

Run the test files separately. A combined `vitest run` intermittently fails to
spawn workers on this machine — it is a memory problem on the host, not a broken
test.
