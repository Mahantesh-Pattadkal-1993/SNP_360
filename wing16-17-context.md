# Wings 16 & 17 — context & working notes

Living notes for the Wing 16 / Wing 17 pair in the South Campus. These two
wings are **attached twins that are mirror images of each other**, and unlike
Wings 18/19 they are **not** modelled by `Wing18Model` today — they fall back
to the generic `Building` block.

Update this file whenever something is derived about the pair, so the next
person doesn't have to re-derive it.

Related: [`wing-18-context.md`](./wing-18-context.md) (the 18/19 pair, same
campus, opposite side of the central courtyard).

---

## 1. Orientation — read this first, it trips everyone up

| Thing | Direction | Notes |
|---|---|---|
| Plan **north** | **−z** | `src/data/wings.ts`: *"north = −z, east = +x"* |
| Plan **east** | **+x** | |
| Wing 16 in the plan | **west** half of the pair | `pairX(-1)` → x = −40 |
| Wing 17 in the plan | **east** half of the pair | `pairX(1)` → x = −8 |
| Shared party wall | x = **−24** | the mirror axis |
| Wing 16/17 row | **south** row of the South Campus | z = 174 |
| Wing 18/19 row | **north** row of the South Campus | z = 108 |
| Rows face each other | 16/17 face **north** (the courtyard) | `rotation: Math.PI` on both |

**The whole South Campus is drawn on the master plan at roughly 20° to the
image axes.** That is why the 16/17 mass looks "diagonal" in the plan images
but the 3D scene is axis-aligned. Do not read a plan screenshot's pixel
directions as compass directions — see §7 for how to convert.

**Wing numbering runs backwards between the two rows**, which is the single
easiest thing to get wrong:

```
                    north  (z = 108)
   WING-19  [W]  |  party wall  |  [E]  WING-18
                    ── central courtyard ──
   WING-16  [W]  |  party wall  |  [E]  WING-17
                    south  (z = 174)
```

So **19 is west and 18 is east** on the north row, but **16 is west and 17 is
east** on the south row. The pair order is `19,18` going west→east on the
north row, and `16,17` going west→east on the south row — the *opposite*
sweep direction. `pairX(-1)` is used for both 19 and 16, and `pairX(1)` for
both 18 and 17, which is exactly right because the two rows are also
mirror images of each other across the courtyard.

---

## 2. The mirror relationship — verified, not assumed

The 16/17 pair is a **pure reflection about the north–south party wall**
(x = −24). Measured from the red series digits on
`Master-Plan-Sobha-Neopolis-with-numbering.webp`:

| Check | Result |
|---|---|
| Reflection fit, series *N* ↔ series *N* | **RMS 2.69 px** |
| Same fit with mis-paired series numbers | RMS 35.69 px |
| Best *rotation* (i.e. no mirror) of the same pairs | RMS 118.60 px |
| Mirror axis vs. plan-north | 4.6° — the axis runs **N–S** |
| Axis offset from the mass midline | 0.0 px — the axis **is** the party wall |

The 2.69 px residual is at the limit of what the plan image resolution
supports, so the fit is exact for practical purposes. The two controls
prove the fit is meaningful rather than a lucky coincidence.

**The mirror maps each series onto the *same series number*, not onto a
different one.** This is the opposite of the product-level pairing — pairing
by carpet area instead (series 3↔6) gives RMS 55.21 px, i.e. wrong. The
carpet areas 1915/1611/1613 are therefore *not* a reliable cross-check for
which flat is which; only the series digit is.

### 2.1 Where each series sits

Positions are the digit centroids projected into plan space (north/east),
relative to each wing's own digit centroid:

| Series | Wing 16 position | Wing 17 position | Mirror check |
|---|---|---|---|
| 1 | north-east | north-west | ✓ NE ↔ NW |
| 2 | north-west | north-east | ✓ NW ↔ NE |
| 3 | west | east | ✓ W ↔ E |
| 4 | south-west | south-east | ✓ SW ↔ SE |
| 5 | south-east | south-west | ✓ SE ↔ SW |
| 6 | east | west | ✓ E ↔ W |

Series **6** is the one that sits *against the party wall* in both wings
(W16 series 6 is on its east edge, W17 series 6 is on its west edge) — the
two series-6 blocks are the pair's innermost flats, back to back across the
wall. Series **3** is the outermost block in both wings.

---

## 3. Data model — the source of truth

### 3.1 Series maps — **these do not exist yet**

This is the biggest gap. `src/data/flats.ts` has:

- `Series = 1 | 2 | 3 | 4` — a **four**-series type
- `WING18_SERIES` / `WING19_SERIES` — four series each
- `seriesFor(wingNumber)` → `WING19_SERIES` for 19, else `WING18_SERIES`

