/**
 * Shared colours for the 3D site.
 *
 * The campus "floor" (the ground the buildings sit on) is a neutral light GREY, not green.
 * A green floor swallows every green landscape element — lawns, grass cover, planting and
 * shrubs would all blend into the ground and be impossible to pick out. On a neutral floor
 * the green landscape reads clearly as grass cover laid over the paving, so the greens below
 * are the only green in the scene and always mean "planting".
 */

/** Campus floor (the paved/landscaped ground inside the campus boundary). */
export const FLOOR_DAY = "#ced0cb";
export const FLOOR_NIGHT = "#1b1d20";

/** The land outside the campus boundary — a shade lighter than the campus floor. */
export const FLOOR_OUT_DAY = "#dcdcd6";
export const FLOOR_OUT_NIGHT = "#11131f";

/** Grass / lawn cover — the green used for anything planted on the floor. */
export const GRASS = "#4f8f52";
/** Darker green for shrubs, hedges and foliage. */
export const GRASS_DARK = "#3f7a48";
/** Night-time grass — desaturated and dark so it still reads as planting after dark. */
export const GRASS_NIGHT = "#1e3a24";
