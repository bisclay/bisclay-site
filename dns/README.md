# DNS za bisclay.com

Kratka verzija: **ne treba ti svih 8 IP-eva, ali na apexu ne možeš imati CNAME.**
Objašnjenje je niže, a gotova datoteka je [`bisclay.com.zone`](./bisclay.com.zone).

## Zašto `blog.oreskovic.me` ima samo CNAME, a `bisclay.com` ne može

Provjereno na tvom vlastitom DNS-u:

```
blog.oreskovic.me  CNAME  oresk.github.io.     ← poddomena
oreskovic.me       (ništa — nema A, AAAA ni CNAME)  ← apex
```

Razlika nije u GitHubu, nego u tome što `blog.` **je poddomena**, a `bisclay.com`
**je vrh (apex)**.

- Na **poddomeni** je `CNAME` normalan i dozvoljen. Razrješava se tako da resolver
  ode po `oresk.github.io` i vrati njegova 4 A i 4 AAAA zapisa. Isti IP-evi,
  samo ih ne moraš pisati — sakriveni su iza CNAME-a.
- Na **apexu** CNAME nije dozvoljen (RFC 1034 §3.6.2 / RFC 2181 §10.1): apex
  obavezno nosi `SOA` i `NS` zapise, a CNAME ne smije koegzistirati ni s čim
  drugim. Zato GitHub za apex traži `ALIAS`, `ANAME` ili `A` zapise.

I pokus je to potvrdio: kad sam u zone file stavio `SOA` + `NS` + `CNAME` na `@`,
parser ga odbija s *"CNAME rdataset is not compatible with a regular data node"*.
Takva zona se ne može ni napisati, a kamoli poslužiti.

Registrar može to zaobići samo ako podržava **ALIAS/ANAME** (Porkbun, DNSimple)
ili **CNAME flattening** (Cloudflare). Namecheap BasicDNS ne podržava ni jedno.

## Tri varijante — odaberi jednu

### A. Apex + A/AAAA (trenutno postavljeno, `dns/bisclay.com.zone`)

Stranica živi na `https://bisclay.com`. Radi na Namecheapu bez ikakvih dodatnih
usluga. **Ovo je ono što je već konfigurirano na GitHubu** (`cname=bisclay.com`).

| Tip | Host | Vrijednost |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `bisclay.github.io` |

**Može li manje?** Može, i to je legitimno:

- **AAAA (4 zapisa) — slobodno izbriši.** GitHub ih sam navodi kao *"you can also
  create AAAA records for IPv6 support"*. Bez njih stranica radi normalno, samo
  nema IPv6.
- **A zapisi — 1 je dovoljan, 4 su preporuka.** GitHub objavljuje 4 front-end
  adrese za redundanciju. S jednom adresom stranica radi, ali ako taj front-end
  ima problem, tvoja stranica je nedostupna. 4 retka koštaju ništa — ostavi ih.

Minimum koji stvarno radi: `1 × A` + `www CNAME`. Preporuka: `4 × A` + `www CNAME`
(bez AAAA). Ovo je i ono što pokazuje `dig` na `blog.oreskovic.me` — CNAME se
razriješi u točno ta 4 A i 4 AAAA zapisa.

### B. Prelazak na Cloudflare — jedan zapis za apex

Ako želiš "samo CNAME", jedini način je DNS provider koji flattena. Cloudflare
to radi besplatno, ali **apex CNAME se unosi kroz sučelje, ne zone fileom** —
upravo zato što takav zone file nije legalan (vidi gore).

1. Namecheap → Domain List → **Nameservers** → *Custom DNS* → Cloudflare NS
2. Cloudflare → **DNS → Records** → dodaj dva zapisa:

   | Type | Name | Target | Proxy |
   |---|---|---|---|
   | CNAME | `@` | `bisclay.github.io` | DNS only |
   | CNAME | `www` | `bisclay.github.io` | DNS only |

3. Cloudflare ih automatski flattena u A/AAAA na rubu.

Cijena: seliš nameservere i ovisiš o još jednom servisu. Dobitak: jedan zapis,
brži DNS, i lakši prelazak na Cloudflare Pages ako jednog dana zatreba backend
za webshop.

### C. Kanonska domena `www`, apex preusmjerava

Ako ti je draže da `www.bisclay.com` bude glavna adresa (kao `blog.` na drugim
domenama), onda treba:

| Tip | Host | Vrijednost |
|---|---|---|
| CNAME | `www` | `bisclay.github.io` |
| URL Redirect | `@` | `https://www.bisclay.com` |

Ali tada **mijenja i repo**: `public/CNAME` → `www.bisclay.com` i Pages postavka
`cname` → `www.bisclay.com`. Bez toga GitHub i dalje misli da je kanonska adresa
apex i vrti redirect u krivom smjeru. Reci ako želiš ovu varijantu — promjena je
dvije linije.

## Provjera nakon unosa

```bash
dig +short A bisclay.com          # očekuješ 4 × 185.199.10x.153
dig +short AAAA bisclay.com       # 4 × 2606:50c0:...
dig +short CNAME www.bisclay.com  # bisclay.github.io.
```

Kad se pojave GitHubove adrese: Settings → Pages → **Enforce HTTPS**.
Certifikat GitHub izda sam, obično unutar 15 minuta od ispravnog DNS-a.

## Što ne dirati

- **Parking zapise**: Namecheap default `A @ → 162.255.119.154` i
  `www CNAME → parkingpage.namecheap.com` — oba moraju nestati, inače se
  miješaju s GitHubovima.
- **MX / TXT / SPF zapise** ako ih imaš za e-mail — ne diraju web, ostavi ih.
- **Wildcard `*` zapise** — GitHub ih izričito odvjetuje (rizik od preuzimanja
  poddomene).
- Ako GitHub u Settings → Pages zatraži **verifikaciju domene**, traži
  `_github-pages-challenge-bisclay` TXT zapis. Vrijednost prepiši točno kako
  GitHub prikaže — ne izmišljaj je.
