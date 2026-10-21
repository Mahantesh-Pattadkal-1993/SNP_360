# Wing 18 — context & working notes

Living notes for building/fixing anything in the Wing 18 model
(`src/components/three/Wing18Model.tsx`). Update this file whenever a new
Wing 18 detail is added, so the next person doesn't have to re-derive it.

---

## 1. Orientation — read this first, it trips everyone up

| Thing | Direction | Notes |
|---|---|---|
| Model entrance / portal | **+z** | `FRONT = DEPTH / 2 = 10` |
| Model back | **−z** | The core is recessed 3 m (`CORE_FRONT = 7`) |
| Plan **south** | **+z** | `src/data/wings.ts`: *"0 = entrance facing +z (plan south)"* |
| Plan **east** | **+x** | `src/data/wings.ts`: *"north = −z, east = +x"* |
| Wing 18 in the plan | north row of the **south** campus | East of the attached Wing 19 twin |
| Wing 19 in the plan | north row of the **south** campus | **West** of Wing 18; the pair mirrors about their party wall |

Wings 18 and 19 both have `rotation: 0`, so **both entrances face the
courtyard (plan south)** and their portals sit on the same +z face. Because
the pair is mirrored, a feature on Wing 18's **east** tower has its twin on
Wing 19's **west** tower — i.e. on the *outer* end of the pair, symmetric
about the party wall.

**Viewing-direction gotcha (this is what made the pediment fix click):**
when you look at the **back** (−z) face of the building, world **+x (east)
appears on the LEFT of the image**. So in a back-view photo, *the tower on
the left is the EAST tower*. In a front-view photo it's the opposite: east
appears on the **right**.

The back facade is rendered inside a group rotated `Math.PI` about Y with
`side` flipped, so **world-x column positions are identical on the front and
back faces** — only the viewing direction differs.

---

## 2. What the Wing 18 model actually is

A **twin tower** (not a single slab): two towers either side of a recessed
core, with the arched portal in the core.

```
        x=-20      -11   -2   0   +2   +11      +20
                    ┌────┐     │    │   ┌────┐
   west tower  ────┤    ├─────┘    └───┤    ├────  east tower
                    └────┘  core      └────┘
                    ↑                    ↑
              series 1 & 2          series 3 & 4
```

Key dimensions (`Wing18Model.tsx`):

| Constant | Value | Meaning |
|---|---|---|
| `FH` | 3.2 | floor height |
| `TOWER_W` | 18 | each tower's width |
| `CORE_W` | 4 | core slot between the towers |
| `DEPTH` | 20 | total front-to-back depth |
| `BAY_X` | 5.2 | arched window-bay column (beside the core) |
| `LOGGIA_X` | 10 | recessed balcony column |
| `JALI_X` | 12.65 | lattice grill strip |
| `OUTER_WIN_X` | 14.5 | outer white-framed mullioned window column |
| `OUTER_BAL_X` | 18 | outer projecting-balcony column (outermost) |
| `WING18_FLOORS` | 19 | floors 0 (ground) → 18 |

Facade column order, **core → outer edge** (same on both faces):
`arched bay → loggia → jali → outer window → outer balcony column`.

The outermost balcony column reads as its **own bay** — several details
(cornices, the pediment) deliberately stop short of it.

---

## 3. Data model — the source of truth

`src/data/flats.ts` holds the flat-series maps. They are the bridge between
"flat number" and "position on the building".

### Wing 18

| Series | Label | Corner | Tower | Face |
|---|---|---|---|---|
| 1 | 2481 Prime North | South-west | −1 (west) | +1 (front) |
| 2 | 2481 Select West | North-west | −1 (west) | −1 (back) |
| 3 | **2481 Grande East** | **North-east** | **+1 (east)** | **−1 (back)** |
| 4 | **2841 Elite North** | **South-east** | **+1 (east)** | **+1 (front)** |

**Both series 3 and 4 are the EAST tower.** That is the single fact that
decides where a Wing 18 architectural feature belongs.

### Wing 19 — the mirrored twin