**Wings 16 and 17 have SIX series each, not four.** Their legends in
`Master-Plan-Sobha-Neopolis-with-numbering.webp` read:

| Series | Wing 16 legend | Wing 17 legend |
|---|---|---|
| 1 | 1915 West Facing Prime | 1915 East Facing Elite |
| 2 | 1915 East Facing Grande | 1915 West Facing Prime |
| 3 | 1611 East Facing Prime | 1613 West Facing Prime |
| 4 | 1915 North Facing Prime | 1915 North Facing Prime |
| 5 | 1915 North Facing Prime | 1915 North Facing Prime |
| 6 | 1613 West Facing Select | 1611 East Facing Select |

Read the *facing* word as **the direction the flat's main door faces**, not
as the flat's position in the block — the two are independent, and the
facing is what makes the pair read as mirrored. Note that the **West/East
facing flips between the twins for series 1, 2, 3 and 6** (e.g. series 1 is
"West Facing" in 16 and "East Facing" in 17), which is exactly the mirror
signature. Series 4 and 5 are "North Facing" in *both* wings — correct,
because a north-facing flat on the south side of the block is unaffected by
reflection about a north–south axis.

Carpet areas: **1915** sq ft (series 1, 2, 4, 5), **1611** sq ft and
**1613** sq ft (series 3 and 6 — one of each per wing, in opposite order).

**Tiers**: Prime, Grande, Elite, Select.

### 3.2 A trap to avoid: `seriesFor()` will silently return the wrong map

`seriesFor(16)` and `seriesFor(17)` currently return `WING18_SERIES` — four
series with Wing-18 labels, for wings that have six series with completely
different labels. Anything that calls `parseFlatNumber` / `seriesFor` for
these wings is currently **wrong**, not merely incomplete. If 16/17 flat
lookup is ever wired up, `seriesFor()` must gain a branch for them (and a
`Series` type that admits 5 and 6).

### 3.3 Carrying the 18/19 pattern across

The 18/19 twins are modelled by one shared `Wing18Model` component, and
`WING19_SERIES` is derived from `WING18_SERIES` by flipping the corner and
swapping the tower/face. The 16/17 pair needs the **same treatment**:

- one shared model component for the pair,
- a `WING16_SERIES` map,
- a `WING17_SERIES` map derived from it by mirroring (corners flipped
  E↔W, north/south kept), with the facing word flipped to match the legend.

Do **not** mirror by swapping series 1↔2, 3↔6 — that is the product-level
pairing, and §2 shows it is geometrically wrong (RMS 55 px). The series
*number* is preserved across the mirror; only the *position* and the
*facing word* change.

---

## 4. What the 3D scene does with 16/17 today

`src/components/three/Building.tsx` handles the pair with a scale hack:

```ts
// Wings in an attached pair (16/17) share the Wing-18 twin-tower footprint: 32 m wide, 20 m deep.
const paired = wing.number === 16 || wing.number === 17;
...
scale={paired ? [32 / WING_WIDTH, 1, 20 / WING_DEPTH] : 1}
```

So both 16 and 17 are the **generic twin-tower block** (the same component
used for wings 01–15), non-uniformly scaled from 16×34 m to 32×20 m. They
are *not* mirrored versions of each other — the generic block is
left-right symmetric apart from its entrance, so it happens to look
plausible, but it is not the Wing-18 model and it is not a true reflection.

Consequences to be aware of when working on the pair:

- The generic block's entrance sits on its **+z** face. With
  `rotation: Math.PI` (set on both 16 and 17 in `wings.ts`) that becomes
  **−z**, i.e. the flat's entrance faces **north**, toward the central
  courtyard — correct, and matching the 18/19 row, which faces the same
  courtyard from the other side. This is the visual confirmation that the
  two rows are back-to-back around the courtyard.
- `WING18_SPAN = 32` in `wings.ts` is reused to place the 16/17 pair 32 m
  apart. As noted in `wing-18-context.md` §10, the *actual* Wing-18 model
  spans x = ±20 (40 m), so the 18/19 twins overlap in plan. The 16/17 pair
  does **not** have that problem — the generic block really is 32 m wide
  after the scale, so the party wall lands exactly on x = −24.
- 16/17 use the default `FLOORS = 20` placeholder, whereas 18/19 use
  `WING18_FLOORS = 19`. Both are placeholders, not confirmed specs.

### 4.1 A defect: the side balconies land inside the twin wing

