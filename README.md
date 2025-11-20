# 🚀 Novea - Digital Novel Reading Platform

**A React Native mobile app for reading and writing digital novels** with coin-based monetization, built with Expo and Supabase.

---

## ✨ Features

- 📚 **Browse & Read Novels** - 5 genres: Romance, Fantasy, Thriller, Mystery, Sci-Fi
- 🆓 **Free + Premium Content** - First 5 chapters free, unlock more with coins
- 💰 **Coin System** - Virtual currency for unlocking premium chapters
- ✍️ **Writer Portal** - Create and publish your own novels (toggle writer mode)
- 🔒 **Secure Authentication** - Email/password signup powered by Supabase Auth
- 📱 **Cross-Platform** - iOS, Android, and Web support

---

## 🎯 Quick Start (Development)

### **Prerequisites**
- Node.js 18+ installed
- Expo Go app on your phone (optional, for testing on device)

### **Setup & Run**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Test the app:**
   - **Web**: Click "Open website" in Replit
   - **Mobile**: Scan QR code with Expo Go app

**That's it!** No backend server needed - everything runs through Supabase! ✅

---

## 🗄️ Tech Stack

### **Frontend**
- **React Native 0.81** with Expo SDK 54
- **React Navigation 7** - Tab + Stack navigation
- **TypeScript** - Type safety
- **AsyncStorage** - Local persistence

### **Backend (Supabase)**
- **PostgreSQL Database** - 7 tables (users, novels, chapters, etc.)
- **Supabase Auth** - Email/password authentication
- **Supabase Client** - Auto-generated REST APIs
- **Row Level Security (RLS)** - Database-level authorization

### **Design**
- **Dark theme** with pure black background (#000000)
- **Gradient accents** - Purple-pink highlights, yellow-green CTAs
- **iOS 26 Liquid Glass UI** - Blur effects, safe area handling

---

## 📊 Database

**Powered by Supabase PostgreSQL:**

- `users` - Auth, profiles, coin balance
- `novels` - Titles, authors, genres, pricing
- `chapters` - Content, free/paid status, word count
- `following_novels` - User's followed novels
- `unlocked_chapters` - Purchased chapters per user
- `reading_progress` - User reading history
- `coin_transactions` - Transaction log

**Sample Data:** 5 novels, 163 chapters (seeded automatically)

---

## 🔐 Environment Setup

**Supabase credentials are stored in Replit Secrets:**

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public anonymous key

**These are auto-loaded via `app.json` extras config.**

---

## 📱 App Structure

```
screens/
├── AuthScreen.tsx          # Signup/Login
├── BrowseStackNavigator/
│   ├── HomeScreen.tsx      # Novel discovery
│   ├── SearchScreen.tsx    # Search & filters
│   ├── NovelDetailScreen.tsx # Novel info + chapters
│   └── ReaderScreen.tsx    # Immersive reading
├── LibraryStackNavigator/
│   └── LibraryScreen.tsx   # Following + History
├── NotificationsScreen.tsx
└── ProfileStackNavigator/
    ├── ProfileScreen.tsx   # User account
    ├── CoinStoreScreen.tsx # Buy coins
    └── WriterDashboard.tsx # Writer portal

contexts/
├── AuthContext.tsx         # Supabase Auth integration
└── AppContext.tsx          # Novels, chapters, user data

utils/
└── supabase.ts            # Supabase client setup
```

---

## 🧪 Testing

**Try the full flow:**

1. **Signup** - Create account (test@example.com / password123)
2. **Browse** - Explore 5 sample novels
3. **Read** - First 5 chapters free
4. **Unlock** - Use coins to unlock premium chapters
5. **Writer Mode** - Toggle in Profile → Create novels

---

## 🚀 Deployment

**Publish to Expo:**
```bash
expo publish
```

**The app works on Expo Go without custom native code.**

---

## 📚 Documentation

- **Project Architecture**: See [replit.md](./replit.md)
- **Supabase SQL Schema**: See [supabase-schema.sql](./supabase-schema.sql)
- **Supabase Seed Data**: See [supabase-seed.sql](./supabase-seed.sql)

---

## 🐛 Troubleshooting

**"Missing Supabase credentials" error?**
→ Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Replit Secrets.

**App not loading?**
→ Check console logs for errors. Restart workflow: `npm run dev`

**Database empty?**
→ Run SQL seed script in Supabase SQL Editor (see [supabase-seed.sql](./supabase-seed.sql))

---

**Built with ❤️ using Expo & Supabase**
