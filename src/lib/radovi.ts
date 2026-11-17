import type { CollectionEntry } from 'astro:content';

export type Rad = CollectionEntry<'radovi'>;

const statusRank: Record<Rad['data']['status'], number> = {
  dostupno: 0,
  rezervirano: 1,
  prodano: 2,
};

/**
 * Redoslijed u galeriji:
 *   1. ručni `redoslijed`
 *   2. dostupno → rezervirano → prodano
 *   3. novije prije starijeg
 *   4. abecedno
 */
export function sortRadovi(radovi: Rad[]): Rad[] {
  return [...radovi].sort(
    (a, b) =>
      (a.data.redoslijed ?? 0) - (b.data.redoslijed ?? 0) ||
      statusRank[a.data.status] - statusRank[b.data.status] ||
      (b.data.godina ?? 0) - (a.data.godina ?? 0) ||
      a.data.naziv.localeCompare(b.data.naziv, 'hr'),
  );
}

/** 120 → "120 €"; undefined → null (znači "na upit"). */
export function formatPrice(value?: number): string | null {
  if (value === undefined || value === null) return null;
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}