The generic block's `Balcony` places a side balcony at `faceDepth =
WING_WIDTH / 2 = 8` **measured from its bay's origin**, not from the block
centre:

```ts
const faceDepth = face === "front" ? WING_DEPTH / 2 : WING_WIDTH / 2;
```

The bays sit at local x = ±4.75, so a side balcony lands at local
±(4.75 + 8) = ±12.75, while the mass only reaches ±8 — the balcony floats
**4.75 m clear of the facade** on every generic wing. (The front balcony is
correct: `WING_DEPTH / 2` from the block centre *is* the front face.)

For 16/17 the x-scale is 2×, so that overshoot doubles to **9.5 m**, and the
inner balconies cross the party wall:

| | balcony plane (world x) | lands |
|---|---|---|
| Wing-16 right (party-wall side) | −14.5 | inside Wing-17's mass (−24…8) |
| Wing-17 left (party-wall side) | −33.5 | inside Wing-16's mass (−56…−24) |

The outer balconies are fine. This is a pre-existing quirk of the generic
block (it affects all generic wings), but the 2× scale is what pushes it
into the neighbour for this pair. Worth eyeballing in the browser; the
arithmetic above is from the component transform, not a screenshot.

---

## 5. Reference images

| Image | What it gives |
|---|---|
| `public/images/masterplan-south.png` | South Campus detail sheet. **Wing 16 and 17 masses at ~(330–630, 590–770) px.** 817×922, and it is a *different scale* from the full-site plan — see §7. |
| `public/images/Master-Plan-Sobha-Neopolis-with-numbering.webp` | The only source of the **red series digits** and the **per-wing legends**. 1056×790. |
| `public/images/masterplan-full.webp` | Full-site plan; the image `p()` in `wings.ts` maps from. 1100×815. |

**Photographs of Wing 17 now exist** (added Oct 2026) and supersede the
earlier "extrapolate from Wing 18" assumption for the 16/17 pair:

| Image | View | Use |
|---|---|---|
| `public/images/Wing-17.png` | Front (north / courtyard) + back (south), annotated with the series split | Facade module, gable, arches, balcony rhythm, floor count |
| `public/images/Wing-17-top.png` | Close-up of the module tops from the courtyard | Pediment + dentil detail, arch storey, roof railing |
| `public/images/wing-17-series6.png` | Ground-level construction photo of the **series-6** block | The series-6 bay is **set back** from the series 1/2 line; its own narrow facade |
| `public/images/building-entrance.jpg` | Entrance portal (shared with Wing 18) | Arched portal reused by the pair |

There is still **no photo of Wing 16 itself** — it is the mirror of Wing 17
(§2), so its facade is derived by reflection, which is evidence-backed now
that the reflection itself is proven to 2.7 px RMS. There is also no night
photo and no photo of the pair's ground floor / entrance on the south row.

---

## 6. Method — how the mirror was proven

The red series digits are the ground truth. To find them, isolate
saturated-red pixels in the numbered plan (the digits are the only red in
that area besides the legend frames), connected-component them, and read
each blob as a digit.

```js
const isRed = (i) => data[i] > 120 && data[i+1] < 110 && data[i+2] < 110 &&
                    (data[i] - Math.max(data[i+1], data[i+2])) > 45;
