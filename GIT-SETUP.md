# 📦 Setup Git untuk Vercel - Step by Step

## Situasi Saat Ini
- ✅ Git sudah ter-install dan ter-init
- ✅ Ada remote `gitsafe-backup` (backup lokal)
- ❌ Belum ada remote GitHub/GitLab (untuk Vercel)

---

## Langkah 1: Buat Repository di GitHub

1. Buka [github.com](https://github.com)
2. Login ke akun GitHub
3. Klik **"+"** (kanan atas) → **"New repository"**
4. Isi:
   - **Repository name:** `novea` (atau nama lain)
   - **Description:** (opsional)
   - **Visibility:** Public atau Private (terserah)
   - ❌ **JANGAN** centang "Initialize with README"
5. Klik **"Create repository"**

**Catatan URL repository:**
- Contoh: `https://github.com/username/novea.git`
- Atau: `git@github.com:username/novea.git`

---

## Langkah 2: Add Remote GitHub

Buka terminal di folder project (`D:\Novea`) dan jalankan:

```bash
# Ganti USERNAME dan REPO_NAME dengan milik lo
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Atau pakai SSH (jika sudah setup SSH key):
# git remote add origin git@github.com:USERNAME/REPO_NAME.git
```

**Contoh:**
```bash
git remote add origin https://github.com/johndoe/novea.git
```

**Cek apakah sudah benar:**
```bash
git remote -v
```

Harus muncul:
```
gitsafe-backup    git://gitsafe:5418/backup.git (fetch)
gitsafe-backup    git://gitsafe:5418/backup.git (push)
origin            https://github.com/USERNAME/REPO_NAME.git (fetch)
origin            https://github.com/USERNAME/REPO_NAME.git (push)
```

---

## Langkah 3: Add & Commit File

**Add semua file yang penting:**

```bash
# Add file konfigurasi Vercel
git add vercel.json
git add .well-known/

# Add file build script yang sudah di-update
git add scripts/build.js

# Add file dokumentasi (opsional)
git add VERCEL-DEPLOY.md
git add DEPLOYMENT.md

# Atau add semua file sekaligus:
git add .
```

**Commit:**
```bash
git commit -m "Prepare for Vercel deployment with deep linking support"
```

---

## Langkah 4: Push ke GitHub

**Push pertama kali:**
```bash
git push -u origin main
```

**Jika branch lo bukan `main` (misalnya `master`):**
```bash
git push -u origin master
```

**Jika ada error "remote has unrelated histories":**
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## Langkah 5: Verify di GitHub

1. Buka repository di GitHub
2. Pastikan file-file ini ada:
   - ✅ `vercel.json`
   - ✅ `.well-known/` folder
   - ✅ `scripts/build.js`
   - ✅ `package.json`

---

## Langkah 6: Connect ke Vercel

Sekarang lanjut ke **VERCEL-DEPLOY.md** Step 2-3:
1. Login ke Vercel
2. Import project dari GitHub
3. Deploy!

---

## Troubleshooting

### Error: "remote origin already exists"
```bash
# Hapus remote origin yang lama
git remote remove origin

# Add lagi dengan URL yang benar
git remote add origin https://github.com/USERNAME/REPO_NAME.git
```

### Error: "authentication failed"
**Option 1: Pakai Personal Access Token**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Copy token
4. Saat push, masukkan token sebagai password

**Option 2: Setup SSH Key**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add ke GitHub: Settings → SSH and GPG keys → New SSH key
```

### File `.well-known/` tidak muncul di GitHub
Pastikan tidak di-ignore:
```bash
# Cek .gitignore
cat .gitignore | grep well-known

# Jika muncul, hapus dari .gitignore
# File .well-known/ HARUS di-commit untuk deep linking bekerja
```

---

## Quick Command Summary

```bash
# 1. Add remote GitHub
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 2. Add files
git add vercel.json .well-known/ scripts/build.js

# 3. Commit
git commit -m "Prepare for Vercel deployment"

# 4. Push
git push -u origin main
```

**Done!** 🎉

