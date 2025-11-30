# Novea - Digital Novel Reading Platform

## Overview

Novea is a React Native mobile application for reading and writing digital novels, featuring a coin-based monetization system. Built with Expo and Supabase for iOS and Android, it offers an immersive reading experience and supports two user roles: Readers (content consumers) and Writers (content creators). The project aims to provide a platform similar to modern content streaming apps but for digital novels, with a fully serverless backend powered by Supabase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Runtime:** React Native 0.81.5 with React 19.1.0, Expo SDK 54, New React Native Architecture, and experimental React Compiler.

**Navigation System:** React Navigation v7 with a custom floating bottom tab bar (Browse, Library, Notifications, Profile) and a Floating Action Button (FAB) for Writers. Features include transparent/blur headers and custom tab bar aesthetics.

**State Management:** React Context API for global state (`AuthContext`, `AppContext`) and React hooks for local component state.

**UI/UX Architecture:** Custom theming with light/dark mode, gradient components, Reanimated v4 for animations, `react-native-gesture-handler` for gestures, safe area management, and keyboard-aware scrolling.

**Component Design Pattern:** Themed components (`ThemedView`, `ThemedText`), screen wrapper components (`ScreenScrollView`, `ScreenFlatList`), reusable UI components (e.g., `Button`, `NovelCard`), error boundaries, and custom hooks (`useAuth`, `useTheme`, `useUserStats`).

**Design System:** Centralized theme constants (colors, typography, spacing, gradients) with a pure black theme, dark grey elevated cards, genre-specific gradients, and platform-specific shadow/blur effects.

**Module Resolution:** Path aliasing using `@/` for root-level imports via Babel module resolver.

### Backend Architecture (Supabase)

**Backend-as-a-Service:** Supabase Cloud (PostgreSQL, Auth, REST APIs) serves as a fully serverless backend.

**Database:** PostgreSQL hosted on Supabase, with `@supabase/supabase-js` for client-side interaction. Row Level Security (RLS) is used for authorization.

**Authentication:** Supabase Auth (email/password) manages user sessions and integrates with the `users` table for profiles.

**Database Schema:** Consists of 10 tables: `users`, `novels`, `chapters`, `reading_progress`, `unlocked_chapters`, `following_novels`, `coin_transactions`, `timeline_posts`, `timeline_post_likes`, and `timeline_post_comments`.

**Role System:** A 5-tier hierarchy (Pembaca, Penulis, Editor, Co Admin, Super Admin) with role-based badges and secure upgrade mechanisms.

### Data Architecture

**Data Models:** Key models include `User` (authentication, roles, coin balance), `Novel` (metadata, pricing), `Chapter` (content, pricing, unlock status), `CoinPackage`, `Genre`, and `UserStats` (dynamic statistics).

**Data Client:** A singleton Supabase client (`utils/supabase.ts`) handles type-safe database operations.

**Data Storage:** Authoritative data resides in the Supabase PostgreSQL database. Session persistence is handled by Supabase Auth.

### Monetization System

**Coin Economy:** A virtual currency system for unlocking chapters. Features include free chapters, paid chapters, coin packages, and balance tracking.

**Writer Monetization:** Writers have access to a dashboard for novel performance, chapter management, publishing tools, and analytics.

### Screen Architecture

**Browse Flow:** Home (carousels), Search (filters), Novel Detail (synopsis, chapters), and Reader (customizable reading experience). Browse home screen features a custom header with the Novea gradient logo (32x32px) from `assets/images/novea-logo.png` and "ovea" text (22px bold) with a compact 4px gap.

**Library Flow:** Sections for following novels and reading history.

**Notifications Flow:** System notifications with deep linking.

**Profile Flow:** User account management, coin store, writer mode toggle, and conditional writer/admin dashboards.

**Reader Experience:** Customizable font size, background themes, scroll/page-turn modes, progress tracking, and chapter unlock modals.

### Platform-Specific Optimizations

**iOS:** Apple Sign-In, blur effects, haptic feedback.

**Android:** Google Sign-In, edge-to-edge display, adaptive icons.

**Web:** Single-page output with fallback for native APIs and static rendering.

## External Dependencies

### Core Dependencies
- **Expo SDK 54**: Development platform
- **React Navigation**: Multi-stack navigation
- **React Native Reanimated v4**: Animations
- **React Native Gesture Handler**: Touch gestures
- **React Native Safe Area Context**: Notch and status bar handling

### UI Libraries
- **@expo/vector-icons (Feather)**: Icon system
- **expo-linear-gradient**: Gradient rendering
- **expo-blur**: iOS blur effects
- **@react-native-masked-view/masked-view**: Masking
- **expo-glass-effect**: Glass visual effects

### Storage & State
- **@react-native-async-storage/async-storage**: Local data persistence

### Platform Integration
- **expo-web-browser**: OAuth flows
- **expo-linking**: Deep linking
- **expo-haptics**: Tactile feedback
- **expo-splash-screen**: Launch screen

### Development Tools
- **TypeScript**: Type safety
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Babel module resolver**: Path aliasing

## Timeline (Linimasa) Feature

**Overview:** Instagram-style social timeline where users can share posts about their reading/writing journey.

**Feed Logic:** Posts are shown from: (1) Admin roles (Super Admin, Co Admin, Editor) - visible to all users, (2) Followed authors (Penulis) - shown based on user's following relationships, (3) User's own posts.

**Components:**
- `PostCard.tsx`: Displays individual timeline posts with author info, content, like/comment counts, and actions
- `CreatePostModal.tsx`: Modal for creating new posts with text and optional novel tagging
- `TimelineScreen.tsx`: Main timeline feed with pull-to-refresh and FAB for creating posts

**Database Tables (need Supabase migration):**
- `timeline_posts`: id, user_id, content, image_url, novel_id, likes_count, comments_count, created_at, updated_at
- `timeline_post_likes`: id, user_id, post_id, created_at (UNIQUE user_id, post_id)
- `timeline_post_comments`: id, user_id, post_id, parent_id, content, created_at

**SQL Functions:**
- `increment_post_likes(post_id)`: Increments likes_count
- `decrement_post_likes(post_id)`: Decrements likes_count (minimum 0)

## EAS Build Configuration

**File:** `eas.json` - Configured for Android APK builds via EAS Build.

**Build Profiles:**
- `preview`: Development APK for testing (buildType: apk)
- `production`: Production AAB for Play Store (buildType: app-bundle)

**Build Commands:**
1. Install EAS CLI globally: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Build preview APK: `eas build --platform android --profile preview`
4. Build production AAB: `eas build --platform android --profile production`

**Requirements:**
- Expo account (create at expo.dev)
- EAS CLI installed globally
- Valid bundle identifier in app.json