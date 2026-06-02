# CakeTopper Studio

Editor web pentru cake toppers tăiate cu laser. Clienții își proiectează topperul, tu descarci SVG-ul gata pentru LightBurn.

## Stack

- **Next.js 15** (App Router) + TypeScript strict
- **Prisma** + SQLite (dev) → PostgreSQL (prod)
- **react-konva** — editor canvas
- **opentype.js** — text → path-uri SVG (obligatoriu pentru laser)
- **Tailwind CSS v3**
- **JWT** (jose) — autentificare admin

---

## Instalare și pornire locală

```bash
# 1. Clonează și instalează dependențele
git clone <repo>
cd cake-topper
npm install

# 2. Configurează variabilele de mediu
cp .env.example .env.local
# Editează .env.local dacă vrei email/parolă admin diferite

# 3. Creează baza de date și populează cu date demo
npx prisma db push
tsx prisma/seed.ts

# SAU un singur comandă pentru pașii 1-3:
npm run setup

# 4. Pornește serverul de dezvoltare
npm run dev
```

Aplicația rulează la **http://localhost:3000**

---

## Conturi demo (după seed)

| Rol   | Email                  | Parolă     |
|-------|------------------------|------------|
| Admin | admin@caketopper.ro    | admin1234  |

**Schimbă parola după primul login** din Setări → Cont.

---

## Structura URL-urilor

| URL                  | Descriere                        |
|----------------------|----------------------------------|
| `/`                  | Redirect → `/editor`             |
| `/editor`            | Editorul public pentru clienți   |
| `/admin/login`       | Login admin                      |
| `/admin/orders`      | Lista comenzilor                 |
| `/admin/fonts`       | Upload și gestionare fonturi     |
| `/admin/shapes`      | Activare/dezactivare forme       |
| `/admin/settings`    | Setări planșă, branding          |

---

## Variabile de mediu

| Variabilă              | Dev (default)                    | Prod                                |
|------------------------|----------------------------------|-------------------------------------|
| `DATABASE_URL`         | `file:./dev.db`                  | `postgresql://...`                  |
| `JWT_SECRET`           | dev string                       | `openssl rand -base64 32`           |
| `ADMIN_EMAIL`          | admin@caketopper.ro              | emailul tău                         |
| `ADMIN_PASSWORD`       | admin1234                        | parolă puternică                    |
| `STORAGE_PROVIDER`     | `local`                          | `s3`                                |
| `UPLOADS_DIR`          | `./uploads`                      | —                                   |
| `S3_ENDPOINT`          | —                                | URL Cloudflare R2                   |
| `S3_BUCKET`            | —                                | numele bucket-ului                  |
| `S3_ACCESS_KEY`        | —                                | R2 access key                       |
| `S3_SECRET_KEY`        | —                                | R2 secret key                       |
| `S3_PUBLIC_URL`        | —                                | URL public R2                       |
| `NEXT_PUBLIC_APP_URL`  | `http://localhost:3000`          | `https://domeniultau.ro`            |

---

## Comenzi utile

```bash
npm run dev          # server dev cu hot reload
npm run build        # build de producție
npm run start        # pornește build-ul de producție

npx prisma db push   # aplică schema (dev, fără migrații)
npx prisma migrate dev --name <nume>  # migrație cu istoric (recomandat la prod)
tsx prisma/seed.ts   # re-populează datele demo
npx prisma studio    # UI vizual pentru baza de date
```

---

## Migrare pe PostgreSQL (producție)

1. În `prisma/schema.prisma` schimbă `provider = "sqlite"` → `"postgresql"`
2. Actualizează `DATABASE_URL` în `.env.local` (sau variabile Vercel/Railway)
3. Rulează `npx prisma migrate deploy`

---

## Checklist LightBurn (după primul export SVG)

- [ ] Import SVG → dimensiunile afișate = dimensiunile din editor (fără rescalare)
- [ ] Toate contururile sunt pe layer-ul roșu (`#FF0000`), stroke vizibil, fill none
- [ ] Zero elemente `<text>` în panoul Layers (totul convertit în path-uri)
- [ ] Literele care se ating + tija formează o piesă unitară (weld corect)
- [ ] Caractere românești (ăâîșț) complete, fără glyph-uri lipsă
- [ ] Simulare: capul laserului nu sare între bucăți izolate nenecesare

---

## Deployment pe Vercel + Neon + Cloudflare R2

```bash
# 1. Push pe GitHub
# 2. Conectează repo-ul în Vercel
# 3. Setează variabilele de mediu în Vercel Dashboard
# 4. Schimbă provider în schema.prisma pe "postgresql"
# 5. Rulează npx prisma migrate deploy (din CI sau local cu DATABASE_URL de prod)
```
