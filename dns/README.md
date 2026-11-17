# DNS za bisclay.com — Porkbun

Domena je prebačena na **Porkbun**. Do završetka transfera DNS još poslužuje
Namecheap (`dns1/dns2.registrar-servers.com`) i apex još pokazuje na parking
(`162.255.119.154`). Čim Porkbun nameserveri (`ns.porkbun.com`…) preuzmu,
ažuriraj zapise po uputi niže.

Porkbun ima dvije stvari koje Namecheap nije imao: **ALIAS (CNAME flattening)**
i **URL Forwarding**. Zato na apexu više ne moraš pisati 4 A zapisa.

---

## Opcija A — ALIAS na apexu (preporučeno, bez promjena u repou)

Porkbun ALIAS radi kao CNAME koji se razriješi u A/AAAA na njihovom DNS-u, pa
GitHub Pages dobije zahtjev za `bisclay.com` i servira stranicu direktno.
Nema redirecta, nema petlje, nema IP-eva u konfiguraciji.

**Account → Domain Management → bisclay.com → DNS**

| Type | Host | Answer |
|---|---|---|
| ALIAS – CNAME flattening | *(ostavi prazno)* | `bisclay.github.io` |
| CNAME | `www` | `bisclay.github.io` |

Repo ostaje kakav je: `public/CNAME` = `bisclay.com`, Pages `cname` = `bisclay.com`.
Oba imena rade, GitHub sam preusmjeri `www` → apex.

> Host polje u Porkbunu **nikad** ne sadrži ime domene. Za apex je prazno,
> za `www` pišeš samo `www`.

## Opcija B — `www` je glavna adresa, apex forwarda na nju

Ovo je ono što si pitao. Tehnički radi, ali **nužno mijenja i repo** — vidi
upozorenje ispod.

**Account → Domain Management → bisclay.com → URL Forwarding**

- Forward to: `https://www.bisclay.com`
- Type: **Permanent (301)**
- Include path: uključeno (da `/galerija/` ostane `/galerija/`)

**DNS Records**

| Type | Host | Answer |
|---|---|---|
| CNAME | `www` | `bisclay.github.io` |

Obavezno **obriši wildcard `*` zapis** koji Porkbun stvori uz URL Forwarding,
i parking zapise (`pixie.porkbun.com` / A na praznom hostu).

Zatim u repou:

1. `public/CNAME` → `www.bisclay.com`
2. GitHub → Settings → Pages → Custom domain → `www.bisclay.com`

### Zašto je to nužno — petlja preusmjeravanja

GitHub Pages preusmjerava `www` na kanonsku domenu. Dok je kanonska `bisclay.com`:

```
browser → bisclay.com ──301──▶ www.bisclay.com     (Porkbun forwarding)
                    ◀──301── bisclay.com           (GitHub: www → apex)
                    ⟳  ERR_TOO_MANY_REDIRECTS
```

Ako ostaviš Pages na `bisclay.com`, a apex forwardaš na `www`, dobiješ petlju i
stranica se ne otvori. Ili oba mijenjaj, ili (bolje) uzmi opciju A.

---

## Što obrisati prije dodavanja

Porkbun na novo prebačene domene postavi parking zapise:

- `A` na praznom hostu → `pixie.porkbun.com` / Porkbun IP
- `CNAME *` wildcard

Oba moraju nestati s imena koja koristiš, inače Porkbun javi
*"A CNAME or ALIAS record with that host already exists"*. Wildcard ne ostavljaj
ni iz sigurnosnih razloga (preuzimanje poddomena).

**Ne diraj** MX/TXT/SPF zapise ako ih imaš za e-mail — ne utječu na web.

## Provjera

```bash
dig +short A bisclay.com            # ALIAS → GitHubove 185.199.10x.153
dig +short CNAME www.bisclay.com    # bisclay.github.io.
curl -sI https://bisclay.com | head -3
```

Kad `dig` pokaže GitHubove adrese: Settings → Pages → **Enforce HTTPS**.
Certifikat GitHub izda sam, obično unutar 15–60 minuta od ispravnog DNS-a.
Ako GitHub u Settings → Pages zatraži verifikaciju domene, traži TXT zapis
`_github-pages-challenge-bisclay` — vrijednost prepiši točno kako prikaže.

## Zašto CNAME ne može na apex

RFC 1034 §3.6.2 / RFC 2181 §10.1: apex obavezno nosi `SOA` i `NS`, a CNAME ne
smije koegzistirati ni s jednim drugim zapisom. Zato provjera zone filea s
`SOA` + `NS` + `CNAME` na istom imenu puca s *"CNAME rdataset is not compatible
with a regular data node"*. ALIAS/ANAME/flattening to zaobilaze na razini
providera — zato Porkbun može, a zone file ne može.

Tvoj `blog.oreskovic.me` je zato imao samo CNAME: to je **poddomena**, gdje je
CNAME legalan. `oreskovic.me` (apex) tamo nema web zapisa uopće.

`bisclay.com.zone` u ovom folderu je A-record varijanta — ostaje kao referenca
za providere bez ALIAS-a. Porkbun je ne uvozi (nema import zone filea), pa je
opcija A ionako dvije linije u sučelju.
