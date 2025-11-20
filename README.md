# 🚀 Novea - Quick Start Guide

## ⚡ IMPORTANT: Start Backend First!

**Before testing signup**, you MUST start the backend server. Here's how:

### Step 1: Open Terminal
- Click "+" next to "Shell" tab in bottom panel
- OR click "Tools → Shell" in top menu

### Step 2: Run This ONE Command
```bash
bash start-backend.sh
```

### Step 3: Wait for This Message
```
🚀 Novea Backend API running on port 3000
📚 Database connected: Yes
```

**That's it!** Now you can test signup. ✅

---

## 🎯 What This Does

- **Frontend (Expo)**: Already running automatically on port 8081
- **Backend (Express)**: You just started it on port 3000

Both need to be running at the same time.

---

## 🐛 Troubleshooting

**"Backend Server Not Running" error when signing up?**
→ Backend not started yet. Run `bash start-backend.sh` in a new terminal.

**Can't find start-backend.sh?**
→ Make sure you're in the project root directory. Run `ls` to check.

**Port 3000 already in use?**
→ Old backend still running. Kill it: `pkill -f "tsx.*server/index.ts"` then restart.

---

## 📚 Full Documentation

- **Backend API**: See [server/README.md](server/README.md)
- **Development Guide**: See [RUN_BACKEND.md](RUN_BACKEND.md)
- **Project Architecture**: See [replit.md](replit.md)

---

## 🎮 Testing the App

1. ✅ Start backend: `bash start-backend.sh`
2. ✅ Frontend auto-starts (already running)
3. ✅ Open app in browser (click "Open website" in Replit)
4. ✅ Try signup with any email/password
5. ✅ Check database: `npx drizzle-kit studio`

---

**Need help?** Check the error message in the app - it will tell you exactly what to do!
