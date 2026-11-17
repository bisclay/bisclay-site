# 2026-11-17 — BisClay postavljanje

## Cilj

Statična portfolio stranica za maminu keramiku na `bisclay.com`, s mogućnošću da sama
uređuje sadržaj, i s modelom podataka koji kasnije prima webshop.

## Odluke

| Odluka | Odabir | Zašto |
|---|---|---|
| Generator | Astro 5 | Statični izlaz, content collections (čista shema za CMS), bez JS-a na klijentu |
| Hosting | GitHub Pages + Actions | Besplatno, HTTPS, custom domena preko `public/CNAME` |
| CMS | Pages CMS (`app.pagescms.org`) | Hosted git-CMS: **nema OAuth proxyja** (za razliku od Decap/Sveltia na GH Pages) |
| Uređivač | e-mail collaborator | Mama ne treba GitHub račun ni 2FA; ne vidi ostale repo-e, ne može dirati `.pages.yml` |
| Webshop | odgođen | `cijena` + `status` u shemi; Stripe Payment Links kasnije bez migracije |

Odbijeno: Decap CMS (traži Cloudflare Worker + OAuth app za GH Pages), Snipcart u v1
(naknada, pretjerano za unikatne komade), Shopify (overkill).

## Što je napravljeno

- Astro projekt u `/home/lovro/huskanje-llma/bisclay`
- Rute: `/`, `/galerija/`, `/rad/<slug>/`, `/o-meni/`, `/kontakt/`, `/404.html`
- Content collections `radovi` i `stranice` (zod shema u `src/content.config.ts`)
- `.pages.yml` — CMS shema: Radovi, Stranice, Postavke stranice (site.json)
- `settings.commit.identity: user` da commitovi nose mamino ime
- Deploy workflow (`.github/workflows/deploy.yml`), `public/CNAME` = bisclay.com
- 3 primjera rada + 2 tekstualne stranice + SVG placeholderi
- `scripts/optimize-uploads.mjs` — ručna WebP optimizacija slika
- `npm run build` prolazi: 8 stranica

## Izmjene nakon prvog prolaza

**Cijene skrivene po defaultu.** Dodan prekidač `prikaziCijene` (bool) u `src/data/site.json`,
uređuje se u CMS-u pod *Postavke stranice*. Kad je `false`: nigdje se ne prikazuje cijena
(ni na karticama ni na stranici rada, ni napomena o PDV-u) — ostaje samo gumb za kontakt.
Polja `cijena` u sadržaju se ne brišu, pa se uključivanje svodi na jedan klik.
Provjereno buildom u oba stanja.

**Prodani radovi više nisu "arhiva".** Uklonjena je odvojena sekcija "Arhiva — prodano"
i CSS filter (grayscale + opacity). Sada svi radovi stoje u istoj galeriji, sortirani
tako da dostupni idu prvi, a prodani nose samo značku **Prodano** i prigušen naslov.
Razlog: stranica je portfolio, prodani komad je dokaz rada, a ne ostatak.

## Deploy (stanje 2026-11-17)

- Repo: `bisclay/bisclay-site`, **public**, branch `main`
- AstroPaper template (jedini commit `ef209fc`) zamijenjen force-pushom commitom `cbd9ab7`
  - stari commit ostaje dostupan po SHA ako ikad zatreba
  - `_studio.yml` (Astro Studio) i blog shema u `.pages.yml` su nestali s njim
- Pages: uključen, `build_type=workflow`, `cname=bisclay.com`
- Workflow run `44087913945`: build ✓ (18s), deploy ✓ (11s)
- `https_enforced` još `false` — uključiti nakon što DNS proradi i cert se izda
- DNS (Namecheap BasicDNS) **još nije promijenjen**: A zapis `162.255.119.154`
  (parking) i `www` CNAME `parkingpage.namecheap.com` stoje dok se ne zamijene
  GitHubovim zapisima. Do tada se stranica ne otvara (github.io URL
  preusmjerava na bisclay.com nakon postavljanja custom domene).
