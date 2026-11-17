#!/usr/bin/env node
/**
 * Smanjuje fotografije u public/uploads/ na razumnu veličinu.
 *
 * Slike se poslužuju točno onakve kakve su uploadane — nema build-time
 * optimizacije, jer se tako ništa ne može "pokvariti" kad mama doda sliku.
 * Zato s vremena na vrijeme pokreni:
 *
 *     npm run optimize
 *
 * Skripta:
 *   - smanjuje sve JPG/PNG/WEBP na max 1800 px po dužoj strani
 *   - sprema kao WebP (kvaliteta 82) i briše original ako je veći
 *   - preskače datoteke manje od 250 kB
 *
 * Ne dira SVG-ove ni datoteke koje već postoje kao .webp.
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const DIR = new URL('../public/uploads/', import.meta.url).pathname;
const MAX_EDGE = 1800;
const QUALITY = 82;
const SKIP_BELOW = 250 * 1024;
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const files = await readdir(DIR);
let saved = 0;
let count = 0;

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (!EXTS.has(ext)) continue;

  const full = join(DIR, file);
  const info = await stat(full);
  if (info.size < SKIP_BELOW) continue;

  const out = join(DIR, `${basename(file, extname(file))}.webp`);
  if (out !== full && files.includes(basename(out))) continue;

  try {
    const buf = await sharp(full)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();

    if (buf.length >= info.size) continue;

    await sharp(buf).toFile(out);
    if (out !== full) await unlink(full);

    saved += info.size - buf.length;
    count += 1;
    console.log(
      `✓ ${file} → ${basename(out)}  ${(info.size / 1024).toFixed(0)} kB → ${(buf.length / 1024).toFixed(0)} kB`,
    );
  } catch (err) {
    console.warn(`✗ ${file}: ${err.message}`);
  }
}

if (count === 0) {
  console.log('Ništa za optimizaciju — sve je već malo.');
} else {
  console.log(`\n${count} datoteka, ušteđeno ${(saved / 1024 / 1024).toFixed(1)} MB.`);
  console.log('Ako su se datoteke preimenovale u .webp, provjeri putanje u sadržaju.');
}