Wing 19 is the **western** half of the attached 18/19 pair (Wing 18 is the
eastern half; `pairX(-1)` / `pairX(1)` in `wings.ts`). It is the same
twin-tower block **mirrored**, so its series sit on the opposite side:

| Series | Label | Corner | Tower | Face |
|---|---|---|---|---|
| 1 | 2481 Prime North | South-east | +1 (east) | +1 (front) |
| 2 | 2481 Select East | North-east | +1 (east) | −1 (back) |
| 3 | **2481 Select West** | **North-west** | **−1 (west)** | **−1 (back)** |
| 4 | **2481 Elite North** | **South-west** | **−1 (west)** | **+1 (front)** |

So **Wing 19's series 3 & 4 are on its WEST tower** — the *outer* end of the
pair. Wing 18's 3 & 4 are on its *east* tower, also the outer end. The two
party-wall towers (19-east / 18-west) carry series 1 & 2 and are plain.

### Two independent sources confirm the mirror

1. **The plan legend** — each wing has its own box:

   | | S1 | S2 | S3 | S4 |
   |---|---|---|---|---|
   | Wing 18 | 2481 Prime North | 2481 **Select West** | 2481 **Grande East** | 2841 Elite North |
   | Wing 19 | 2481 Prime North | 2481 **Select East** | 2481 **Select West** | 2481 Elite North |

   Series 2 and 3 swap their East/West naming between the twins ("Select
   West" ↔ "Select East"), which only makes sense if the two are mirrored.
   Wing 19's series 4 is **2481** Elite North — not 2841 — which confirms the
   2841 in the Wing 18 legend is a typo, as suspected.

2. **The red series numbers on the plan.** Cluster the red pixels, then read
   each cluster as a digit:

   | plan px | plan py | digit | block |
   |---|---|---|---|
   | 554 | 415 | **3** | Wing 19, north-west |
   | 546 | 457 | **4** | Wing 19, south-west |
   | 619 | 437 | 2 | Wing 19, north-east |
   | 607 | 480 | 1 | Wing 19, south-east |
   | 641 | 483 | 1 | Wing 18, south-west |
   | 657 | 445 | 2 | Wing 18, north-west |
   | 712 | 464 | **3** | Wing 18, north-east |
   | 699 | 504 | **4** | Wing 18, south-east |

   Wing 18's four blocks read 1=SW, 2=NW, 3=NE, 4=SE — exactly the Wing 18
   table above. Wing 19's read 3=NW, 4=SW, 2=NE, 1=SE — the mirror. ✓

`seriesFor(wingNumber)` picks the right map; `parseFlatNumber` uses it, so
every wing resolves its own flats correctly.

Flat numbering: `wing + floor + series digit`, e.g. `1801` = wing 18, ground
floor, flat 1; `18184` = floor 18, flat 4.

---

## 4. The pediment (worked example — read this before adding anything similar)

### The finding

The pediment is **not** a generic roof feature repeated on every tower.
From `wing 18 backside distant view.jpeg` (viewed from the back):

* the **east** tower carries a **wide** triangular gable, roughly **15 m**
  across, springing from a dentilled cornice;
* the **west** tower ends in a **plain flat parapet** — no gable at all.

The same wide gable caps **both** faces of the east tower: series 3 on the
back (north) face and series 4 on the front (courtyard) face — they are the
same tower, so they get the same crown. The earlier narrow gable that sat
over the arched window bay on the front face has been **removed**.

So: east tower = wide pediment on front and back; west tower = plain
parapet, no gable.

**Wing 19 gets the same treatment, mirrored.** Its series 3 & 4 are on its
west tower, so the pediment moves to the *other* tower of that wing — which
is the outer end of the 18/19 pair, giving the pair a symmetric silhouette
(pediment — plain — party wall — plain — pediment). The pediment is still
the same wide gable on both faces of that tower.

Because the two wings are mirrored, the rule below is per-wing, not global:
**look up the tower from that wing's own series map**, never from the other
wing's.

### How it was derived (the reusable method)

1. **Crop and enlarge the master plan** to read the red series numbers
   around the Wing 18 block. Red **"3"** sits on the north block of Wing 18
   and red **"4"** on the south block → both on Wing 18's east end.
2. **Confirm against `flats.ts`**: series 3 → corner North-east, series 4 →
   South-east → the east tower. (Plan and data agree; no guessing needed.)
3. **Cross-check with the photo**: in the back-view photo the gabled tower is
   on the left, and left-in-a-back-view = east. ✓
4. **Derive the geometry from the model, not the photo pixels**: the gable
   runs from the core edge to the inner edge of the outer balcony column.

Resulting constants:

```ts
const PEDIMENT_X0 = CORE_EDGE;                    // 2    — at the core slot
const PEDIMENT_X1 = OUTER_BAL_X - OUTER_BAL_W / 2; // 16.4 — stops before the balcony column
const PEDIMENT_W  = PEDIMENT_X1 - PEDIMENT_X0;    // 14.4
const PEDIMENT_CX = (PEDIMENT_X0 + PEDIMENT_X1) / 2; // 9.2
const PEDIMENT_H  = 3;                            // ≈1 floor
const PEDIMENT_DENTILS = 16;
// wing-aware: Wing 18 → east tower (+1), Wing 19 → west tower (−1)
const pedimentSide = (wingNumber: number): -1 | 1 => seriesFor(wingNumber)[3].tower;
```

`Roof` takes a `pediment: boolean` prop and renders the gable only for the
pediment tower; the other tower keeps just its parapet. The gable itself
lives in a separate `Pediment` component parameterised by `face` (+1 = front,
−1 = back), so both faces are **guaranteed to be exact mirrors** of each
other — every z-offset is `face * (FRONT - n)`.

### Rule of thumb

> A Wing 18 feature belongs to a **tower** and a **face**.
> Identify the tower/face from **that wing's** series map (`flats.ts`) —
> series 3 & 4 are the east tower on Wing 18, the west tower on Wing 19 —
> then confirm with a photo of that **face** (back-view photos are mirrored,
> see §1).

> When the same feature appears on **both** faces of a tower, model it once
> with a `face` sign rather than duplicating the geometry — mirroring by hand
> is where front/back drift creeps in.

> For the 18/19 pair, remember the wings are **mirrored**: a feature on
> Wing 18's east tower is on Wing 19's **west** tower, and the mirrored
> features land symmetrically about the party wall.

---

## 5. Reference photo inventory (`public/images/`)

| File | What it gives you |
|---|---|
| `building-entrance.jpg` | Wing 18 **entrance**: arched portal, slatted vault, rosette, glass door, lanterns, "18" plaque |
| `building-day-1.webp` | Facade rhythm front + back: arched window column, recessed loggia (staggered slabs, planters, black railings), jali strip, outer mullioned window column with flat black grill |
| `building-day-2.jpg` | Marketing shot — arch tops, pediments, balcony profile |
| `building-day-3.jpg` | **Highest-res source (6144×8160)**: pediment gables, corbel cornices, arched top recesses with rosettes |
| `building-lobby.jpg` | Lobby |
| `building-night-1.webp`, `building-night-2.jpg` | Night views / lighting |
| `entrance-plaza.webp` | Plaza approach |
| `Wing18_Side.jpeg` | The **outer** projecting-balcony column (stacked corbelled balconies) |
| `wing 18 backside distant view.jpeg` | **The pediment** — back (north) face, wide gable on the east tower, plain parapet on the west |
| `wing18-19 backside.jpeg` | Backside garden / rear approach of the 18-19 pair |
| `gate to south campus.jpeg` | South campus gate |
| `Master-Plan-Sobha-Neopolis-with-numbering.webp` | **Numbered master plan (1056×790)** — red series numbers per wing |
| `masterplan-full.webp`, `masterplan-north.png`, `masterplan-south.png` | Site plan + campus sheets |

> The comment block at the top of `Wing18Model.tsx` historically cited
> filenames that no longer exist (`building entrance.jpg`, `Buidings.webp`,
> `real building picture.jpg`). The real equivalents are
> `building-entrance.jpg`, `building-day-1.webp`, `building-day-3.jpg`.

---

## 6. Adding a new Wing 18 detail — workflow

1. **Work out where it goes.** Which tower (west/east) and which face
   (front/back)? Use the series map in §3 — don't guess from a photo alone.
2. **Find the evidence.** Back-view photos are mirrored (§1). A photo proves
   *what it looks like*; the master plan proves *where it is*.
3. **Measure rather than eyeball** (§7) and express the result in the
   model's own constants (`BAY_X`, `LOGGIA_X`, `OUTER_BAL_X`, …) so the
   feature stays tied to the facade layout instead of drifting.
4. **Respect the outer balcony column.** It reads as a separate bay; most
   horizontal features stop at `OUTER_BAL_X - OUTER_BAL_W / 2`.
5. **Keep the two faces independent — or deliberately mirrored.** The model
   renders the *facade* the same on both faces, but real features are not
   necessarily symmetric. When a feature belongs on one face only, add it
   explicitly in `Roof` rather than reusing the front treatment. When it
   belongs on **both** faces, model it once with a `face` sign (see the
   `Pediment` component) so the two can't drift apart.
6. **Verify**: `npx tsc --noEmit`, `npx next lint`, `npx next build`.

---

## 7. Measurement techniques (what actually worked)

**Zoom into a photo region** — `sharp` is already a dependency:

```js
// Prefer a script file over `node -e`, see §8
sharp('public/images/wing 18 backside distant view.jpeg')
  .extract({ left: 240, top: 190, width: 400, height: 150 })
  .resize({ width: 1600 })
  .jpeg({ quality: 95 })
  .toFile('/tmp/g_exact.jpg');
```

**Find the roofline silhouette programmatically** — much more reliable than
eyeballing a gable's extent. Scan columns top-down and take the first
non-sky pixel:

```js
const isSky = (x, y) => { const [r, g, b] = px(x, y); return b > r + 5 && b > 120; };
for (let x = 240; x <= 620; x += 10) {
  let top = null;
  for (let y = 100; y < 500; y++) if (!isSky(x, y)) { top = y; break; }
  console.log(x, top);
}
```

On the back photo this returned the gable apex at **x ≈ 450** with eaves at
**x ≈ 330** and **x ≈ 580**, and the core slot immediately after — which is
what proved the gable sits on the tower *left* of the core in the image, i.e.
the **east** tower.

**Find floor lines** by averaging luminance down a column strip and taking
local minima, to convert photo pixels → metres via the known floor height.

---

## 8. Gotchas

* **Bash history expansion breaks `node -e` scripts** containing `!`
  (e.g. `!sky` → `event not found`). Write the script to a file and run
  `node file.js` instead.
* **Long `node -e` one-liners are awkward to iterate on.** A scratch file in
  `/tmp` is faster and re-runnable.
* **`next build` / `next lint` exit non-zero** in this shell even on success
  (shell integration quirk) — read the output, don't trust the exit code.
* No headless browser is installed (no Puppeteer/Playwright/Chromium), so
  3D output can't be screenshot-verified automatically. Type-check, lint and
  build are the available gates; visual claims must be justified from the
  source photos.

---

## 9. Open items / known gaps

* **Wing 19 shares this model component** but is the **mirrored** twin of
  Wing 18. It now has its own series map (`WING19_SERIES`), resolved through
  `seriesFor(wingNumber)`, and the pediment is gated on the wing number —
  resolved, see §3.
* **`WING18_SPAN = 32` in `wings.ts` doesn't match the model's real width.**
  The model spans x = ±20 (4 m core + 2 × 18 m towers = **40 m**), but
  `wings.ts` places the twins 32 m apart via `pairX()`. The two twins
  therefore overlap in plan. Worth reconciling.
* `WING_WIDTH` / `WING_DEPTH` in `wings.ts` are placeholders (16 × 34) and
  are only used for generic-wing massing, not the Wing 18 model.
* All dimensions are **estimated from photo proportions, not architectural
  drawings** (`requirements.md` §9). No surveyed footprint/GPS data yet.
* `WING18_SERIES[4].label` is `"2841 Elite North"` while the plan legend
  prints 2841 for series 4 and 2481 for the rest — flagged in `flats.ts` as
  very likely a typo in the legend. **Confirmed:** the Wing 19 legend prints
  the same series as *2481* Elite North, so 2841 is a one-off typo.