```

Then fit a reflection: for a candidate axis angle, solve the line offset by
least squares from the six point pairs, then measure the residual. Sweep the
angle and keep the best. **Always run the two controls** (mis-paired series
numbers, and a rotation instead of a reflection) — without them a 2.7 px
RMS is not obviously meaningful, and a rotation fit is the specific
alternative most likely to be confused with a reflection.

To convert digit positions to plan-space corners, the plan's north
direction is the vector from the 16/17 mass centroid to the 18/19 mass
centroid (the rows are stacked north–south), and east is that vector
rotated 90° clockwise in image space. This was cross-checked by measuring
the same vector in both plan images: 283.9° in `masterplan-full.webp` vs
283.7° in the numbered plan — **same orientation, different scale**.

---

## 7. Gotchas

* **The two plan images have different scales.** The numbered plan and
  `masterplan-south.png` are separate renderings at different scales and
  rotations; the same badge sits at completely different pixel coordinates
  in each. **Never mix pixel coordinates between them** — this is the same
  trap called out in `wing-18-context.md` §6. The full-site plan
  (`masterplan-full.webp`) is the one `p()` in `wings.ts` maps from.
* **The amenity badge numbers do not agree between the South Campus sheet
  and the full-site plan** (the courtyard between the two rows is badge 06
  on `masterplan-south.png` but badge 19 — Celebration Lawn — at the
  equivalent spot in `masterplan-full.webp`, where `CampusScene.tsx` places
  it via `p(295, 670)`). The badge grids are also different in size. Cite a
  badge number only together with the image it came from.
* **The South Campus is drawn at ~20° to the image axes.** A digit that
  looks "top-left" in a screenshot is not necessarily north-west in plan
  space. Project through the plan rotation (§6) before naming a corner.
* **`seriesFor()` returns the wrong map for 16 and 17** (§3.2). No code
  path currently calls it for them, but that is luck, not design.
* **`Series` is typed as `1|2|3|4`** — 16/17 need six.
* **The "facing" word in the legend is the main-door direction**, not the
  flat's position. They are related (the facing flips across the mirror)
  but they are not the same thing, and the position must be read off the
  plan digits, not the legend.
* **Bash history expansion breaks `node -e` scripts** containing `!`.
  Write the script to a file and run `node file.js` instead.
* **`next build` / `next lint` exit non-zero** in this shell even on
  success (shell integration quirk) — read the output, don't trust the exit
  code.
* No headless browser is installed (no Puppeteer/Playwright/Chromium), so
  3D output can't be screenshot-verified automatically. Type-check, lint and
  build are the available gates; visual claims must be justified from the
  source images.

---

## 8. Open items / known gaps

* **No `WING16_SERIES` / `WING17_SERIES` exist**, and `Series` doesn't
  admit 5 or 6. The legend text in §3.1 is transcribed from the numbered
  plan and should be moved into `flats.ts` as the first step.
* **16/17 are now modelled by `Wing17Model.tsx`** (both wings use the same
  component; the pair is mirrored by `rotation: Math.PI` plus the shared
  party wall), wired into `CampusScene.tsx` and `WingViewer.tsx`. The
  component still needs the corrections listed in §9.9 — most importantly
  **two arched bays per tower face**, the **series-6 setback**, and the
  **5-floor cornice rhythm**. Wing 16 is not a *separate* mirrored build:
  it reuses the same geometry, which is correct for a pure reflection.
* **The floor counts for 16/17 are the 20-floor placeholder**, not a
  confirmed spec. 18/19 use 19. Neither is surveyed. The photos show ~17
  floors above the frame's bottom cut, which is consistent with G+19.
* **The twin-tower footprint of 16/17 is assumed, not measured.** The
  numbered plan shows a **stepped (zigzag) outline**, not a clean 40×20 m
  rectangle, and the pair's shared span (32 m in `wings.ts`) still does not
  match `Wing17Model`'s 40 m model width. See §9.7.
* **The generic block's side balconies overshoot the facade and, for 16/17,
  land inside the twin wing** (§4.1). This is a live rendering defect of
  `Building.tsx`; it no longer applies to 16/17 because they use
  `Wing17Model`, but the generic block still has it for wings 01–15.

---

## 9. Wing 17 building structure — derived from the photos

This section is the **authoritative description of the built form**. §9.1–§9.8
are the evidence and the conclusions; §9.9–§9.10 are the delta against
`Wing17Model.tsx` today; §9.11 is the materials palette. The step-by-step
build plan lives in [`wing16-17-plan.md`](./wing16-17-plan.md).

### 9.0 How the dimensions were derived (and how much to trust them)

There are no architectural drawings, so every number below is a
**photo/plan proportion** scaled by one assumed dimension. The chain is:

1. A floor-to-floor height of **3.2 m** is assumed (matches the 18/19 model
   and is the only surveyed-ish input).
2. In `Wing-17.png`, the near-tower balcony/slab rhythm measures a
   **31 px period** (dark-band minima at 15–16 px alternate, so the true
   period is 2×15.5 px). 31 px ÷ 3.2 m → **≈9.7 px/m** at that tower.
3. The near **module's** pediment measures **≈104 px ≈ 10.7 m** wide at that
   scale. The module is fixed at **10.0 m** so that three modules + two
   1.5 m recesses + the 4.0 m series-6 connector + the 3.0 m series-3 end
   block fill the **40.0 m** wing exactly.
4. Each module carries **two arch bays of 4.35 m** plus a **1.3 m** corner
   pier (1.3 + 2 × 4.35 = 10.0 m).
5. The pediment spans the two bays + 0.2 m overhang each side = **9.1 m**;
   its rise measures **33 px ≈ 3.4 m**, rounded to **3.0 m**.
6. Recesses between modules are **1.5 m** wide and **2.4 m** deep — the dark
   vertical seams in the photos. They are not glazed.
7. **Three modules per face**, each with its own pediment. Series 3 (east
   end block) and series 6 (west connector) are flat-roofed and carry **no
   pediment**.
8. Floor bands visible above the bottom crop: **17**. The frame cuts the
   base, so the building is read as **20 storeys (G+19)**, same order as
   the rest of the campus.

**Confidence:** ±10 % on plan dimensions, ±0.3 m on heights, exact on the
facade *sequence* and on everything in §9.4–§9.6. Treat any number here as
"right to within a window bay", not surveyed.

### 9.1 Photo sources
| Photo file | View | What it proves |
|---|---|---|
| `Wing-17.png` | Front (north / courtyard) panel shot from the top of the **Wing-18 entrance**, plus the back (south) panel — both annotated with the series split | **Three pedimented modules per face**, each over **two arched bays**; 5-floor cornice rhythm; balcony/screen/window rhythm; ~17 visible floors. |
| `Wing-17-top.png` | Module tops, from the courtyard | Pediment = triangular gable with a **dentilled horizontal cornice** and **raking modillions**; the arch storey is taller than a normal floor; roof has a thin **metal safety railing**; rosette in each arch head; blank corner pier with two small windows. |
| `wing-17-series6.png` | Ground-level construction photo of the series-6 block | The **series-6 bay is set back** from the series 1/2 facade line, has a narrower 3-opening facade, no pediment, and small arched openings of its own. |
| `building-entrance.jpg` | Entrance portal (shared with Wing 18) | Arched portal reused by the pair (slatted vault, rosette, glazed double door, lanterns, number plaque). |

### 9.2 Massing — what the building actually is

Wing 17 is **three pedimented modules on each long face, plus a flat
series-6 connector at the party wall and a flat series-3 end block at the
east end**. It is not a flat slab: each long facade is a run of gabled
bays separated by narrow recessed seams.

```
plan (Wing 17 alone, north up)              ← courtyard
  s6      M1          M2          M3      s3
 ┌────┬───────────┬───────────┬───────────┬─────┐
 │  6 │   1 / 2   │   1 / 2   │   1 / 2   │  3  │  north face: 3 pediments
 │    ├───────────┼───────────┼───────────┤     │  over series 1 & 2
 │    │   4 / 5   │   4 / 5   │   4 / 5   │     │  south face: 3 pediments
 └────┴───────────┴───────────┴───────────┴─────┘  over series 4 & 5
  ↑ party wall (x = −24)                 ↑ east end
  series 6 = link to Wing 16             series 3 = no pediment
