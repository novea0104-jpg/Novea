# Deployment Guide - Pindah Hosting dari Replit

## Opsi Hosting

### 1. Vercel (Recommended)
**Keuntungan:**
- Gratis untuk proyek kecil
- Auto-deploy dari Git
- CDN global
- Mudah setup

**Cara Deploy:**
1. Push code ke GitHub/GitLab
2. Login ke [Vercel](https://vercel.com)
3. Import project dari Git
4. Set environment variable: `DEPLOYMENT_URL=https://noveaindonesia.com`
5. Deploy!

**File yang sudah disiapkan:**
- `vercel.json` - Konfigurasi Vercel

---

### 2. Netlify
**Keuntungan:**
- Gratis tier
- Auto-deploy dari Git
- Form handling built-in

**Cara Deploy:**
1. Push code ke GitHub/GitLab
2. Login ke [Netlify](https://netlify.com)
3. Import project dari Git
4. Set environment variable: `DEPLOYMENT_URL=https://noveaindonesia.com`
5. Deploy!

**File yang sudah disiapkan:**
- `netlify.toml` - Konfigurasi Netlify

---

### 3. Cloudflare Pages
**Keuntungan:**
- Gratis unlimited
- CDN super cepat
- Auto-deploy dari Git

**Cara Deploy:**
1. Push code ke GitHub/GitLab
2. Login ke [Cloudflare Pages](https://pages.cloudflare.com)
3. Connect repository
4. Build command: `node scripts/build.js`
5. Build output: `static-build`
6. Set environment variable: `DEPLOYMENT_URL=https://noveaindonesia.com`

---

### 4. Hosting Sendiri (VPS/Shared Hosting)
**Cara Deploy:**
1. Build lokal:
   ```bash
   DEPLOYMENT_URL=https://noveaindonesia.com node scripts/build.js
   ```
2. Upload seluruh isi folder `static-build/` ke hosting
3. Pastikan folder `.well-known/` ikut ter-upload
4. Set domain `noveaindonesia.com` ke hosting

---

## Environment Variables

Set environment variable ini di hosting baru:
- `DEPLOYMENT_URL=https://noveaindonesia.com` (opsional, akan pakai fallback jika tidak di-set)

---

## Domain Setup

Setelah deploy, setup domain `noveaindonesia.com`:
1. **DNS Records:**
   - A record atau CNAME pointing ke hosting baru
2. **SSL Certificate:**
   - Vercel/Netlify/Cloudflare: Auto SSL
   - Hosting sendiri: Install Let's Encrypt

---

## File `.well-known` untuk Deep Linking

File sudah otomatis ter-copy ke `static-build/.well-known/` saat build.

**Yang perlu diisi:**
1. `.well-known/apple-app-site-association` - Ganti `TEAM_ID` dengan Apple Team ID
2. `.well-known/assetlinks.json` - Ganti `YOUR_SHA256_FINGERPRINT_HERE` dengan SHA256 fingerprint

---

## Testing Deep Links

Setelah deploy, test:
- iOS: `https://noveaindonesia.com/novel/123` harus buka aplikasi
- Android: `https://noveaindonesia.com/user/456` harus buka aplikasi

---

## Troubleshooting

**Build gagal:**
- Pastikan Node.js 18+ terinstall
- Pastikan semua dependencies terinstall: `npm install`

**Deep link tidak bekerja:**
- Pastikan file `.well-known/` ter-upload
- Pastikan Content-Type header benar (application/json)
- Test dengan: `curl https://noveaindonesia.com/.well-known/apple-app-site-association`

