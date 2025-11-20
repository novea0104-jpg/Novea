# Novea - Digital Novel Reading Platform

## Overview

Novea is a React Native mobile application for reading and writing digital novels with a coin-based monetization system. Built with Expo and Supabase, it targets iOS and Android platforms and provides an immersive reading experience similar to modern content streaming apps. The app supports two user roles: Readers who consume content and Writers who create and publish novels.

**Backend:** Fully powered by Supabase (PostgreSQL + Auth + Auto-generated APIs). No Express server needed!

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Runtime**
- React Native 0.81.5 with React 19.1.0
- Expo SDK 54 for cross-platform development
- New React Native Architecture enabled
- React Compiler experimental feature enabled

**Navigation System**
- React Navigation v7 with custom floating bottom tab navigation
- Native stack navigators for each tab section
- Four main tabs: Browse, Library, Notifications, Profile
- Floating Action Button (FAB) for Writers to create content
- Transparent/blur headers using platform-specific effects (iOS blur, Android solid)
- Custom tab bar with gradient pill-shaped active indicators and glass effect background

**State Management**
- React Context API for global state
- `AuthContext` manages user authentication and coin balance
- `AppContext` manages novels catalog, following status, and unlocked chapters
- Local state with React hooks for component-level data

**UI/UX Architecture**
- Custom theming system with light/dark mode support
- Gradient components using `expo-linear-gradient` and masked views
- Reanimated v4 for performant animations with spring physics
- Gesture handling via `react-native-gesture-handler`
- Safe area management for notched devices
- Keyboard-aware scrolling with `react-native-keyboard-controller`

**Component Design Pattern**
- Themed components (`ThemedView`, `ThemedText`) for consistent styling
- Screen wrapper components that handle insets and scrolling (`ScreenScrollView`, `ScreenFlatList`, `ScreenKeyboardAwareScrollView`)
- Reusable UI components: `Button`, `Card`, `NovelCard`, `EmptyState`, `FloatingActionButton`, `RoleBadge`
- Error boundaries for graceful error handling
- Custom hooks: `useAuth`, `useTheme`, `useUserStats` for data fetching and state management

