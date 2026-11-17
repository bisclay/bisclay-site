import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Jedan keramički rad = jedna .md datoteka u src/content/radovi/
 * Ova shema mora ostati usklađena s .pages.yml (CMS koji mama koristi).
 */
const radovi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/radovi' }),
  schema: z.object({
    naziv: z.string(),
    godina: z.number().int().optional(),
    tehnika: z.string().optional(),
    dimenzije: z.string().optional(),
    // Cijena u eurima, bez oznake valute. Prazno = "na upit".
    cijena: z.number().optional(),
    status: z.enum(['dostupno', 'rezervirano', 'prodano']).default('dostupno'),
    // Putanje do slika u /public/uploads/, npr. "/uploads/vaza-1.jpg"
    naslovnica: z.string(),
    galerija: z.array(z.string()).default([]),
    istaknuto: z.boolean().default(false),
    redoslijed: z.number().default(0),
  }),
});

/** Tekstualne stranice: O meni, Kontakt, eventualno "Izložbe". */
const stranice = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stranice' }),
  schema: z.object({
    naslov: z.string(),
    podnaslov: z.string().optional(),
    redoslijed: z.number().default(0),
  }),
});

export const collections = { radovi, stranice };
