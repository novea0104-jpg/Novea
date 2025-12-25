# 🚀 Import Project ke Vercel - Step by Step

## Prerequisites
- ✅ Akun GitHub sudah ada
- ✅ Repository sudah dibuat di GitHub
- ✅ Code sudah di-push ke GitHub

---

## Step 1: Pastikan Code Sudah di GitHub

**Cek apakah sudah di-push:**
```bash
git push origin main
```

Jika sudah di-push, akan muncul: `Everything up-to-date`

**Jika belum, push dulu:**
```bash
# Add file penting (kalau belum)
git add vercel.json .well-known/ scripts/build.js

# Commit (kalau ada perubahan)
git commit -m "Prepare for Vercel deployment"

# Push ke GitHub
git push origin main
```

---

## Step 2: Login ke Vercel

1. Buka [vercel.com](https://vercel.com)
2. Klik **"Sign Up"** atau **"Log In"**
3. Pilih **"Continue with GitHub"**
4. Authorize Vercel untuk akses GitHub

---

## Step 3: Import Project

1. Di dashboard Vercel, klik **"Add New..."** → **"Project"**
2. Akan muncul list repository GitHub lo
3. **Cari repository Novea** (yang tadi lo buat)
4. Klik **"Import"** di repository tersebut

---

## Step 4: Configure Project

Vercel akan auto-detect dari `vercel.json`, tapi **PASTIKAN**:

### Build Settings:
- **Framework Preset:** `Other` (atau biarkan auto-detect)
- **Root Directory:** `./` (default)
- **Build Command:** 
  ```
  DEPLOYMENT_URL=https://noveaindonesia.com node scripts/build.js
  ```
- **Output Directory:** `static-build`
- **Install Command:** `npm install`

**Atau biarkan Vercel auto-detect dari `vercel.json`** (lebih mudah!)

---

## Step 5: Environment Variables

**Klik "Environment Variables"** dan tambahkan:

| Name | Value | Environment |
|------|-------|-------------|
| `DEPLOYMENT_URL` | `https://noveaindonesia.com` | Production, Preview, Development |

**Note:** 
- Jika belum punya domain, bisa skip dulu atau pakai domain Vercel sementara
- Nanti bisa update setelah domain ready

---

## Step 6: Deploy!

1. Scroll ke bawah
2. Klik **"Deploy"**
3. Tunggu build process (biasanya 2-5 menit)

**Build akan:**
- Install dependencies (`npm install`)
- Run build script (`node scripts/build.js`)
- Generate static files di `static-build/`
- Deploy ke Vercel CDN

---

## Step 7: Cek Hasil

Setelah deploy selesai:

1. **Dapat URL preview:** `https://novea-xxx.vercel.app`
2. **Buka URL** dan test apakah website muncul
3. **Cek build logs** jika ada error

---

## Step 8: Setup Custom Domain (noveaindonesia.com)

### 8.1. Di Vercel Dashboard:
1. Buka project → **Settings** → **Domains**
2. Klik **"Add Domain"**
3. Masukkan: `noveaindonesia.com`
4. Klik **"Add"**

### 8.2. Vercel akan kasih instruksi DNS:

**Biasanya seperti ini:**

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**Option B: A Record**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Untuk www:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 8.3. Update DNS di Domain Provider:
1. Login ke provider domain (GoDaddy, Namecheap, dll)
2. Buka DNS Management
3. Tambahkan records sesuai instruksi Vercel
4. **Save**

### 8.4. Tunggu DNS Propagate:
- Biasanya 5-30 menit
- Bisa cek dengan: `nslookup noveaindonesia.com`
- Vercel akan otomatis setup SSL setelah DNS verified

---

## Step 9: Update Environment Variable

Setelah domain aktif:

1. Buka project → **Settings** → **Environment Variables**
2. Update `DEPLOYMENT_URL` ke: `https://noveaindonesia.com`
3. **Redeploy** project (Settings → Deployments → ... → Redeploy)

---

## Step 10: Verify Deep Links

Test file `.well-known`:

```bash
# Test iOS
curl https://noveaindonesia.com/.well-known/apple-app-site-association

# Test Android  
curl https://noveaindonesia.com/.well-known/assetlinks.json
```

**Pastikan:**
- ✅ Content-Type: `application/json`
- ✅ File bisa diakses
- ✅ Content sesuai (Team ID dan SHA256 sudah diisi)

---

## Troubleshooting

### Build Fails: "Metro timeout"
**Penyebab:** Build script butuh Metro bundler running
**Solusi:** 
- Pastikan Node.js 18+ di Vercel
- Cek build logs untuk detail error
- Build script sudah di-optimize untuk Vercel

### Build Fails: "DEPLOYMENT_URL not set"
**Solusi:**
- Tambahkan environment variable `DEPLOYMENT_URL`
- Atau build script akan pakai fallback: `https://noveaindonesia.com`

### Domain Not Working
1. Cek DNS records sudah benar
2. Tunggu 24-48 jam untuk DNS propagate
3. Test dengan: `nslookup noveaindonesia.com`
4. Pastikan SSL certificate sudah aktif (auto dari Vercel)

### File `.well-known/` Not Found
**Penyebab:** File tidak ter-upload
**Solusi:**
- Pastikan folder `.well-known/` di-commit ke Git
- Cek di GitHub apakah folder ada
- Rebuild di Vercel

---

## Auto-Deploy

Setelah setup pertama kali:
- ✅ Setiap push ke `main` branch = auto deploy
- ✅ Preview deployments untuk setiap PR
- ✅ Rollback ke deployment sebelumnya dengan 1 klik

---

## Next Steps

1. ✅ Setup domain di Vercel
2. ✅ Update environment variable
3. ✅ Test deep links
4. ✅ Monitor deployment di Vercel dashboard

**Done!** 🎉

