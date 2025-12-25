# 🔧 Solusi: Pre-Build Lokal untuk Vercel

## Masalah
Build di Vercel gagal karena Metro bundler timeout. Metro butuh environment yang lebih kompleks.

## Solusi: Pre-Build Lokal
Build `static-build/` di local, commit ke Git, lalu Vercel hanya serve static files (tanpa build).

---

## Step 1: Build Lokal

Jalankan di terminal (folder `D:\Novea`):

```bash
# Set deployment URL
$env:DEPLOYMENT_URL="https://noveaindonesia.com"

# Run build script
node scripts/build.js
```

**Atau di PowerShell:**
```powershell
$env:DEPLOYMENT_URL="https://noveaindonesia.com"
node scripts/build.js
```

**Tunggu sampai selesai** (biasanya 2-5 menit)

---

## Step 2: Commit static-build/

Setelah build selesai:

```bash
# Add static-build folder
git add static-build/

# Commit
git commit -m "Add pre-built static files for Vercel deployment"

# Push
git push origin main
```

---

## Step 3: Update vercel.json

Ubah `vercel.json` untuk skip build (karena sudah pre-built):

```json
{
  "outputDirectory": "static-build",
  "buildCommand": "echo 'Using pre-built files'",
  "installCommand": "echo 'Skipping install'",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/.well-known/apple-app-site-association",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    {
      "source": "/.well-known/assetlinks.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/json"
        }
      ]
    }
  ]
}
```

---

## Step 4: Deploy ke Vercel

1. Push perubahan ke GitHub
2. Vercel akan auto-deploy
3. Kali ini akan cepat karena hanya serve static files (tanpa build)

---

## Update Build (Setelah Ada Perubahan Code)

Setiap kali ada perubahan code:

1. **Build lokal:**
   ```bash
   $env:DEPLOYMENT_URL="https://noveaindonesia.com"
   node scripts/build.js
   ```

2. **Commit & Push:**
   ```bash
   git add static-build/
   git commit -m "Update static build"
   git push origin main
   ```

3. **Vercel auto-deploy** (cepat, tanpa build)

---

## Keuntungan

- ✅ Tidak perlu build di Vercel (lebih cepat)
- ✅ Tidak ada Metro timeout issue
- ✅ Build di environment yang kita kontrol
- ✅ Deploy lebih reliable

## Kekurangan

- ❌ Harus build manual setiap ada perubahan
- ❌ Folder `static-build/` akan besar (tapi bisa di-optimize dengan .gitignore untuk file lama)

---

## Alternatif: Auto-Build dengan GitHub Actions

Jika mau otomatis, bisa setup GitHub Actions untuk:
1. Auto-build saat push ke `main`
2. Auto-commit `static-build/` ke branch `gh-pages` atau branch lain
3. Vercel deploy dari branch tersebut

Tapi untuk sekarang, pre-build lokal lebih simple dan cepat!

