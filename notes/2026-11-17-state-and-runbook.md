# BisClay — state & runbook (for agent runs)

Last verified: **2026-11-17**. Written for whoever picks this up next — agent or human.
User-facing docs (`README.md`, `dns/README.md`) and all code comments are deliberately
in **Croatian**; this file and future notes are in **English** so agent runs can move fast.

## What this is

A static portfolio for a ceramicist (bisclay.com). Portfolio only — **no selling yet**,
but the whole commercial layer exists behind one boolean so it can be switched on
without a refactor. Astro → static HTML → GitHub Pages. Content edited by a
non-technical person through Pages CMS.

## Live state (verified, not assumed)

| Thing | State |
|---|---|
| Repo | `bisclay/bisclay-site`, **public**, branch `main`, org `bisclay` |
| HEAD | `478d393` — "portfolio mod: skriven prodajni sloj iza prekidača prodaja" |
| Deploy | GitHub Actions (`.github/workflows/deploy.yml`) → Pages. Green. |
| Pages API | `build_type: workflow`, `cname: bisclay.com`, `https_enforced: false` |
| TLS cert | **not issued yet** — `https_certificate: null` |
| Registrar | Porkbun (transferred off Namecheap 2026-11-17) |
| Registry NS | Porkbun (`curitiba/fortaleza/maceio/salvador.ns.porkbun.com`) |
| DNS records | 4×A → `185.199.10[8-1].153`; 4×AAAA → `2606:50c0:800[0-3]::153`; `www` CNAME → `bisclay.github.io` |
| Propagation | **incomplete** — `1.1.1.1` still cached Namecheap NS at time of writing |
| HTTP | `http://bisclay.com` serves the real site (200 + correct `<title>`) |
| HTTPS | fails: GitHub still serves its `*.github.io` cert for our hostname |
| CMS | `app.pagescms.org`, GitHub App installed on this repo only |

### The one remaining blocker

Propagation + Let's Encrypt. Nothing to code. When `https://` starts returning 200:

```bash
gh api -X PUT repos/bisclay/bisclay-site/pages -f https_enforced=true
```

Do **not** set `https_enforced` before the cert exists — it 301s working HTTP into a
failing TLS handshake.

## Layout & where content lives

```
src/content/radovi/*.md      one file per piece — filename = entry id = URL slug
src/content/stranice/*.md    O meni, Kontakt (rich text, add more freely)
src/data/site.json           site-wide: name, email, location, `prodaja` switch
src/data/pocetna.json        homepage copy (hero, buttons, two bottom blocks)
src/pages/index.astro        composition only — text comes from pocetna.json
src/pages/rad/[slug].astro   piece detail; gated shop UI lives here
src/components/PieceCard.astro
src/content.config.ts        zod schema  ── keep in sync with ──  .pages.yml
public/uploads/              images, served byte-for-byte
public/CNAME                 bisclay.com (GitHub keeps custom domain across deploys)
dns/                         zone file + Porkbun instructions (Croatian, user-facing)
```

## Invariants — break these and something fails

1. **`src/content.config.ts` and `.pages.yml` describe the same model.** Two places, same
   field names. Add a field to one, add it to the other. `naziv` and `naslovnica` are
   required — a piece without them fails the build (loudly, which is intended).
2. **Filename = URL.** `naziv-vaza.md` → `/rad/naziv-vaza/`. Renaming a file in the CMS
   renames the URL; nothing generates redirects.
3. **Images are NOT processed by Astro.** They sit in `public/uploads/` and are copied
   verbatim into `dist/`. This is deliberate: a path the CMS wrote can only produce a
   broken thumbnail, never a failed deploy that leaves the site silently stale. Cost:
   no responsive variants, no optimization — hence `npm run optimize` (manual, WebP).
   Do not "fix" this by moving to `src/assets` + `image()` unless you also accept that a
   bad CMS write can break the build for a non-technical editor.
4. **`site.json` / `pocetna.json` are `type: file` entries with `format: json`.**
   `settings.content.merge: true` preserves keys not in the schema, so a hand-added key
   won't be destroyed by a CMS save — it just won't be editable.
