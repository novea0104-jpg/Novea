# 🚀 Deploy ke Vercel - Step by Step

## Prerequisites
- Akun GitHub/GitLab/Bitbucket (untuk connect ke Vercel)
- Code sudah di-push ke repository
- Domain `noveaindonesia.com` (opsional, bisa pakai Vercel domain dulu)

---

## Step 1: Push Code ke Git

Pastikan semua file sudah di-commit dan push:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

**File penting yang harus ada:**
- ✅ `vercel.json`
- ✅ `scripts/build.js`
- ✅ `.well-known/` folder
- ✅ `package.json`

---

## Step 2: Login ke Vercel

1. Buka [vercel.com](https://vercel.com)
2. Klik **"Sign Up"** atau **"Log In"**
3. Pilih **"Continue with GitHub"** (atau GitLab/Bitbucket)

---

## Step 3: Import Project

1. Di dashboard Vercel, klik **"Add New..."** → **"Project"**
2. Pilih repository yang berisi code Novea
3. Klik **"Import"**

---

## Step 4: Configure Project

Vercel akan auto-detect dari `vercel.json`, tapi pastikan:

### Build Settings:
- **Framework Preset:** Other
- **Build Command:** `DEPLOYMENT_URL=https://noveaindonesia.com node scripts/build.js`
- **Output Directory:** `static-build`
- **Install Command:** `npm install`

### Environment Variables:
Klik **"Environment Variables"** dan tambahkan:

| Name | Value |
|------|-------|
| `DEPLOYMENT_URL` | `https://noveaindonesia.com` |

**Note:** Jika belum punya domain, bisa skip dulu. Nanti bisa update setelah domain ready.

---

## Step 5: Deploy!

1. Klik **"Deploy"**
2. Tunggu build process (biasanya 2-5 menit)
3. Setelah selesai, dapat URL preview: `https://novea-xxx.vercel.app`

---

## Step 6: Setup Custom Domain (noveaindonesia.com)

### 6.1. Di Vercel Dashboard:
1. Buka project → **Settings** → **Domains**
2. Klik **"Add Domain"**
3. Masukkan: `noveaindonesia.com`
4. Klik **"Add"**

### 6.2. Setup DNS Records:

Vercel akan kasih instruksi DNS. Biasanya:

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

### 6.3. Update DNS di Domain Provider:
1. Login ke provider domain (GoDaddy, Namecheap, dll)
2. Buka DNS Management
3. Tambahkan records sesuai instruksi Vercel
4. Tunggu 24-48 jam untuk propagate

### 6.4. SSL Certificate:
Vercel akan otomatis setup SSL (Let's Encrypt) setelah DNS verified.

---

## Step 7: Update Environment Variable

Setelah domain aktif:

1. Buka project → **Settings** → **Environment Variables**
2. Update `DEPLOYMENT_URL` ke: `https://noveaindonesia.com`
3. Redeploy project

---

## Step 8: Verify Deep Links

Test file `.well-known`:

```bash
# Test iOS
curl https://noveaindonesia.com/.well-known/apple-app-site-association

# Test Android
curl https://noveaindonesia.com/.well-known/assetlinks.json
```

Pastikan:
- ✅ Content-Type: `application/json`
- ✅ File bisa diakses
- ✅ Content sesuai (Team ID dan SHA256 sudah diisi)

---

## Troubleshooting

### Build Fails:
**Error: Metro timeout**
- Build script butuh Metro bundler running
- Pastikan Node.js 18+ di Vercel
- Cek build logs di Vercel dashboard

**Error: DEPLOYMENT_URL not set**
- Tambahkan environment variable di Vercel
- Atau build script akan pakai fallback: `https://noveaindonesia.com`

### Deep Links Not Working:
1. Pastikan file `.well-known/` ter-upload
2. Test dengan curl (lihat Step 8)
3. Pastikan Content-Type header benar
4. Pastikan Team ID (iOS) dan SHA256 (Android) sudah diisi

### Domain Not Working:
1. Cek DNS records sudah benar
2. Tunggu 24-48 jam untuk DNS propagate
3. Test dengan: `nslookup noveaindonesia.com`
4. Pastikan SSL certificate sudah aktif (auto dari Vercel)

---

## Auto-Deploy dari Git

Setelah setup pertama kali:
- ✅ Setiap push ke `main` branch = auto deploy
- ✅ Preview deployments untuk setiap PR
- ✅ Rollback ke deployment sebelumnya dengan 1 klik

---

## Cost

**Vercel Free Tier:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ SSL certificates
- ✅ CDN global

**Upgrade jika:**
- Traffic > 100GB/month
- Butuh team collaboration
- Butuh analytics advanced

---

## Next Steps

1. ✅ Setup domain di Vercel
2. ✅ Update environment variable
3. ✅ Test deep links
4. ✅ Monitor deployment di Vercel dashboard

**Done!** 🎉