```

* **Three pedimented modules per face** — 3 north (series 1 & 2) and
  3 south (series 4 & 5) = **6 pediments per wing, 12 per pair**.
* Each module is **10.0 m wide × 20 m deep**: a 1.3 m corner pier + two
  4.35 m arch bays.
* Modules are separated by **1.5 m recessed seams** (2.4 m deep) — the dark
  vertical bands in every photo. They are not glazed.
* **Series 6 is the flat-roofed connector at the party wall** (4.0 m wide,
  set back 2.6 m). The two wings' series-6 flats sit **back to back**, and
  that connector *is* the physical link between Wings 16 and 17.
* **Series 3 is the flat-roofed east end block** (3.0 m); its windows face
  east. It carries no pediment.
* Both long faces are in one plane (`z = +10`); only the series-6
  connector is stepped back (`z = +7.4`).

X layout (authored, west → east):

```
s6        M1            M2            M3            s3
−20 … −16 −16 … −6  |  −4.5 … +5.5  |  +7 … +17     +17 … +20
           seam −6…−4.5             seam +5.5…+7
```

### 9.3 The facade module — 10 m, two bays and a pier

This is the thing models get wrong: **there is no single 5 m window bay,
no jali strip and no "outer balcony column"**. A module is two equal arched
bays and a blank corner pier:

| # | Element | Width | Depth / projection | Notes |
|---|---|---|---|---|
| 1 | **Corner pier** | 1.3 m | 0.35 m proud | Blank stucco; continues to the roof as a plain parapet block (the two small end windows belong to the series-3 block, §9.6) |
| 2 | **Arch bay A** (outer) | 4.35 m | glazing 0.30 m behind the arch face | French window + black railing on every floor; the top floor sits inside the arch |
| 3 | **Arch bay B** (inner) | 4.35 m | balcony projects 1.2 m | Cantilevered balcony + louvred privacy screen + planter; the top floor is a recessed balcony inside the arch |
| | **module total** | **10.0 m** | | |
| — | **Recess seam** (between modules) | 1.5 m | recessed 2.4 m | Dark slot with stacked slabs, black railing and planting; reads as the seam between gables |

Each module repeats on the front (+z) and back (−z) faces. The back face is
drawn in a group rotated π with the opposite `side` sign, which mirrors it
correctly (already how `Wing17Model` handles the pair of faces).

### 9.4 The arch storey and the pediment

The top of each module is a **taller-than-normal arch storey** capped by a
triangular pediment. This is the most distinctive part of Wing 17 and the
part most likely to be under-modelled.

**Arch storey (top floor, `TOP_FH = 4.0 m`)**
- Each bay is framed by a semicircular **arch moulding** (0.22 m wide,
  0.16 m deep) springing **1.15 m** above the top-floor slab, inner radius
  **1.75 m**, outer crown at **3.12 m** — the head fills the tall top floor
  and stops under the roof cornice.
- The arch terminates in short pilaster blocks (0.30 × 0.7 m) that run down
  to the floor slab.
- A **rosette** (Ø0.85 m) sits in the arch head, 0.55 m below the inner
  crown.
- Arch bay A contains a French window with a black railing; bay B contains
  a recessed balcony with a glass door and black railing — exactly as in
  the floors below, but taller openings (2.4 m) and no projecting slab.
- A deep **dentilled cornice** runs across each module at the base of the
  arch storey (floor `FLOORS − 1`).

**Pediment**
- Each module gets **one** triangular gable spanning **its two arch bays**
  (`PEDIMENT_W = 9.1 m` = 2 × 4.35 + 0.2 m overhang each side). It does
  **not** span the corner pier or the recess seams.
- Height `PEDIMENT_H = 3.0 m` above the gable-base cornice; extruded
  `1.2 m` so it reads as a solid mass, not a flat decal.
- **Horizontal cornice** at the base: 0.32 m high × 0.8 m deep, with a
  **dentil course of 14 blocks** (0.15 w × 0.16 h × 0.10 d, ~0.55 m pitch).
- **Raking cornices** up both slopes, 0.26 m wide × 0.50 m deep, carrying
  **7 modillions per slope** (0.18 × 0.26 × 0.20 m, ~0.75 m pitch).
- Plain recessed tympanum, 0.05 m behind the raking face.

**Pediment count — confirmed: 3 per face, 6 per wing, 12 per pair.**
The front panel of `Wing-17.png` was shot from the top of the **Wing-18
entrance**, looking across the courtyard at Wing 17, so **all three
pediments in that frame are Wing 17's** — one per module. The back panel
shows the other three (the farthest partly hidden behind the near module).
The flat-roofed **series-3 end block and series-6 connector carry none**.

Distribution: the three **north** pediments sit over the **series 1 & 2**
flats; the three **south** pediments over **series 4 & 5**. The annotation
line in the front panel puts the split between the western module
(series 2) and the two eastern modules (series 1); the back panel does the
same for series 5 (west) and series 4 (east).

### 9.5 Typical floor (every floor below the arch storey)

Per bay, per floor (`floor ≥ 1`; the ground floor is treated separately):

| Element | Bay A (outer) | Bay B (inner) |
|---|---|---|
| Opening | French window 2.2 w × 2.4 h, white frame, 0.45 m sill | Glass door 2.0 w × 2.4 h + side light |
| Projection | none — window sits 0.30 m behind the arch plane | cantilevered slab 3.0 w × 1.2 d × 0.22 t |
| Railing | black wrought iron, 1.05 h, 0.15 m in front of the glass | black wrought iron, 1.05 h, at the slab edge + side returns |
| Extra | occasional planter | louvred privacy screen 1.8 w × 2.2 h on the outer edge of **alternate** floors; planter box 0.35 h at the slab edge |
| Slab band | 0.22 m high, 0.12 m proud at every floor; brighter cream trim | same |

Floor 0 is a taller plinth storey (4.2 m), mostly solid stucco with
recessed windows and the shared entrance; no balconies above ground.

**Band courses:** a 5-floor rhythm is visible in all three photos —
`CORNICE_FLOORS = [4, 9, 14]`, plus the deeper dentilled band at the base
of the arch storey (`FLOORS − 1`). The current model uses `[3, 8, 13]`,
which puts a band under the wrong floor.

### 9.6 The series-6 recessed bay (party-wall end)

`wing-17-series6.png` is the only photo of this face and it is decisive:

- The bay is **set back ≈2.6 m** from the series 1/2 facade plane; you can
  see the return wall and the shadow line in the photo.
- It is **narrower than a module**: three openings per floor — a slit
  window (0.6 × 1.2) next to the party wall, then two white-framed windows
  (1.3 × 2.0) with shallow Juliet railings.
- It has **no pediment** — a plain flat parapet at roof level, which is why
  the three gables read as three distinct modules.
- Its top floor carries **two small arched openings** with white surrounds
  (a reduced version of the tower arch motif), visible mid-frame in the
  photo.
- Series 6 is the innermost flat of each wing, so the pair has **two
  series-6 bays back to back across the party wall**. In the model they
  become one shared recessed slot.

Model plan: implement this as a 4.0 m wide (the photo suggests 5.5–6 m, see
§9.7) × 20 m deep block at the party-wall edge, with its north face offset
**+2.6 m**, its own 3-opening facade and a flat parapet. The current
model's 4 m `CORE_W` slot in the *middle* of the wing is the placeholder
for this bay — move it to the party-wall edge.

### 9.7 Footprint and site numbers — the unresolved mismatch

| Measure | Value | Source |
|---|---|---|
| Model footprint (Wing 17) | **40 × 20 m** | 4.0 connector + 3×10.0 + 2×1.5 seams + 3.0 end block |
| Photo-derived wing width | **40–42 m** | 3 gabled modules + connector + end block |
| `wings.ts` pair span (`WING18_SPAN`) | **32 m** | places the wings at x = −40 / −8 |
| Party wall | **x = −24** | reflection fit, §2 |

The two numbers cannot both be right: with a 40 m model the two wings
overlap by 8 m, and the party wall lands 4 m inside each wing. This is the
same defect `wing-18-context.md` §10 records for 18/19.

**Options for whoever codes this:**
- **A (default, least churn):** keep the 40 m model and the existing
  placement, and accept the overlap. Everything visual still reads
  correctly because the wings are mirror images and the overlap is inside
  the shared mass.
- **B (correct):** add `PAIR_SPAN_1617 = 40` and place the pair at
  `x = −44 / −4` so the party wall stays at **−24** and the wings touch
  without overlapping. Update `pairX` to take the span as an argument; do
  not change `WING18_SPAN` (18/19 keep 32 m until their own model is fixed).

Do **not** simply shrink `Wing17Model` to 32 m: the three modules, the
series-6 connector and the series-3 block need the full 40 m, and the
photos would no longer fit. If 32 m must be honoured, the modules shrink
to ~8 m and the facade stops matching the photos.

### 9.8 Series mapping — cross-checked against the numbered plan

Read off `Master-Plan-Sobha-Neopolis-with-numbering.webp` (red digits,
Oct 2026). The digits sit **one per block**, not per bay:

| Series | Plan position | Wing 17 legend | Block / face on the model | Pediment |
|---|---|---|---|---|
| 1 | north-west | 1915 East Facing Elite | **North face, modules M2 + M3** (middle + east) | 2 of 3 |
| 2 | north-east | 1915 West Facing Prime | **North face, module M1** (west) | 1 of 3 |
| 3 | east | 1613 West Facing Prime | **East end block** (+17…+20) | **none** |
| 4 | south-east | 1915 North Facing Prime | **South face, modules M2 + M3** | 2 of 3 |
| 5 | south-west | 1915 North Facing Prime | **South face, module M1** | 1 of 3 |
| 6 | west | 1611 East Facing Select | **Series-6 connector at the party wall** (§9.6) | **none** |

So series 1 + 2 cover the **three north pediments** and series 4 + 5 the
**three south pediments**; series 3 and 6 have flat roofs.

This is consistent with the photo annotations:
- Front view: **left = series 2, right = series 1.** The camera looks from
  the north-east, so the *east* tower appears on the left — no contradiction
  with "series 1 is NW".
- Back view: **left = series 5, right = series 4**, same reason (looking
  from the south-west, west appears on the left).
- The pair mirrors by **series number**, 1↔1 … 6↔6 (§2), never 1↔2 / 3↔6.

### 9.9 What `Wing17Model.tsx` gets wrong today

These were the concrete deltas identified in the analysis. All have been
**fixed** by the rewrite:

1. **One arched bay per tower, and two towers.** ✅ The model now renders
   **three 10 m modules per face**, each with **two 4.35 m bays** and a
   gable over both.
2. **No corner pier.** ✅ The outer end is now a **1.3 m blank pier** per
   module, matching the photos.
3. **The 4 m core slot is in the middle** → now a flat **series-6 connector
   at the party-wall end** (glazed) plus a flat **series-3 block at the
   east end**, both recessed / set back.
4. **Cornice floors `[3, 8, 13]`** → now `[4, 9, 14]` with the arch-storey
   base band.
5. **Uniform 3.2 m top floor** → now a **4.0 m arch storey** so the arch
   head and rosette fit under the pediment.
6. **Pediment spans loggia + jali + outer window** → now spans exactly the
   module's **two arch bays** (9.1 m) with dentils and raking modillions,
   three per face.
7. **No roof safety railing / lightning rods** → added thin metal railing
   (1.1 m, posts at 1.6 m) and two finial rods at each gable apex.
8. **`wing17FlatPlacement`** → recomputed with the new bay centres and
   `axis` field for series-3 end-block flats.

### 9.10 Target parameter block

Use these names/values (they are what `wing16-17-plan.md` codes against):

```ts
const FH = 3.2;              // typical floor-to-floor
const TOP_FH = 4.0;          // arch storey (top floor)
const FLOORS = 20;           // G+19 (placeholder, ±1)
const DEPTH = 20;
const FRONT = DEPTH / 2;     // 10
const WING_W = 40.0;         // wing width, east–west
const SIDE_X = WING_W / 2;   // 20.0
const MODULE_W = 10.0;       // 3 per face
const SEAM_W = 1.5;          // recessed seam between modules
const PIER_W = 1.3;          // corner pier inside a module
const BAY_W = 4.35;          // (10.0 − 1.3) / 2
const SERIES6_W = 4.0;       // flat connector at the party wall
const SERIES6_SETBACK = 2.6;
const SERIES3_W = 3.0;       // flat east end block
const ARCH_R = 1.75;         // inner radius of the arch moulding
const ARCH_SPRING = 1.15;    // above the top-floor slab
const ARCH_BAND = 0.22;
const ROSETTE_D = 0.85;
const PEDIMENT_W = 9.1;      // 2 bays + 0.2 overhang each side
const PEDIMENT_H = 3.0;
const PEDIMENT_D = 1.2;
const DENTILS = 14;
const CORNICE_FLOORS = [4, 9, 14];
const RAIL_H = 1.05;
const BAL_DEPTH = 1.2;
const SCREEN_W = 1.8;
const SCREEN_H = 2.2;
const ROOF_RAIL_H = 1.1;
const BODY_H = (FLOORS - 1) * FH + TOP_FH;   // 64.8
```

Module x, **authored in Wing 16's orientation** (west → east):
`−20…−16` series 6, `−16…−6` M1, `−4.5…+5.5` M2, `+7…+17` M3,
`+17…+20` series 3. Module centres **−11, +0.5, +12**. Wing 17 mirrors the
whole frame with `fx = −1` (§9.12), which puts its series-6 connector at
the party wall and its series-3 block at the east end.

```ts
// module-local x, outer edge = +5.0
const LOCAL_PIER_X  =  4.35;
const LOCAL_BAY_A_X =  1.525;
const LOCAL_BAY_B_X = -2.825;
const MODULE_CX = [-11, 0.5, 12];   // M1, M2, M3 (authored)
// world x = moduleCx + side * localX
// 4.0 + 3×10.0 + 2×1.5 + 3.0 = 40.0 m ✓
```

### 9.11 Materials & palette (sampled from the photos)

| Material | Hex | Notes |
|---|---|---|
| Stucco (sunlit) | `#dbc6a2` | main wall field |
| Stucco (shadow) | `#b39a74` | returns, reveals |
| Trim / mouldings | `#e8dcc2` | cornices, arch surrounds, pediment |
| Reveal / recess | `#6f6555` | loggia backs, window reveals |
| Glass | `#46586a` | day; emissive `#ffd9a0` for lit windows |
| Railing / metal | `#141414` | wrought iron, adjacent to glass |
| Privacy screen | `#b09a6a` | louvred, alternate floors |
| Plinth | `#b3a284` | ground-floor base |
| Roof rail | `#3a3a3a` | thin safety rail on the parapet |