- **2026-11-17: domena prebačena na Porkbun** (whois: `Registrar: Porkbun LLC`),
  ali NS su još Namecheapovi i apex još pokazuje na parking → transfer u toku.
  Porkbun ima ALIAS (CNAME flattening), pa na apexu ne treba 4 A zapisa:
  `ALIAS (prazan host) → bisclay.github.io` + `CNAME www → bisclay.github.io`.
  Detalji i upozorenje o redirect petlji (ako se odabere `www` kao kanonska
  adresa): `dns/README.md`.

**Naslovnica postala uredljiva.** Tekstovi s početne (`index.astro`) bili su hardkodirani,
pa ih CMS nije vidio. Izdvojeni su u `src/data/pocetna.json` i u `.pages.yml` kao
`type: file` pod imenom **Početna stranica** (14 polja: nadnaslov, naslov, uvodni tekst,
ova velika slika, tekstovi gumba, naslov izbora radova, dva bloka na dnu).

- `heroSlika` je opcionalna — ako je prazna, prikazuje se fotografija prvog
  istaknutog rada, kao i prije.
- Ciljevi gumba (galerija / kontakt / o meni) su **fiksni** — uredljiv je samo
  natpis, da se ne može slomiti navigacija.
- `Stranice` (O meni, Kontakt) su i prije bile uredljive; nedostajala je samo naslovnica.
- Provjereno: skup polja u `.pages.yml` i ključeva u JSON-u se poklapa 1:1;
  smoke test (promjena naslova → rebuild → `grep` u `dist/index.html`) prolazi.

**Portfolio mod umjesto prodaje (2026-11-17).** Stranica se sada predstavlja kao portfolio,
ne kao dućan. Skela za prodaju je ostala netaknuta — jedno polje i jedan prekidač.

- `prikaziCijene` → preimenovano u **`prodaja`** (`src/data/site.json`), jer više ne
  skriva samo cijene: to je glavni prekidač cijelog komercijalnog sloja.
- Kad je `prodaja: false` (sada), skriveno je: cijena na karticama i na stranici rada,
napomena o PDV-u, gumbi "Zanima me ovaj rad" / "Pitaj za sličan rad", redak
  "Status: Dostupno", brojač "Trenutno dostupno" na naslovnici. Iznad naslova rada
  umjesto statusa stoji godina. Ostaje jedan neutralni gumb **Kontakt**.
- Prepisan copy: naslovnica (`gumb2` "Naruči ili pitaj" → "Kontakt"; blok "Kako kupiti"
  → "Posjet radionici"), `kontakt.md` (nema više "Kako naručiti", "Dostava",
  "Po narudžbi"), `salica-riton.md` (nema "može se naručiti"), meta opis galerije.
- Značka **Prodano** na karticama ostaje — to je činjenica o radu, ne ponuda.
- Provjereno: build u portfolio modu → grep po `dist/` ne nalazi ni jednu prodajnu
  frazu; build s `prodaja: true` vraća cijene (`120 €`), PDV napomenu, status i gumbe.

## Otvoreno / sljedeće

- [x] Push u organizaciju, uključiti Pages (source: GitHub Actions)
- [ ] DNS A/AAAA zapisi za apex + `www` CNAME (Namecheap → Advanced DNS)
- [ ] Uključiti **Enforce HTTPS** nakon izdavanja certifikata
- [ ] Pages CMS: GitHub App na **samo** `bisclay` repo, pozvati mamu mailom
- [ ] Zamijeniti tekst na početnoj i "O meni" stvarnim tekstom
- [ ] Odlučiti je li potreban engleski (trenutno samo hrvatski)
- [ ] Kad krene prodaja: Stripe Payment Links + provjera PDV praga

## Napomene

- Slike idu u `public/uploads/` i poslužuju se neoptimizirane — namjerno, da build
  ne pada zbog krive putanje koju je CMS upisao. Cijena: veće slike, zato `npm run optimize`.
- Shema se mora mijenjati na dva mjesta: `src/content.config.ts` **i** `.pages.yml`.
