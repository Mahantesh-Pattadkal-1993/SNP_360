# Wing 16/17 — build plan for the Wing-17 model

**Audience:** the next model/engineer implementing or correcting
`src/components/three/Wing17Model.tsx`.
**Source of truth for the built form:** [`wing16-17-context.md`](./wing16-17-context.md)
§9 (photo-derived anatomy, measurements, palette). Read §9.1–§9.6 before
touching geometry; this file is the *how*, that file is the *what*.

This plan describes building **Wing 17**. Wing 16 is the same component
mirrored (context §9.12), so nothing is duplicated.

---

## 0. Ground rules

1. **Do not create a separate Wing-16 component.** 16 and 17 are a pure
   reflection about x = −24. Both entries in `wings.ts` point at
   `Wing17Model`; the mirror comes from `rotation: Math.PI` + the shared
   party wall.
2. **Keep the public API stable.** `WingViewer.tsx` and `CampusScene.tsx`
   import `Wing17Model` and `wing17FlatPlacement`; keep those exports
   (extend, don't rename). Props:
   `{ wing, mode, highlighted?, showLabel?, onSelect?, highlightFlat? }`.
3. **No new dependencies, no external assets.** React 18 + `three@0.169`
   + `@react-three/fiber@8` + `@react-three/drei@9` are all you get.
   Textures are generated with `canvasTexture()` (`src/components/three/textures.ts`).
4. **Reuse the shared primitives** from `Wing18Portal.tsx`: `Box`,
   `Plane`, `Rosette`, and the portal itself. Do not re-declare them.
5. **Coordinate convention:** plan north = **−z**, east = **+x**
   (`src/data/wings.ts`). Model-local front face = **+z**; the wing is
   rotated by `wing.rotation` (π for the 16/17 row), which turns +z into
   north.
6. **All dimensions are metres**, all angles radians. Keep the single
   `const` block at the top of the file so the numbers are reviewable.
7. **TypeScript strict** — no `any`, no unused imports; `next build` must
   pass. Bash here has history expansion, so run scripts from files.

---

## 1. Files to touch

| File | Change |
|---|---|
| `src/components/three/Wing17Model.tsx` | **Rewrite the geometry** to this plan. Keep the exports. |
| `src/data/flats.ts` | Extend `Series` to 6; add `WING16_SERIES` / `WING17_SERIES`; branch `seriesFor()`. |
| `src/data/wings.ts` | (Optional, option B, §3.4) `PAIR_SPAN_1617 = 40` and re-place the pair. |
| `src/components/three/WingViewer.tsx` | Only if the flat-placement signature changes (§8.4). |
| `wing16-17-context.md` | Update §9.9 when the deltas are fixed. |

Nothing else. In particular **do not edit `Building.tsx`** — wings 16/17 no
longer use it, and its side-balcony bug affects wings 01–15 (separate job).

---

## 2. What "done" looks like

A visitor orbiting Wing 17 must see, from the courtyard:

- **three gabled modules** on each long face, each with a **triangular
  pediment** over **two arched bays**, separated by **dark recessed seams**;
- a **stepped north facade**, with the series‑6 bay visibly **set back**
  at the party-wall end and a **flat parapet** (no gable) over it;
- **20 floors** of balconies with black railings, cream privacy screens
  and planters, with **band courses every 5 floors**;
- a **thin metal roof railing** and two finials, no rooftop clutter;
- at night, the same massing with lit windows (no geometry change).

From the back (south) face: the same, mirrored.

---

## 3. Data layer first (do this before geometry)

### 3.1 Extend the series type

`src/data/flats.ts` currently has `export type Series = 1 | 2 | 3 | 4`,
which cannot represent 16/17. Change to:

```ts
/** Series digit: 1–4 for 18/19, 1–6 for 16/17. */
export type Series = 1 | 2 | 3 | 4 | 5 | 6;
type Series4 = 1 | 2 | 3 | 4;
```

Then type the existing maps as `Record<Series4, FlatSeries>` so they do not
have to invent series 5/6:

```ts
export const WING18_SERIES: Record<Series4, FlatSeries> = { /* unchanged */ };
export const WING19_SERIES: Record<Series4, FlatSeries> = { /* unchanged */ };
```

### 3.2 Add the 16/17 maps

Wing 17 legend (context §3.1 / §9.8). `corner` is the plan corner the
series occupies; `tower` is −1 = west, +1 = east; `face` is +1 = north
(front/courtyard), −1 = south (back).

```ts
export const WING17_SERIES: Record<Series, FlatSeries> = {
  1: { series: 1, label: "1915 East Facing Elite",  corner: "North-west", tower: -1, face:  1 },
  2: { series: 2, label: "1915 West Facing Prime",  corner: "North-east", tower:  1, face:  1 },
  3: { series: 3, label: "1613 West Facing Prime",  corner: "North-east", tower:  1, face: -1 },
  4: { series: 4, label: "1915 North Facing Prime", corner: "South-east", tower:  1, face: -1 },
  5: { series: 5, label: "1915 North Facing Prime", corner: "South-west", tower: -1, face: -1 },
  6: { series: 6, label: "1611 East Facing Select", corner: "West",        tower: -1, face:  1 },
};
```

Wing 16 is the mirror of 17 about a **north–south** axis: east↔west flips,
north/south stays, and the *facing word* flips for series 1/2/3/6
(context §3.1). Series numbers do **not** swap.

```ts
export const WING16_SERIES: Record<Series, FlatSeries> = {
  1: { series: 1, label: "1915 West Facing Prime",  corner: "North-east", tower:  1, face:  1 },
  2: { series: 2, label: "1915 East Facing Grande", corner: "North-west", tower: -1, face:  1 },
  3: { series: 3, label: "1611 East Facing Prime",  corner: "North-west", tower: -1, face:  1 },
  4: { series: 4, label: "1915 North Facing Prime", corner: "South-west", tower: -1, face: -1 },
  5: { series: 5, label: "1915 North Facing Prime", corner: "South-east", tower:  1, face: -1 },
  6: { series: 6, label: "1613 West Facing Select", corner: "East",       tower:  1, face:  1 },
};
```

> Series 3 and 6 are the **end** units. They sit on the east/west end of
> the wing, so `tower`/`face` describe the tower whose end they occupy;
> the geometry for them is the end slice + the recessed bay (§7).

### 3.3 Branch `seriesFor()`

```ts
export function seriesFor(wingNumber: number): Partial<Record<Series, FlatSeries>> {
  if (wingNumber === 16) return WING16_SERIES;
  if (wingNumber === 17) return WING17_SERIES;
  return wingNumber === 19 ? WING19_SERIES : WING18_SERIES;
}
```

`parseFlatNumber()` already does `seriesDigit in seriesMap`, so a `Partial`
works and a 5/6 digit in an 18/19 wing is rejected with the existing error
message. Add `export const WING1617_FLOORS = 20;` next to `WING18_FLOORS`.

### 3.4 Footprint decision (do once, then forget it)

`Wing17Model` is **40 m wide** (18 + 4 + 18) × 20 m deep. `wings.ts` places
the pair 32 m apart (`WING18_SPAN`), so the two wings overlap by 8 m and
the party wall is 4 m inside each model.

- **Option A (default):** leave `wings.ts` alone. The overlap is inside the
  solid mass and the render still reads correctly. Nothing else in this
  plan depends on it.
- **Option B:** add `export const PAIR_SPAN_1617 = 40;` and place the pair
  at `x = −44 / −4` (`pairX(k) = −24 + k * 20`), keeping the party wall at
  **−24**. Do not touch `WING18_SPAN` for 18/19.

Pick A unless the site plan is being re-done. **Never** shrink the model to
32 m — three modules, the series-6 connector and the series-3 block need
the full 40 m.

### 4.1 The pair must be mirrored explicitly

The series-6 bay exists at **one end only**, so 16 and 17 cannot both be
the same component with `rotation: Math.PI` alone — that would translate the
asymmetry instead of reflecting it, putting the two series-6 bays at
opposite ends of the pair instead of back-to-back on the party wall.

Mirror in local x, not with a negative scale (a negative `scale` flips
triangle winding and makes the single-sided glass planes disappear):

```ts
// 17 is authored mirrored relative to 16
const fx = wing.number === 17 ? -1 : 1;

const MODULE_CX = [-11, 0.5, 12].map((cx) => cx * fx);
const SEAM_CX   = [-5.25, 6.25].map((cx) => cx * fx);
const S6_X = -18 * fx;    // series-6 connector
const S3_X = 18.5 * fx;   // series-3 end block
```

Because `world x = cx + side * local`, multiplying both `cx` and `side` by
`fx` mirrors every facade element about the wing centre while keeping the
front face (+z) unchanged. Apply the same `fx` to `wing17FlatPlacement`
and to `Series6Bay`.

With the correct pair spacing (§3.4 option B, centres −44 / −4), the
series-6 bays of 16 and 17 land **on the party wall (x = −24)**; with
option A they sit 8 m apart inside the overlap, which is still visually
acceptable but no longer exactly back-to-back.

---

## 4. Coordinate frames

```
world  : x east, y up, z south  (north = −z)
wing   : <group position={[x, 0, z]} rotation={[0, wing.rotation, 0]}>
         local +z = the wing's front face (north after the π rotation)
         local x = along the facade;  local origin = wing centre
tower  : side = −1 (west) | +1 (east), mirrored about local x = 0
face   : +1 = front (+z), −1 = back (−z). The back face is drawn in a
         group at z = −FRONT rotated by π, so it reuses the front-face code
         with the opposite `side` (the existing pattern — keep it).
bay    : face-local x, measured from the wing centre (see §5.2)
```

An element at `(bx, y, bz)` in face-local coordinates is placed as
`[side * bx, y, FRONT - bz]` on the front and, inside the rotated group,
`[(-side) * bx, y, FRONT - bz]` on the back.

---

## 5. Dimension schedule

Heights are absolute from the ground (`y = 0`).

### 5.1 Vertical

| Level | y (m) | Notes |
|---|---|---|
| Ground floor | 0 | taller plinth storey, 4.2 m |
| Typical floor `f` (1…18) | `f * 3.2` | 3.2 m floors |
| Top floor (arch storey) | `19 * 3.2 = 60.8` | `TOP_FH = 4.0` |
| Roof slab | **64.8** | `BODY_H = 19*3.2 + 4.0` |
| Roof parapet top | 65.7 | 0.9 m parapet block |
| Gable base cornice | 64.8 → 65.12 | 0.32 m band |
| Gable apex | **68.12** | `+ 3.0` over the cornice |
| Roof rail top | 65.9 | 1.1 m rail on the slab |

### 5.2 Horizontal

The wing is **asymmetric about its centre**: the 4 m series-6 connector
takes the west edge and the 3 m series-3 block the east edge, leaving room
for exactly **three 10 m modules with two 1.5 m seams**:

| Element | authored x | width | notes |
|---|---|---|---|
| series-6 connector | −20.0 … −16.0 | 4.0 | front at z = 7.4, flat roof |
| module M1 | −16.0 … −6.0 | 10.0 | cx −11 |
| seam | −6.0 … −4.5 | 1.5 | recessed 2.4 m |
| module M2 | −4.5 … +5.5 | 10.0 | cx +0.5 |
| seam | +5.5 … +7.0 | 1.5 | recessed 2.4 m |
| module M3 | +7.0 … +17.0 | 10.0 | cx +12 |
| series-3 block | +17.0 … +20.0 | 3.0 | front at z = 10, flat roof |

Inside a module, measured from its **outer edge** (local x = +5.0) inward:

| Element | local x | width | x within M2 (cx 0.5) |
|---|---|---|---|
| corner pier | +4.35 | 1.3 | 3.7 … 5.0 |
| arch bay A (outer) | +1.525 | 4.35 | −0.65 … 3.7 |
| arch bay B (inner) | −2.825 | 4.35 | −5.0 … −0.65 |
| **module** | — | 10.0 | −5.0 … +5.0 |

`world x = moduleCx + side * localX`. Depth: `DEPTH = 20`, front face
`z = +10`, back `z = −10`; the seams are recessed to `z = 7.6` and the
series-6 connector to `z = 7.4`.

### 5.3 Elevation sketch (front, one module)

```
        /\  pediment 9.1 w × 3.0 h
       /  \   dentils 14 + 7 raking modillions/slope
      /____\  ← gable-base cornice, y 64.8
     |  ()  |  ()  |  arch storey (4.0 m): arch R1.75, rosette Ø0.85
     |______|______|  ← deep dentilled band, y 60.8
     |  ▭   |  ▭   |  floor 18 … every floor: slab band + balcony
     |  ▭   |  ▭   |
        ...            5-floor band courses at y 12.8 / 28.8 / 44.8
     |  ▭   |  ▭   |
     |______|______|  plinth, y 0
      pier  bay A  bay B
      1.3    4.35   4.35          (from the outer edge inward)
```

---

## 6. Facade anatomy (rules the geometry must express)

### 6.1 One module face, repeated six times per wing

A wing has **6 module faces** (3 modules × front/back). Write **one
component** `ModuleFace({ module, side, ... })` and render it 6 times.
Inside a module, measured from its **outer edge** (local x = +5.0) inward:

```
[ pier 1.3 ][ bay A 4.35 ][ bay B 4.35 ]
 local +5…+3.7  +3.7…−0.65   −0.65…−5
 centres: +4.35   +1.525        −2.825
```

`world x = moduleCx + side * localX`. The pediment spans **bays A + B only**
(local +3.9 … −5.0, i.e. 9.1 m with the 0.2 m overhang each side, centred
at local −0.65).

### 6.2 Per-floor rule table

`floor` is 0-based (0 = ground, 19 = arch storey).

| floor | Bay A (outer) | Bay B (inner) | Seam (between modules) | Pier |
|---|---|---|---|---|
| 0 | recessed window 2.2 × 2.4, no balcony | recessed window 2.2 × 2.4, no balcony | solid wall / service door | plinth, no windows |
| 1–18 | French window 2.2 × 2.4 + black railing 1.05 at 0.15 in front | cantilever balcony 3.0 × 1.2 + railing + planter; screen on odd floors | recessed slab + railing + planter | blank; two small windows (0.8 × 1.2) on floors 17–18 only |
| 19 | arched French window 2.4 high + railing | arched recessed balcony + railing | recessed slab + railing | parapet block |

Band courses (both faces, across each module's 10 m):
`CORNICE_FLOORS = [4, 9, 14]` → a 0.32 m band at `y = f*FH − 0.05`,
projecting 0.25 m, with a dentil course (14 blocks, 0.15 × 0.16 × 0.10,
pitch 0.55) under the 14th-floor band and under the arch-storey band.
The band at the arch-storey base (`y = 60.8`) is **deeper** (0.40 m) and
is the one the pediment sits on.

Slab bands at every floor: 0.22 m high, 0.12 m proud, colour `trim`.

### 6.3 Corner pier

- A single box from `y = 0` to `y = 65.7`, `1.3 m` wide, `0.35 m` proud of
  the bay plane, `DEPTH` deep (it is the module's outer end wall, not a
  slab). It sits between bay A and the module edge.
- The facade face of the pier is **blank** — no windows.
- The pier continues above the roof line as a plain parapet block to
  `y = 65.7`, so each module reads as a rectangular mass behind its gable.
- The two small 0.8 × 1.2 windows near the top belong to the **series-3
  end block's east return** (§8.5), not to every pier.

### 6.4 Recess seams

- Between modules, recess the mass between `z = 7.6` and `z = 10` over the
  seam width (1.5 m) for every floor above 0. Build it by splitting each
  module's mass into boxes rather than boolean CSG:
  1. main slab: the module minus the seam, z `−10 … 10`, full height;
  2. ground floor only: full module width, z `−10 … 10` (fills the recess).
- Per floor: a 0.30 m slab at `y = f*FH − 0.15` spanning the seam width
  and 2.4 m deep; a black railing plane at `z = 10 − 0.05`; a planter on
  every third floor; a dark `recess` plane at `z = 7.62` so the seam never
  shows sky through the building.
- This is the **dark vertical seam** between the gables in every photo.
  Keep it empty — no glazing.

### 6.5 Arch storey (floor 19)

- Storey height 4.0 m; slab at `y = 60.8`, roof at `y = 64.8`.
- For each bay (A and B):
  - an **arch moulding** swept as a `THREE.Shape` — reuse the existing
    `archMouldingShape(innerHalf, spring, thickness)` helper in the file:
    `innerHalf = ARCH_R = 1.75`, `spring = 1.15`, `thickness = 0.22`,
    extruded `0.16`.
  - centre it on the bay; its base is at `y = 60.8`. The **inner** crown is
    `60.8 + 1.15 + 1.75 = 63.70`; the **outer** crown is `63.92`, leaving
    0.88 m to the roof slab.
  - the wall inside the arch sits 0.30 m behind the arch face (`z = 9.70`);
    place the glass on that wall and let the moulding form the reveal.
  - a rosette (`Rosette`) at `y = 63.15` (0.55 below the inner crown),
    Ø0.85, on the wall plane.
  - bay A: French window 2.2 × 2.4 + railing.
  - bay B: recessed balcony — glass door 2.0 × 2.4, railing at the arch
    plane, planter.

### 6.6 Pediment

- Triangular prism: base `PEDIMENT_W = 9.1`, rise `PEDIMENT_H = 3.0`,
  extruded `PEDIMENT_D = 1.2` along +z, centred at
  `x = moduleCx + side * (-0.65)`, sitting on the gable-base cornice at
  `y = 65.12`.
- Build with `THREE.Shape` + `ExtrudeGeometry` so the tympanum is a real
  recessed face, not a texture.
- **Horizontal cornice** under the base: 9.4 w × 0.32 h × 0.8 d at
  `y = 64.96`, material `trim`.
- **Dentils**: 14 blocks (0.15 × 0.16 × 0.10) at 0.55 m pitch along the
  cornice, inset 0.08 from the cornice face.
- **Raking cornices**: two boxes rotated by `±atan(3.0 / 4.55) ≈ ±0.58 rad`,
  length `sqrt(4.55² + 3.0²) ≈ 5.45 m`, 0.26 × 0.50 section, one per slope.
- **Modillions**: 7 per slope (0.18 × 0.26 × 0.20), 0.75 m apart along the
  slope, under the raking cornice.
- The back face is handled by the rotated face group (§7.1), so build the
  gable once per face group — no `face` prop is needed.
- **No gable** over the series-6 connector or the series-3 end block.

**Gable count — confirmed: 6 per wing (3 north + 3 south), 12 per pair.**
The front panel of `Wing-17.png` was shot from the top of the Wing-18
entrance and shows **three** pediments, all Wing 17's (one per module); the
back panel shows the other three. They sit over the series 1 & 2 flats (north)
and series 4 & 5 flats (south); series 3 and 6 are flat-roofed.

Practical assertion after implementation: a front elevation of one wing must
show **3 pediments, 6 arches (2 per pediment), 3 recessed seams, one flat
series-6 connector** at the party-wall end and **one flat series-3 block** at
the east end. If you see 2 or 4 pediments, the module array or `fx` is wrong.

### 6.7 Roof and parapet

- Roof slab: module footprint × 0.30 at `y = 64.8`, material `trim`.
- Parapet blocks: 0.9 m high around each module edge except where the gable
  springs (the gable replaces it over the two bays).
- **Safety railing**: 1.1 m high, posts every 1.6 m, two horizontal rails
  (0.05 × 0.05), colour `#3a3a3a`, inset 0.15 m from the edge, on all four
  sides of each module. Use instanced thin boxes or one canvas alpha plane
  per side; ~7 posts per side is enough at scene scale.
- **Finials**: two 1.2 m thin rods (r = 0.04) at each gable apex, plus one
  6 m lightning rod at the series-3 block's east corner. Keep them slim;
  they are visible in `Wing-17-top.png`.
- **Flat roofs**: series-6 connector and series-3 block get a 0.9 m plain
  parapet and the same safety rail — no gable, no finials.

### 6.8 Ground floor and entrance

- Plinth storey 4.2 m of solid stucco `plinth`, 0.4 m proud.
- Recessed windows in bays A/B (2.4 × 2.4, sill 1.0) — no balconies.
- The shared entrance portal (`Wing18Portal`) at the **series-6 bay**,
  centred on the party wall at local `x = −18`. Pass `front = 7.4` and
  `coreFront = 7.4` so it sits in the recess.
  If option A is chosen (no data change), keeping the portal at the wing
  centre is acceptable — but then the recess has no entrance and the
  series-6 bay reads as a blank slot. Prefer moving it.
- Keep the night `pointLight` at the portal and one at each bay's ground
  floor; add no other lights.

### 6.9 Windows, railings, screens (shared look)

- **FramedWindow**: glass plane + 4 frame boxes + centre mullion + transom
  at 0.78 h + projecting sill 0.35 deep. Reuse the existing component;
  change only `width` / `h` / `z`.
- **Railing**: one alpha-tested plane per opening from
  `railingMaterial(width)` (already in the file). 1.05 m high, top/bottom
  rails + bars every 12 cm. Never model individual bars as meshes.
- **Privacy screen**: canvas texture with **horizontal louvres** (not the
  diagonal jali currently used), colour `#b09a6a`, covering the outer
  2.0 m of bay B on odd floors, with 0.4 m side returns.
- **Night mode**: only swap materials (`glassLit` emissive `#ffd9a0`,
  `doorGlass`). No geometry change, no extra lights except the 2–3
  point lights above.

---

## 7. Component decomposition (target `Wing17Model.tsx`)

Keep the file's current shape: one constants block, `useMaterials`, small
pure components, one exported model. Target structure:

```
Wing17Model.tsx
├── constants (context §9.10 — copy them verbatim)
├── useMaterials(mode, highlighted)            // extend the current one
├── railingMaterial(width)                     // keep
├── screenMaterial()                           // new: horizontal louvres
│
├── TOWERS[] = west(-7) / east(11)             // asymmetric placement
├── TowerMass({ cx, side, m })                 // 3 boxes, loggia cut-out
├── TowerFace({ tower, side, floors, m })      // 4× per wing
│   ├── ArchStorey({ tower, side, floors, m })
│   ├── TypicalBayA({ tower, side, floors, m })
│   ├── TypicalBayB({ tower, side, floors, m })
│   ├── Loggia({ tower, side, floors, m })
│   ├── CornerPier({ tower, side, floors, m })
│   └── BandCourses({ tower, side, floors, m })
├── Pediment({ tower, side, m })               // gable + cornice + dentils
├── RoofRailing({ cx, side, m })
├── Series6Bay({ floors, m })                  // recessed party-wall bay
├── Portal({ wing, mode })                     // Wing18Portal wrapper
├── FlatHighlight({ code, placement })         // keep
└── Wing17Model({ ... })                       // composes all of the above
```

### 7.1 `Wing17Model` composition

```tsx
export function Wing17Model({ wing, mode, highlighted = false, showLabel = false, onSelect, highlightFlat }: Wing17ModelProps) {
  const m = useMaterials(mode, highlighted);
  const [x, z] = wing.position;
  const night = mode === "night";
  const fx = wing.number === 17 ? -1 : 1;

  return (
    <group position={[x, 0, z]} rotation={[0, wing.rotation, 0]}
           onClick={(e) => { e.stopPropagation(); onSelect?.(wing); }}>
      {MODULE_CX.map((cx) => (
        <group key={cx}>
          <ModuleMass cx={cx * fx} m={m} />
          {/* front and back share the same code; the back group is rotated π and mirrors `side` */}
          {[{ z: FRONT, rot: 0, s: 1, seed: 0 },
            { z: -FRONT, rot: Math.PI, s: -1 as -1 | 1, seed: 97 }].map((f) => (
            <group key={f.seed} position={[0, 0, f.z]} rotation={[0, f.rot, 0]}>
              <ModuleFace module={cx * fx} side={f.s} floors={wing.floors} faceSeed={f.seed} m={m} />
              <Pediment module={cx * fx} side={f.s} m={m} />
            </group>
          ))}
          <RoofRailing cx={cx * fx} m={m} />
          {night && (
            <pointLight position={[(cx + LOCAL_BAY_A_X) * fx, 2.4, FRONT + 2]}
                        intensity={40} distance={24} decay={1.2} color="#ffc27a" />
          )}
        </group>
      ))}

      {SEAM_CX.map((cx) => <SeamFill key={cx} cx={cx * fx} m={m} />)}
      <Series6Bay floors={wing.floors} cx={-18 * fx} m={m} />
      <Series3Block floors={wing.floors} cx={18.5 * fx} m={m} />
      <Portal wing={wing} mode={mode} fx={fx} />
      {highlightFlat && <FlatHighlight code={highlightFlat.code} placement={highlightFlat.placement} />}
      {showLabel && ( /* keep the existing Html label */ )}
    </group>
  );
}
```

The back face is drawn inside a group already rotated π, so its `side` is
−1 — that mirrors every facade element correctly.

### 7.2 `ModuleMass` and `SeamFill`

```tsx
function ModuleMass({ cx, m }: { cx: number; m: Materials }) {
  return (
    <group>
      <Box args={[MODULE_W, BODY_H, DEPTH]} position={[cx, BODY_H / 2, 0]} material={m.stucco} />
      <Box args={[MODULE_W + 0.5, 0.6, DEPTH + 0.5]} position={[cx, 0.3, 0]} material={m.plinth} />
    </group>
  );
}

function SeamFill({ cx, m }: { cx: number; m: Materials }) {
  const zc = FRONT - SEAM_DEPTH;         // 7.6
  return (
    <group>
      {/* recessed core that closes the slot above ground floor */}
      <Box args={[SEAM_W, BODY_H, zc * 2]} position={[cx, BODY_H / 2, 0]} material={m.stucco} />
      {/* ground floor fills the full depth */}
      <Box args={[SEAM_W, 4.2, DEPTH]} position={[cx, 2.1, 0]} material={m.plinth} />
      {/* cap the slot at roof level */}
      <Box args={[SEAM_W, 0.3, DEPTH]} position={[cx, BODY_H, 0]} material={m.trim} />
      {/* dark back planes so the slot never shows sky */}
      {[-1, 1].map((f) => (
        <Plane key={f} args={[SEAM_W, BODY_H - 4.2]}
               position={[cx, 4.2 + (BODY_H - 4.2) / 2, f * zc]}
               rotation={[0, f === 1 ? 0 : Math.PI, 0]} material={m.recess} />
      ))}
    </group>
  );
}
```

`BODY_H` replaces the old `floors * FH` for the mass — do **not** use
`floors * FH` or the arch storey is lost.

### 7.3 `TowerFace`

```tsx
function ModuleFace({ module, side, floors, faceSeed, m }) {
  const p = { module, side, floors, m };
  return (
    <group>
      <TypicalBayA {...p} />
      <TypicalBayB {...p} faceSeed={faceSeed} />
      <CornerPier {...p} />
      <BandCourses {...p} />
      <ArchStorey {...p} />
    </group>
  );
}
```

Child coordinates are module-local: `world x = module + side * localX`, z
measured from the facade plane outward (0 = wall face), y absolute. The
seam is a separate `SeamFill` (§7.2), not part of the module.

### 7.4 `TypicalBayA` (outer bay, floors 0–18)

```tsx
function TypicalBayA({ module, side, floors, m }) {
  const x = module + side * LOCAL_BAY_A_X;
  return (
    <group>
      {Array.from({ length: floors - 1 }, (_, f) => {
        const y0 = f * FH;
        const lit = isLit(f * 7 + side * 3);
        if (f === 0) {
          return <FramedWindow key={f} x={x} y0={y0} z={0.30} width={2.2} h={2.4} sill={1.0} lit={lit} m={m} />;
        }
        return (
          <group key={f}>
            <FramedWindow x={x} y0={y0} z={0.30} width={2.2} h={2.4} lit={lit} m={m} />
            <Plane args={[2.4, RAIL_H]} position={[x, y0 + 0.45 + RAIL_H / 2, 0.45]}
                   material={railingMaterial(2.4)} />
            <Box args={[BAY_W, 0.22, 0.14]} position={[x, y0 - 0.11, 0.07]} material={m.trim} />
          </group>
        );
      })}
    </group>
  );
}
```

`FramedWindow` gains optional `h` and `sill` props (default 2.0 / 0.43) so
the same component serves ground-floor windows and the 2.4 m typical
window. Keep its frame/mullion/sill proportions from the current version.

### 7.5 `TypicalBayB` (inner bay, balcony + screen)

Same loop with `const x = module + side * LOCAL_BAY_B_X`, but for `f ≥ 1`
add:

```tsx
<Box args={[3.0, 0.22, BAL_DEPTH]}
     position={[x, y0 + 0.32, BAL_DEPTH / 2]} material={m.slab} />
<Plane args={[2.8, RAIL_H]}
       position={[x, y0 + 0.43 + RAIL_H / 2, BAL_DEPTH]}
       material={railingMaterial(2.8)} />
{[-1, 1].map((s) => (
  <Plane key={s} args={[BAL_DEPTH, RAIL_H]}
         position={[x + s * 1.5, y0 + 0.43 + RAIL_H / 2, BAL_DEPTH / 2]}
         rotation={[0, (-s * Math.PI) / 2, 0]} material={railingMaterial(BAL_DEPTH)} />
))}
{f % 2 === 1 && (
  <Plane args={[SCREEN_W, SCREEN_H]}
         position={[x + (side * (BAY_W - SCREEN_W)) / 2, y0 + 1.55, BAL_DEPTH - 0.05]}
         material={screenMaterial()} />
)}
<Box args={[3.0, 0.35, 0.3]} position={[x, y0 + 0.61, BAL_DEPTH - 0.2]} material={m.trim} />
<mesh position={[x, y0 + 0.9, BAL_DEPTH - 0.25]} material={f % 3 === 0 ? m.flowers : m.foliage}>
  <boxGeometry args={[SCREEN_W * 0.8, 0.45, 0.45]} />
</mesh>
```

Balcony floor level = `y0 + 0.43` (window sill). Corbels: two
0.3 × 0.5 × 0.45 blocks at `y0 + 0.05` under the slab, material `trim`.

### 7.6 `ArchStorey`

```tsx
function ArchStorey({ module, side, floors, m }) {
  const y0 = (floors - 1) * FH;          // 60.8
  const archGeo = useMemo(
    () => new THREE.ExtrudeGeometry(
      archMouldingShape(ARCH_R, ARCH_SPRING, ARCH_BAND),
      { depth: 0.16, bevelEnabled: false }
    ),
    []
  );
  return (
    <group>
      {[LOCAL_BAY_A_X, LOCAL_BAY_B_X].map((lx) => (
        <group key={lx} position={[module + side * lx, y0, 0.5]}>
          <mesh geometry={archGeo} material={m.trim} castShadow />
          <Rosette position={[0, ARCH_SPRING + ARCH_R - 0.55, -0.02]} size={ROSETTE_D} />
          <FramedWindow x={0} y0={0} z={-0.30}
                        width={lx === LOCAL_BAY_A_X ? 2.2 : 2.0} h={2.4}
                        lit={isLit(lx * 7)} m={m} />
          <Box args={[0.30, 0.7, 0.2]} position={[-ARCH_R - 0.12, 0.35, 0]} material={m.trim} />
          <Box args={[0.30, 0.7, 0.2]} position={[ ARCH_R + 0.12, 0.35, 0]} material={m.trim} />
        </group>
      ))}
    </group>
  );
}
```

`archMouldingShape` already exists and returns a U-shape open at the
bottom; the moulding is placed 0.5 m in front of the wall so it reads as a
projecting surround. The geometry is created once per `ArchStorey`, i.e.
twice per module — acceptable.

### 7.7 `CornerPier`, `BandCourses`

- `CornerPier` — the end-wall box (§6.3) at
  `x = module + side * LOCAL_PIER_X`, 1.3 m wide, 0.35 m proud, blank.
- `BandCourses` — one box per entry in `CORNICE_FLOORS` spanning the
  module's bay run (local +3.7 … −5.0, i.e. 8.7 m), height 0.32, depth
  0.8 (0.25 proud), plus a dentil row of 14 blocks under the floor-14
  band. The deep band at the arch-storey base spans the full module width.
- The seams get their own slabs and railings in `SeamFill` (§7.2), not here.

### 7.8 `Pediment`, `RoofRailing`

- `Pediment({ module, side, m })` — a triangular `ExtrudeGeometry` with
  `PEDIMENT_W/H/D`, centred at `x = module + side * (-0.65)` (the middle of
  bays A+B), sitting on the arch-storey cornice at `y = 65.12`. Include the
  horizontal cornice, 14 dentils, two raking cornices and 7 modillions per
  slope (§6.6). One call per face covers front and back.
- `RoofRailing({ cx, m })` — per module: 4 sides, posts + 2 rails, 1.1 m
  high, at `y = 64.8`, inset 0.15 m from the 10 × 20 m footprint. Build
  posts with a single `instancedMesh` or ≤ 40 thin boxes; do not add a post
  per metre on all four sides at full resolution.

### 7.9 `Series6Bay` and `FlatHighlight`

See §8. `FlatHighlight` keeps its current signature and look (cyan
outline + label) but must use the new `wing17FlatPlacement` (§8.4).

---

## 8. The series-6 bay and flat placement

### 8.1 Geometry

`Series6Bay` sits at the **west edge** of Wing 17, local `x = −20 … −16`,
and is **set back 2.6 m**:

```tsx
function Series6Bay({ floors, cx, m }: { floors: number; cx: number; m: Materials }) {
  const w  = SERIES6_W;               // 4.0
  const zf = FRONT - SERIES6_SETBACK; // 7.4
  const x0 = cx - w / 2;

  return (
    <group>
      {/* mass: from the set-back front to the back face */}
      <Box args={[w, BODY_H, zf + FRONT]}
           position={[cx, BODY_H / 2, (zf - FRONT) / 2]} material={m.stucco} />

      {/* side return walls, visible because the bay is set back */}
      {[-1, 1].map((s) => (
        <Box key={s} args={[0.3, BODY_H, SERIES6_SETBACK]}
             position={[cx + s * (w / 2), BODY_H / 2, zf + SERIES6_SETBACK / 2]}
             material={m.stucco} />
      ))}

      {/* flat parapet — no pediment here */}
      <Box args={[w + 0.3, 0.9, zf + FRONT + 0.3]}
           position={[cx, BODY_H + 0.45, (zf - FRONT) / 2]} material={m.trim} />

      {Array.from({ length: floors }, (_, f) => {
        const y0 = f * FH;
        if (f === floors - 1) {
          return (
            <group key={f}>
              {[-0.55, 0.75].map((dx) => <ArchSmall key={dx} x={cx + dx} y0={y0} m={m} />)}
            </group>
          );
        }
        return (
          <group key={f}>
            {/* 0.6 m slit on the party-wall side (x0 + 0.25) */}
            <FramedWindow x={x0 + 0.55} y0={y0} z={0.02} width={0.6} h={1.2} sill={1.4}
                          lit={isLit(f * 5)} m={m} />
            {/* two 1.3 m windows with shallow Juliet railings */}
            {[1.45, 2.75].map((dx) => (
              <group key={dx}>
                <FramedWindow x={x0 + dx} y0={y0} z={0.02} width={1.3} h={2.0}
                              lit={isLit(f * 11 + dx * 10)} m={m} />
                <Plane args={[1.5, RAIL_H]} position={[x0 + dx, y0 + 0.43 + RAIL_H / 2, 0.22]}
                       material={railingMaterial(1.5)} />
              </group>
            ))}
            <Box args={[w, 0.2, 0.12]} position={[cx, y0 - 0.1, 0.06]} material={m.trim} />
          </group>
        );
      })}
    </group>
  );
}

function ArchSmall({ x, y0, m }) {
  const geo = useMemo(
    () => new THREE.ExtrudeGeometry(archMouldingShape(0.55, 0.30, 0.14), { depth: 0.1, bevelEnabled: false }),
    []
  );
  return (
    <group position={[x, y0 + 0.6, 0.02]}>
      <mesh geometry={geo} material={m.trim} />
      <FramedWindow x={0} y0={0} z={0} width={0.9} h={1.3} lit={isLit(x * 13)} m={m} />
    </group>
  );
}
```

Note the window offsets are measured from `x0` (the bay's left edge in
authored space), so they mirror with `cx` automatically. The mass runs
from `z = 7.4` to `z = −10` (17.4 m deep), so it does **not** break the
south facade line.

### 8.2 What it must *not* be

- Not a blank stair core (the current `CORE_W` slot).
- Not in the middle of the wing.
- No jali/lattice texture on it.
- No gable.

### 8.2b The series-3 end block (the other flat piece)

The east end needs a matching flat-roofed block, +17 … +20 (3.0 m), full
depth, front at `z = +10`:

```tsx
function Series3Block({ floors, cx, m }) {
  const h = BODY_H;
  return (
    <group>
      <Box args={[SERIES3_W, h, DEPTH]} position={[cx, h / 2, 0]} material={m.stucco} />
      <Box args={[SERIES3_W + 0.3, 0.9, DEPTH + 0.3]} position={[cx, h + 0.45, 0]} material={m.trim} />
      {Array.from({ length: floors }, (_, f) => {
        if (f < 2) return null;
        const y0 = f * FH;
        return (
          <group key={f}>
            {/* two small windows on the east return */}
            {[-0.9, 0.9].map((dz) => (
              <Plane key={dz} args={[0.8, 1.2]}
                     position={[cx + SERIES3_W / 2 + 0.01, y0 + 1.5, dz]}
                     rotation={[0, Math.PI / 2, 0]}
                     material={isLit(f * 13 + dz * 7) ? m.glassLit : m.glass} />
            ))}
            <Box args={[SERIES3_W, 0.2, 0.12]} position={[cx, y0 - 0.1, DEPTH / 2 + 0.05]} material={m.trim} />
          </group>
        );
      })}
    </group>
  );
}
```

It is the block that carries the two small stacked windows visible at the
top of the blank end wall in `Wing-17-top.png`.

### 8.3 Flat placement API

The current `wing17FlatPlacement(floor, tower, face)` cannot address series
3 (end face) or series 6 (recessed bay). Replace it with a series-aware
signature **and keep a compatibility overload**:

```ts
export function wing17FlatPlacement(floor: number, series: Series, wingNumber = 17): FlatPlacement {
  const fx = wingNumber === 17 ? -1 : 1;
  const mx = (v: number) => v * fx;
  const y = floor * FH + FH / 2;
  // bay B of each module is the representative facade for its flat
  const bayB = (cx: number) => cx + LOCAL_BAY_B_X;
  const M1 = bayB(MODULE_CX[0]);   // -13.825
  const M3 = bayB(MODULE_CX[2]);   //   9.175
  switch (series) {
    case 1: return { center: [mx(M3), y,  FRONT + 0.1], normal:  1, axis: "z" }; // + M2
    case 2: return { center: [mx(M1), y,  FRONT + 0.1], normal:  1, axis: "z" };
    case 4: return { center: [mx(M3), y, -FRONT - 0.1], normal: -1, axis: "z" }; // + M2
    case 5: return { center: [mx(M1), y, -FRONT - 0.1], normal: -1, axis: "z" };
    case 3: return { center: [mx(18.5), y, 0], normal: 1 * fx, axis: "x" };
    case 6: return { center: [mx(-18), y, FRONT - SERIES6_SETBACK + 0.1],
                     normal: 1, axis: "z" };
  }
}
```

Series 1 and 4 each cover **two** modules (M2 + M3); the highlight targets
M3, the nearer of the two. If a flat should highlight both, return an array
of placements instead.

Add `axis: "x" | "z"` to `FlatPlacement`; `FlatHighlight` must rotate its
box and label for `axis === "x"`. Keep the old `(floor, tower, face)`
overload for `WingViewer` until it is migrated:

```ts
/** @deprecated use the series overload */
export function wing17FlatPlacement(floor: number, tower: -1 | 1, face: -1 | 1): FlatPlacement;
```

### 8.4 `WingViewer` change

`WingViewer` currently calls
`wing17FlatPlacement(flat.floor, flat.series.tower, flat.series.face)`.
After adding `WING16/17_SERIES`, call
`wing17FlatPlacement(flat.floor, flat.series.series, wing.number)`. For
series 3 the camera must approach along x:

```ts
const dir = placement.axis === "x"
  ? new THREE.Vector3(placement.normal, 0, 0)
  : new THREE.Vector3(0, 0, placement.normal);
setGoal({ target, position: target.clone().add(dir.multiplyScalar(14)).add(new THREE.Vector3(0, 1.2, 0)) });
```

---

## 9. Materials

Reuse `useMaterials` from the current file, with these changes:

- `stucco` `#dbc6a2`, `trim` `#e8dcc2`, `slab` `#e4d5b7`,
  `recess` `#6f6555`, `plinth` `#b3a284`, `metal` `#141414`.
- Replace the diagonal `lattice` texture with a **horizontal louvre**
  texture (`screenMaterial()`): 64 × 128 canvas, base `#b09a6a`, 12 slats
  `#8d7a52` 6 px high every 12 px, 2 px shadow line.
- Night: `glassLit` emissive `#ffae52` at 1.3, `doorGlass` at 1.6,
  `glass` `#1a2230`. Keep the current night behaviour.
- `highlighted`: keep the `#a8d5b5` tint on `stucco` (campus hover/select).
- Memoise on `[mode, highlighted]`; do **not** include `floors` unless a
  texture repeat actually depends on it.

---

## 10. Integration points

| File | What it does | What to check |
|---|---|---|
| `CampusScene.tsx` | renders `Wing17Model` when `wing.number` is 16/17 and `detailedModel` | no signature change; `onSelect`/`highlighted` still wired |
| `WingViewer.tsx` | close-up viewer + flat fly-to | update the placement call (§8.4) |
| `wings.ts` | `floors: FLOORS` (20), `rotation: Math.PI`, `detailedModel: true` | optional option B (§3.4) |
| `WingDetailViewer.tsx` | enables the flat-number UI when `detailedModel` | `parseFlatNumber` now accepts series 5/6 for 16/17 (§3) |
| `Building.tsx` | generic block | untouched |

The campus scene places both wings at `z = 174` with `rotation: Math.PI`,
so after the rotation local +z points to **−z = north** (the courtyard).
The front face (arch bays + gables) therefore faces the courtyard — do not
"fix" the rotation.

---

## 11. Implementation order

Do these in order; each ends with a check. Stop and fix before moving on.

### Step 1 — data layer (`flats.ts`)
Add `Series` 5/6, `WING16_SERIES`, `WING17_SERIES`, branch `seriesFor`,
`WING1617_FLOORS`. Keep 18/19 maps typed `Record<Series4, FlatSeries>`.
**Check:** `npx tsc --noEmit` clean; `parseFlatNumber("17015", 17, 20)`
returns series 5, and `"18015"` is rejected.

### Step 2 — constants + materials (`Wing17Model.tsx`)
Replace the constant block with context §9.10. Update `useMaterials`
(palette §9). Add `screenMaterial()`. Delete the old `BAY_W = 5`,
`JALI_W`, `OUTER_BAL_*` constants.
**Check:** `tsc` clean. Nothing renders differently yet — the old geometry
will reference missing constants, so expect a broken build until Step 3;
do Steps 2 and 3 in one sitting.

### Step 3 — massing
Write `ModuleMass` + `SeamFill` (§7.2) and the new `Wing17Model` shell
(§7.1) with the `ModuleFace` calls stubbed to `null`, plus `Series6Bay`
(§8.1) and `Series3Block` (§8.2b).
**Check:** in the campus view the wing reads as **three 10 m modules with
two 1.5 m seams**, a set-back 4 m connector at the party wall and a 3 m
flat block at the east end; roof line at **64.8 m**; no gaps between the
boxes when viewed from above.

### Step 4 — typical bays + loggia
Implement `TypicalBayA`, `TypicalBayB`, `Loggia`, `CornerPier`,
`BandCourses` (§7.3–7.5, 7.7).
**Check:** 19 floors of windows per bay; balcony slabs land at sill level
(0.43 above each slab); no z-fighting between the glass plane and the
wall (keep ≥ 0.02 offset); railings render both sides (DoubleSide
material already does).

### Step 5 — arch storey
Implement `ArchStorey` (§7.6). Use the existing `archMouldingShape`.
**Check:** two arches per tower face, crowns at 65.23, rosettes at 64.25,
no arch poking through the roof slab, pilasters reaching the slab.

### Step 6 — pediment
Rewrite `Pediment` (§6.6). Confirm the gable spans only the two bays and
sits on the arch-storey cornice.
**Check:** **3 gables per face / 6 per wing / 12 per pair**; apex at
68.12; dentils do not intersect the tympanum; raking cornices meet the
apex cleanly (leave a 0.02 gap rather than overlapping boxes).

### Step 7 — roof, pier windows, screens
Add `RoofRailing`, the pier's side windows, and the louvred screens.
**Check:** rail posts are inside the parapet line; nothing floats above
the roof; screens sit on odd floors only.

### Step 8 — ground floor + portal
Recessed ground-floor windows; move `Wing18Portal` to the series-6 bay
(`front={7.4}`). Keep one night point light per tower.
**Check:** the portal is visible from the courtyard, inside the recess,
and does not clip the series-6 mass.

### Step 9 — flat placement + highlight
Replace `wing17FlatPlacement` with the series form (§8.3), add `axis`,
update `FlatHighlight`, then migrate `WingViewer` (§8.4).
**Check:** `?wing=wing-17&flat=17015` (and a series-3 flat) highlight the
right bay and fly the camera to the correct face.

### Step 10 — mirror + cleanup
Confirm Wing 16 uses the same component with no special-casing; remove the
old `OuterBalconyColumn`, `WindowBay`, jali/lattice code and unused
materials; update `wing16-17-context.md` §9.9 to "fixed".
**Check:** the two wings are mirror images across x = −24 (see §12.3).

---

## 12. Verification

### 12.1 Build gates (the only automated ones available)

```bash
npx tsc --noEmit
npx next lint
npx next build
```

> In this shell `next build` / `next lint` can exit non-zero even on
> success (shell integration quirk). Read the output; do not trust `$?`.
> There is no headless browser, so no screenshot diffing.

### 12.2 Numeric self-checks (add temporarily, then delete)

A throwaway script (or a `console.assert` block behind `process.env.NODE_ENV`)
should assert:

```js
assert(SERIES6_W + 3 * MODULE_W + 2 * SEAM_W + SERIES3_W === WING_W); // 40
assert(PIER_W + 2 * BAY_W === MODULE_W);                  // 10.0
assert(LOCAL_PIER_X + PIER_W / 2 === MODULE_W / 2);       // 5.0
assert(LOCAL_BAY_A_X - LOCAL_BAY_B_X === BAY_W);          // 4.35
assert(MODULE_CX[1] - MODULE_CX[0] === MODULE_W + SEAM_W);// 11.5
assert(MODULE_CX[2] - MODULE_CX[1] === MODULE_W + SEAM_W);// 11.5
assert((FLOORS - 1) * FH + TOP_FH === BODY_H);            // 64.8
assert(ARCH_SPRING + ARCH_R + ARCH_BAND < TOP_FH);        // 3.12 < 4.0
assert(PEDIMENT_W === 2 * BAY_W + 0.4);                   // 9.1
```

### 12.3 Visual checklist (from the photos, in order of importance)

Compare against `Wing-17.png` / `Wing-17-top.png` / `wing-17-series6.png`:

1. **Three** gables per wing front, each over **two** arches — six per wing
   in total, and series 3/6 never carry one.
2. Dark recessed seams between the three modules, no glazing in them.
3. Series-6 connector visibly **set back** with a flat parapet, and a flat
   series-3 block at the east end.
4. Band course every 5 floors + a deeper one under the arches.
5. Balconies: black railing + beige screen + planter, alternating.
6. Blank outer pier with two small windows near the top.
7. Roof: thin safety rail, two finials, no AC units.
8. Mirror check: stand at the courtyard centre and look at the join —
   the two wings must be exact mirror images across x = −24. A difference
   means a `side` sign or a `rotation` was applied twice.

### 12.4 Performance guardrails

Target: keep each wing under ~2,500 draw calls at scene scale.

- One railing material per width (the existing `Map` cache) — never create
  per-floor materials.
- Reuse the arch geometry (one per `ArchStorey`) and the rosette texture
  (already module-level in `Wing18Portal`).
- Roof posts as a single `instancedMesh` or ≤ 40 boxes per tower.
- No `useMemo` inside per-floor loops.
- Do not add per-window point lights; the night look comes from emissive
  materials.

---

## 13. Known deviations (accept or escalate)

| Deviation | Why | Impact |
|---|---|---|
| Series-6 bay is 4.0 m, photo suggests 5.5–6 m | keeps the 40 m span and the existing placement | the recess reads slightly narrow |
| Model is 40 m wide but the pair is placed 32 m apart | pre-existing data bug (§3.4) | 8 m overlap inside the shared mass |
| Floors = 20 (G+19) | photo count + campus convention | ±1 floor of height uncertainty |
| Cornices at 4/9/14 | 5-floor rhythm read from photos | ±1 floor |
| Portal at the party wall | no photo of the 16/17 entrance | design borrowed from Wing 18 |
| Series-6 setback = 2.6 m | one photo + plan step | ±0.5 m |

If a deviation cannot be resolved, record it in `wing16-17-context.md`
§9.13 rather than silently changing a number.

---

## 14. Quick reference — copy/paste constants

```ts
const FH = 3.2, TOP_FH = 4.0, FLOORS = 20, DEPTH = 20;
const WING_W = 40, SIDE_X = WING_W / 2;                       // 40 / 20
const MODULE_W = 10.0, SEAM_W = 1.5, SEAM_DEPTH = 2.4;
const PIER_W = 1.3, BAY_W = 4.35;                             // 1.3 + 2×4.35 = 10.0
const SERIES6_W = 4.0, SERIES6_SETBACK = 2.6, SERIES3_W = 3.0;
const ARCH_R = 1.75, ARCH_SPRING = 1.15, ARCH_BAND = 0.22, ROSETTE_D = 0.85;
const PEDIMENT_W = 9.1, PEDIMENT_H = 3.0, PEDIMENT_D = 1.2, DENTILS = 14;
const CORNICE_FLOORS = [4, 9, 14], RAIL_H = 1.05, BAL_DEPTH = 1.2;
const SCREEN_W = 1.8, SCREEN_H = 2.2, ROOF_RAIL_H = 1.1;
const FRONT = DEPTH / 2;                                      // 10
const MODULE_CX = [-11, 0.5, 12];                             // M1, M2, M3
const SEAM_CX   = [-5.25, 6.25];
const LOCAL_PIER_X  =  4.35;
const LOCAL_BAY_A_X =  1.525;
const LOCAL_BAY_B_X = -2.825;
const BODY_H = (FLOORS - 1) * FH + TOP_FH;                    // 64.8
// 4.0 + 3×10.0 + 2×1.5 + 3.0 = 40.0 m
```