Textures are generated with `canvasTexture()` from `./textures` (no
external assets): rosette (already in `Wing18Portal.tsx`), screen/lattice,
railing alpha map. Keep that convention.

### 9.12 Mirror relationship to Wing 16

Wing 16 is the **exact mirror** of Wing 17 about the party wall (x = −24).
Every dimension, bay sequence and gable mirrors; the series numbering
(1–6) maps 1↔1, 2↔2, … 6↔6 (see §2). The component is used unchanged for
both wings — but because the series-6 bay exists at **one end only**, the
reflection must be applied in local x, not just by translating the same
geometry:

```ts
const fx = wing.number === 17 ? -1 : 1;   // 17 = mirror of the authored 16
```

Multiply every local x (tower centres, `side`, series-6 bay centre, flat
placements) by `fx`. **Do not** use a negative `scale` — it reverses
triangle winding and makes the single-sided glass planes disappear. The
front face (+z) and the `rotation: Math.PI` stay the same for both wings,
so both fronts still face the courtyard.

### 9.13 Still open

* **No photo of Wing 16, its ground floor, or the pair's entrance.** The
  portal is assumed to be the Wing 18 design (§9.1).
* **Which modules belong to series 1 vs series 2** (and 4 vs 5) is read
  from the annotation line: the western module is series 2 / 5 and the two
  eastern modules are series 1 / 4. The pediment *count* (6 per wing) is
  confirmed; the module-to-series split is an inference.
* **Series-6 connector width** is 4.0 m; the photo could support 4.5–5 m,
  but 4.0 keeps the 40 m wing and the party wall alignment.
* **Exact cornice indices** are a 5-floor rhythm read from photos, not a
  drawing. If a construction photo of the full elevation turns up, recount.
* **The 8 M WIDE DRIVEWAY** strip between the 18/19 row and the courtyard
  is not modelled for the 16/17 row (the strip in `CampusScene.tsx` belongs
  to the 18/19 landscape band, §6 of `wing-18-context.md`).
* The South Campus's west column (12–15) has not been analysed at all.
