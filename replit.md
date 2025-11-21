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

**Database Schema:** Consists of 7 tables: `users`, `novels`, `chapters`, `reading_progress`, `unlocked_chapters`, `following_novels`, and `coin_transactions`.

**Role System:** A 5-tier hierarchy (Pembaca, Penulis, Editor, Co Admin, Super Admin) with role-based badges and secure upgrade mechanisms.

### Data Architecture

**Data Models:** Key models include `User` (authentication, roles, coin balance), `Novel` (metadata, pricing), `Chapter` (content, pricing, unlock status), `CoinPackage`, `Genre`, and `UserStats` (dynamic statistics).

**Data Client:** A singleton Supabase client (`utils/supabase.ts`) handles type-safe database operations.

**Data Storage:** Authoritative data resides in the Supabase PostgreSQL database. Session persistence is handled by Supabase Auth.

### Monetization System

**Coin Economy:** A virtual currency system for unlocking chapters. Features include free chapters, paid chapters, coin packages, and balance tracking.

**Writer Monetization:** Writers have access to a dashboard for novel performance, chapter management, publishing tools, and analytics.

### Screen Architecture

**Browse Flow:** Home (carousels), Search (filters), Novel Detail (synopsis, chapters), and Reader (customizable reading experience).

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