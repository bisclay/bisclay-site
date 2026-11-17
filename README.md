# BisClay

Statična stranica za keramički portfolio — **bisclay.com**.

- **Generator:** [Astro](https://astro.build) (potpuno statičan HTML/CSS)
- **Hosting:** GitHub Pages preko GitHub Actions
- **Uređivanje:** [Pages CMS](https://app.pagescms.org) — mama uređuje sadržaj kroz web sučelje, bez Gita
- **Webshop:** za sada nema. Model podataka već ima `cijena` i `status`, pa se Stripe Payment Links mogu dodati bez preslagivanja.
- **Cijene:** skrivene dok je `prikaziCijene: false` u `src/data/site.json`. Uključuje se jednim prekidačem u CMS-u (**Postavke stranice → Prikaži cijene**). Cijene u radovima ostaju zapisane, samo se ne prikazuju.

---

## Kako je složeno

```
src/
├─ content/
│  ├─ radovi/          # jedan .md po keramičkom radu
│  └─ stranice/        # o-meni.md, kontakt.md
├─ data/site.json      # naziv, email, instagram — uređuje se u CMS-u
├─ pages/              # rute: /, /galerija/, /rad/<slug>/, /o-meni/, /kontakt/
├─ components/         # Header, Footer, PieceCard
├─ layouts/Base.astro  # <head>, meta, OG tagovi
├─ lib/radovi.ts       # sortiranje + formatiranje cijene
└─ content.config.ts   # zod shema — MORA biti usklađena s .pages.yml

public/
├─ CNAME               # bisclay.com
└─ uploads/            # fotografije (ovdje piše Pages CMS)
```

**Pravilo:** `src/content.config.ts` i `.pages.yml` opisuju isti model. Kad dodaš polje u jedno, dodaj ga i u drugo — inače CMS i build neće govoriti isto.

## Lokalni razvoj

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # generira dist/
npm run preview  # pregled produkcijskog builda
npm run optimize # smanji fotografije u public/uploads/ na WebP
```

## Prvo postavljanje (jednom)

1. **Napravi repozitorij** u organizaciji i pushaj ovo:

   ```bash
   git init -b main
   git add -A
   git commit -m "Initial BisClay site"
   git remote add origin git@github.com:<org>/bisclay.git
   git push -u origin main
   ```

2. **Repozitorij mora biti javan** (public) — GitHub Pages na besplatnom planu ne radi s privatnim repozitorijima.

3. **GitHub → repo → Settings → Pages → Source: GitHub Actions.**
   Workflow `.github/workflows/deploy.yml` se sam pokrene na svaki push.

4. **DNS za bisclay.com** (kod registrara):

   | Tip | Ime | Vrijednost |
   |-----|-----|-----------|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | AAAA | `@` | `2606:50c0:8000::153` |
   | AAAA | `@` | `2606:50c0:8001::153` |
   | AAAA | `@` | `2606:50c0:8002::153` |
   | AAAA | `@` | `2606:50c0:8003::153` |
   | CNAME | `www` | `<org>.github.io` |

   Zatim u Pages postavkama upiši `bisclay.com` i uključi **Enforce HTTPS**.
   `public/CNAME` već sadrži domenu, pa je GitHub neće izgubiti pri svakom deployu.

5. **Pages CMS:**
   - `app.pagescms.org` → prijava GitHubom → instaliraj GitHub App na organizaciju,
     **Only select repositories → bisclay** (ne "All repositories").
   - Otvori repozitorij; `.pages.yml` je već tu pa nema što konfigurirati.
   - **Collaborators → Invite** → mamin email.
     → Mama **ne treba GitHub račun**, ne treba 2FA, i ne vidi ostale repozitorije.
     Može uređivati sadržaj i medije, ali ne `.pages.yml` ni popis suradnika.

## Svakodnevni rad (uputa za mamu)

1. Otvori `app.pagescms.org` (može kao prečac na početnom ekranu).
2. **Radovi → New** — naziv, glavna fotografija, status, cijena, opis.
3. **Save.** Stranica se sama objavi za minutu-dvije.
4. Kad se rad proda: promijeni status u **Prodano** — rad ostaje u galeriji (samo dobije značku), ne briše se. Stranica služi i kao portfolio.

Cijene se uključuju/isključuju u **Postavke stranice → Prikaži cijene**. Dok je isključeno, cijene se ne prikazuju nigdje — radovi se nude "na upit" kroz gumb za kontakt.

Fotografije: najbolje svjetlo je dnevno, pored prozora, bez blica. Telefon je dovoljan.
Ako se nakupi velikih slika, pokreni `npm run optimize`.

## Webshop kasnije

1. **Stripe Payment Links** — jedan link po radu, polje `stripe_link` u frontmatteru,
   gumb "Kupi" na stranici rada. Bez košarice, bez backenda, radi na GitHub Pages.
2. **Snipcart** — ako treba prava košarica i više komada u narudžbi (naknada ~2%).
3. **Cloudflare Pages + serverless** — ako zatreba webhook, zalihe ili računi.

Za EU prodaju: provjeri prag za PDV s knjigovođom prije prve prodaje; koristi Stripe Tax
umjesto ručnog obračuna.

## Cijene — kako rade

Prekidač je `prikaziCijene` u `src/data/site.json`, uređuje se u CMS-u pod **Postavke stranice**.

| `prikaziCijene` | Ponašanje |
|---|---|
| `false` (sada) | Cijena se ne prikazuje nigdje. Kartice bez cijene, stranica rada bez cijene i bez napomene o PDV-u. Ostaje samo gumb za kontakt. |
| `true` | Cijena se prikazuje na karticama (samo za `dostupno`) i na stranici rada, uz napomenu "PDV uključen". |

Polja `cijena` u `src/content/radovi/*.md` se **ne brišu** kad je prekidač isključen —
popuni ih odmah, a prikaz uključi kad zatreba.

Prodani radovi (`status: prodano`) ostaju u galeriji trajno, kao portfolio. Nemaju
sivilo ni zamućenje — samo značku **Prodano** i prigušen naslov. Nikad ih ne briši;
oni su dokaz rada, ne ostatak.

## Napomene

- Slike se poslužuju kako su uploadane (bez build-time optimizacije) da se build **ne može
  pokvariti** krivom putanjom. Zato povremeno `npm run optimize`.
- Ako build padne, provjeri Actions log — najčešće je uzrok polje koje nedostaje
  (npr. `naslovnica`) ili `status` koji nije `dostupno` / `rezervirano` / `prodano`.