5. **No user-facing copy in `.astro` files.** If a string is something the ceramicist
   might want to change, it belongs in `site.json` / `pocetna.json` / content markdown.
   This bug already happened once (homepage was hardcoded; CMS couldn't see it).
6. **Never delete a sold piece.** `status: prodano` keeps it in the gallery with a badge,
   full colour, no grayscale. The portfolio *is* the archive.
7. **Croatian** for anything a human reads on the site, in the CMS, or in the README.

## The `prodaja` switch

Single boolean in `src/data/site.json`, exposed as **Postavke stranice → Prodaja uključena**.
It is the master switch for the entire commercial layer:

| `prodaja` | Rendered |
|---|---|
| `false` (current) | No prices, no VAT note, no "Zanima me ovaj rad" / enquiry CTAs, no `Status: Dostupno` row, no "Trenutno dostupno" counter. Eyebrow above a piece title is the **year**. Only a neutral ghost **Kontakt** button. |
| `true` | Price on cards + piece page, VAT note, status badge/row, enquiry + buy CTAs, availability counter. |

`cijena` and `status` stay populated in every piece either way. Verify both directions
after any change here (see below).

## Verification (copy-paste)

```bash
npm run build                       # expect: 8 pages
grep -c "card__price" dist/galerija/index.html        # 0 in portfolio mode

# CMS ⟷ data parity for the homepage
python3 -c "
import yaml, json
d = yaml.safe_load(open('.pages.yml'))
cms = {f['name'] for c in d['content'] if c['name']=='pocetna' for f in c['fields']}
data = set(json.load(open('src/data/pocetna.json')))
print('CMS only:', cms-data or '—'); print('data only:', data-cms or '—')"

# regression: switch shop mode on, build, confirm, revert
# NB: do NOT grep for "120 €" — Intl.NumberFormat('hr-HR') emits a NON-BREAKING space
# (U+00A0) between number and €, so a plain-space pattern silently never matches.
sed -i 's/"prodaja": false/"prodaja": true/' src/data/site.json && npm run build >/dev/null
grep -oE 'card__price">[^<]*<' dist/galerija/index.html      # expect: 120 € / 65 €
grep -oE '(PDV uključen|Zanima me ovaj rad|Trenutno dostupno)' dist/index.html dist/rad/velika-vaza/index.html
sed -i 's/"prodaja": true/"prodaja": false/' src/data/site.json && npm run build >/dev/null
```

Live deploy status: `gh run list -R bisclay/bisclay-site --limit 3`.

## Runbook: GitHub Pages takedown notice

GitHub's Pages terms forbid using it to run *"your online business, e-commerce site, or any
website primarily directed at facilitating commercial transactions"*. Donation and
crowdfunding links are explicitly allowed. **No public case exists of anyone being actioned
for this clause specifically** — enforcement is report-driven and manual, not scanned.
But the mechanics, when it happens for *any* violation, are consistent:

- Email to the **org owner's** account address, then the **repository is disabled
  immediately** (no warning stage). Site down, repo unreadable, not deletable by you.
- Sometimes support offers a time-boxed fix (one documented case: a **3-day window** to
  add a disclaimer / prove the site is static).
- Worst case observed: repo deleted, plus a **"dangerous site" warning on the profile**
  affecting the owner's other repos.
- Recurring failure mode: the email went to a shared mailbox nobody read → repo disabled
  two days later. **Check that the `bisclay` org owner's GitHub email is one you read.**

Mitigations already in place / worth doing:

- Site content is entirely in git; a local clone survives any repo action.
- Mirror if paranoid: `git clone --mirror … && git push --mirror <codeberg/gitlab url>`.
- **Migration to Cloudflare Pages** (below) is the actual remedy — no code change needed.

### Fallback: move hosting to Cloudflare Pages

Repo, CMS, domain all stay. `dist/` is identical static output — this is exactly why the
portfolio/shop switch lives in the app, not in CI.

1. Cloudflare → Workers & Pages → connect `bisclay/bisclay-site`
2. Build command `npm run build`, output dir `dist`, env `NODE_VERSION=22`
3. Add custom domain `bisclay.com` (Cloudflare issues its own cert)
4. Porkbun DNS → `ALIAS`/`CNAME` to `<project>.pages.dev`
5. Remove the now-unused `.github/workflows/deploy.yml` or keep it as a no-op

Why Cloudflare: unlimited static requests / no egress fees, 500 builds/mo, no commercial-use
restriction, 20,000 files and 25 MiB per asset. Avoid **Vercel Hobby** (explicitly
non-commercial) and **Netlify Free** (300 credits/mo ≈ 15 GB, then all sites pause).

## Decisions & why (so they don't get re-litigated)

| Decision | Reasoning |
|---|---|
| Astro | Static output, content collections give a clean schema for the CMS, zero client JS |
| Pages CMS | Hosted git-CMS: **no OAuth proxy to maintain**, unlike Decap/Sveltia on GitHub Pages |
| Email collaborator, not GitHub account | Ceramicist needs no GitHub account, no 2FA; can't touch `.pages.yml` or see other repos |
| Apex canonical (`bisclay.com`) | Shorter form is what gets said aloud; no redirect hop. `www` 301s to it via GitHub |
| A not CNAME at apex | CNAME is illegal at an apex (RFC 1034/2181); Porkbun's ALIAS would also work |
| Byte-for-byte images | Resilience for a non-technical editor > build-time optimization (see invariant 3) |
| GitHub Pages now, Cloudflare when selling | Pages is free and fine for a portfolio; its ToS is the reason to move at shop time |

## Open items

- [ ] Wait for DNS propagation, then flip `https_enforced=true` once the cert lands
- [ ] Replace all placeholder copy (`pocetna.json`, `stranice/*.md`, 3 sample pieces)
- [ ] Point `email` in `site.json` at a real address (`hello@bisclay.com` is a placeholder)
- [ ] Invite the ceramicist as a Pages CMS email collaborator (Settings → Collaborators)
- [ ] Replace `public/uploads/placeholder-*.svg` with real photos
- [ ] When the shop becomes real: Stripe Payment Links (`stripe_link` per piece) + VAT
      threshold check with an accountant; move hosting to Cloudflare before taking payments
- [ ] Bump `withastro/action` eventually — it currently pulls `checkout@v4`/`setup-node@v4`
      which GitHub is migrating off Node 20 (warning in every run, harmless today)
- [ ] Decide on an English version (currently Croatian only) if tourists/galleries matter