**Design System**
- Centralized theme constants (colors, typography, spacing, gradients) with TypeScript const assertions
- Pure black theme (#000000) with dark grey elevated cards (#1A1A1A)
- Genre-specific gradient colors (Romance, Fantasy, Thriller, Mystery, Sci-Fi)
- Purple-pink gradient for highlights and active states
- Yellow-green gradient for CTAs
- Consistent spacing scale (xs to 3xl)
- BorderRadius and Typography constants
- Platform-specific shadow and blur effects

**Module Resolution**
- Path aliasing using `@/` for root-level imports
- Babel module resolver for cleaner import statements

### Backend Architecture (Supabase)

**Backend-as-a-Service**
- Supabase Cloud (PostgreSQL + Auth + REST APIs)
- No custom server - fully serverless!
- Auto-generated REST APIs from database schema
- Row Level Security (RLS) for authorization

**Database**
- PostgreSQL hosted on Supabase
- Client library: `@supabase/supabase-js`
- Schema defined in `supabase-schema.sql`
- Direct queries from frontend via Supabase client

**Supabase Client** (`utils/supabase.ts`)
- Initialized with project URL + anon key (from Replit Secrets)
- Provides type-safe database operations
- Built-in auth session management
- Real-time subscription support (not used yet, but available)

**Authentication**
- Supabase Auth (email/password)
- Session managed via cookies + localStorage
- User profiles stored in `users` table
- Auth state synced with React Context

**Database Schema** (7 tables)
- `users`: Profiles, coin balance, role system (5 tiers), linked to Supabase Auth via email
- `novels`: Metadata, genre, pricing, statistics
- `chapters`: Content, pricing, word count
- `reading_progress`: User reading history (used to calculate user stats)
- `unlocked_chapters`: Purchased chapters per user
- `following_novels`: User's followed novels
- `coin_transactions`: Transaction log

**Role System**
- 5-tier hierarchy: Pembaca (default reader) → Penulis (writer) → Editor → Co Admin → Super Admin
- Role-based badges displayed on user profiles with gradient colors
- `RoleBadge` component for consistent role visualization
- Backward compatible: maintains `is_writer` boolean alongside new `role` field

**Sample Data**
- 5 novels across genres (Romance, Fantasy, Thriller, Mystery, Sci-Fi)
- 163 total chapters (5 free + paid per novel)
- Seeded via `supabase-seed.sql` (run in Supabase SQL Editor)

### Data Architecture

**Data Models**
- `User`: Authentication, 5-tier role system (Pembaca/Penulis/Editor/Co Admin/Super Admin), coin balance, user statistics
- `Novel`: Metadata, genre, status, rating, pricing, chapters count
- `Chapter`: Content, pricing (free/paid), unlock status, word count
- `CoinPackage`: In-app purchase packages with bonus coins
- `Genre`: Type-safe genre classification (Romance, Fantasy, Thriller, Mystery, Sci-Fi)
- `UserStats`: Dynamic statistics (novels read, chapters read, day streak) calculated from reading_progress table

**Data Client**
- `utils/supabase.ts` - Supabase client singleton
- Environment-aware credentials (from Replit Secrets via `app.json` extras)
- Type-safe database operations via TypeScript interfaces
- Direct database queries (no REST API layer needed)

**Data Storage**
- **Authoritative:** Supabase PostgreSQL database
- **Session Persistence:** Supabase Auth handles sessions automatically (cookies + localStorage)
- **No AsyncStorage for user data** - Supabase Auth manages everything

**Authentication System**
- Email/password authentication via Supabase Auth
- Passwords hashed automatically by Supabase (bcrypt)
- Session managed via Supabase Auth (JWT tokens)
- Auth flow:
  - Signup: `supabase.auth.signUp()` → Create user profile in `users` table → Auto-login
  - Login: `supabase.auth.signInWithPassword()` → Load user profile from `users` table
  - Session Restore: `supabase.auth.getSession()` → Load user profile if session exists
  - Logout: `supabase.auth.signOut()` → Clear all session data
- AuthContext in `contexts/AuthContext.tsx` wraps Supabase Auth
- Auth state changes handled via `supabase.auth.onAuthStateChange()` listener
- AuthScreen renders outside NavigationContainer (uses regular ScrollView with safe area insets)
- ProfileScreen logout button positioned with extra bottom spacing to avoid floating tab bar overlap

### Monetization System

**Coin Economy**
- Virtual currency for content unlocking
- Free chapters (first 5 per novel)
- Paid chapters requiring coin expenditure
- Coin packages with volume-based bonuses
- Balance tracking integrated with user profile

**Writer Monetization**
- Dashboard showing novel performance
- Chapter management and publishing
- Analytics tracking (readers, coins earned)
- Content editing interface with draft support

### Screen Architecture

**Browse Flow**
- Home: Horizontal carousels (Trending, New Releases, Editor's Pick)
- Search: Text-based novel discovery with genre filters
- Novel Detail: Synopsis, chapters list, follow/purchase actions
- Reader: Immersive full-screen reading with customization

**Library Flow**
- Following tab: Tracked novels
- History tab: Reading progress
- Quick access to novel details and resume reading

**Notifications Flow**
- System notifications (new chapters, promotions)
- Deep linking to related novels

**Profile Flow**
- User account management
- Coin store for purchases
- Writer mode toggle
- Writer Dashboard (conditional on role)
- Novel and chapter management for writers

**Reader Experience**
- Customizable font size (14-24px)
- Background themes (black, dark grey, sepia)
- Scroll or page-turn modes
- Progress tracking
- Chapter unlock modal for paid content

### Platform-Specific Optimizations

**iOS**
- Apple Sign-In integration (required)
- Blur effects for headers and tab bar
- Haptic feedback support

**Android**
- Google Sign-In integration
- Edge-to-edge display with `edgeToEdgeEnabled`
- Predictive back gesture disabled
- Adaptive icons with foreground, background, and monochrome variants

**Web**
- Single-page output
- Fallback implementations for native-only APIs
- Static rendering support with hydration

## External Dependencies

### Core Dependencies
- **Expo SDK 54**: Development platform and native module access
- **React Navigation**: Multi-stack navigation architecture
- **React Native Reanimated v4**: High-performance animations
- **React Native Gesture Handler**: Touch gesture recognition
- **React Native Safe Area Context**: Notch and status bar handling

### UI Libraries
- **@expo/vector-icons (Feather)**: Icon system
- **expo-linear-gradient**: Gradient rendering
- **expo-blur**: iOS blur effects
- **@react-native-masked-view/masked-view**: Gradient text masking
- **expo-glass-effect**: Liquid glass visual effects

### Storage & State
- **@react-native-async-storage/async-storage**: Local data persistence

### Platform Integration
- **expo-web-browser**: OAuth flows (Apple/Google Sign-In)
- **expo-linking**: Deep linking support
- **expo-haptics**: Tactile feedback
- **expo-splash-screen**: Launch screen management

### Development Tools
- **TypeScript**: Type safety
- **ESLint with Expo config**: Code quality
- **Prettier**: Code formatting
- **Babel module resolver**: Path aliasing

## 🚀 Development Workflow

Novea uses **Supabase Backend-as-a-Service** - no manual backend startup needed!

### **Single Process: Frontend (Expo)**
Running via "Start application" workflow on port 8081
- ✅ Auto-starts when you open Replit
- ✅ No backend server needed!

### **Quick Start:**
```bash
npm run dev
```

That's it! The app connects directly to Supabase Cloud.

---

### Recent Changes (January 2025)

**Supabase Migration Completed ✅**
- ✅ Migrated from Express + PostgreSQL to Supabase BaaS
- ✅ Removed manual backend server startup requirement
- ✅ Supabase Auth replaces custom bcrypt authentication
- ✅ Auto-generated REST APIs replace Express routes
- ✅ AuthContext & AppContext updated to use Supabase client
- ✅ NovelDetailScreen & ReaderScreen fetch chapters from Supabase
- ✅ Single-process development workflow (Expo only)
- ✅ Credentials managed via Replit Secrets

**Role System & Profile Enhancements ✅ (November 20, 2025)**
- ✅ Added 5-tier role system: Pembaca, Penulis, Editor, Co Admin, Super Admin
- ✅ Created professional `RoleBadge` component with gradient styling
- ✅ Implemented `useUserStats` hook to fetch real user statistics from database
- ✅ Profile screen now displays dynamic stats (novels read, chapters read) from `reading_progress` table
- ✅ Fixed logout error handling with graceful fallback
- ✅ Updated Row Level Security policies to use email-based matching (UUID vs integer ID compatibility)
- ✅ Implemented role-based navigation with secure upgrade system
- ✅ Created AdminDashboardScreen for editor/co_admin/super_admin roles
- ✅ Created WriterCenterScreen for penulis role
- ✅ Built secure PostgreSQL function `upgrade_user_to_writer()` to handle role upgrades
- 📝 SQL files: `supabase-add-roles.sql`, `supabase-rls-fix-v2.sql`, `supabase-enable-rls.sql`, `supabase-upgrade-writer-function.sql`

**Role-Based Navigation System:**
- **Pembaca** (default): Shows "Menjadi Penulis" button → upgrades to Penulis role
- **Penulis**: Shows "Pusat Penulis" button → navigates to WriterCenter (coming soon)
- **Editor/Co Admin/Super Admin**: Shows "Dashboard Admin" button → navigates to AdminDashboard (coming soon)

### Future Integration Points
- Payment Gateway (GoPay, DANA, bank transfers, credit cards)
- Push notification service for chapter updates
- Cloud storage for user-generated content
- Backend API for enhanced authentication and data sync
- Analytics service for writer dashboards