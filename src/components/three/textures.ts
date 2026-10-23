"use client";

import * as THREE from "three";

// ---------- canvas textures (no network fonts/assets needed) ----------

const textureCache = new Map<string, THREE.CanvasTexture>();

/** Draw into an offscreen canvas and cache it as a texture, keyed by `key`. */
export function canvasTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(key, texture);
  return texture;
}
