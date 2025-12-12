# Novea - Digital Novel Reading Platform

## Overview

Novea is a React Native mobile application for reading and writing digital novels, featuring a coin-based monetization system. Built with Expo and Supabase for iOS and Android, it provides an immersive reading experience and supports two user roles: Readers (content consumers) and Writers (content creators). The project aims to be a leading platform for digital novels, leveraging a fully serverless backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Runtime:** React Native with Expo SDK, New React Native Architecture, and experimental React Compiler.
**Navigation System:** React Navigation v7 with a custom floating bottom tab bar (Browse, Library, Notifications, Profile) and a conditional Floating Action Button (FAB).
**State Management:** React Context API for global state and React hooks for local component state.
**UI/UX Architecture:** Custom theming with light/dark mode, gradient components, Reanimated for animations, and `react-native-gesture-handler` for gestures.
**Component Design Pattern:** Themed components, screen wrappers, reusable UI components, error boundaries, and custom hooks.
**Design System:** Centralized theme constants (colors, typography, spacing, gradients) featuring a pure black theme and genre-specific gradients.
**Module Resolution:** Path aliasing using `@/` via Babel module resolver.

### Backend Architecture (Supabase)

**Backend-as-a-Service:** Supabase Cloud (PostgreSQL, Auth, REST APIs) provides a fully serverless backend.
**Database:** PostgreSQL with Row Level Security (RLS) for authorization.
**Authentication:** Supabase Auth (email/password) manages user sessions and integrates with user profiles, including password reset functionality.
**Database Schema:** Consists of tables for `users`, `novels`, `chapters`, `reading_progress`, `coin_transactions`, `timeline_posts`, `genres`, and related junction tables to support core features and a multi-genre system.
**Role System:** A 5-tier hierarchy (Pembaca, Penulis, Editor, Co Admin, Super Admin) with role-based access and secure upgrade mechanisms.

### Monetization System

**Coin Economy:** A virtual currency (Novoin) for unlocking chapters, supported by coin packages and balance tracking.
**Payment Gateway:** Google Play Billing integration via `react-native-iap` for in-app purchases on Android, with server-side validation using a Supabase Edge Function.
**Writer Monetization:** Writers receive 80% revenue share, with a dashboard for sales analytics, bank account management, and withdrawal requests.

### Core Features

**Multi-Genre System:** Novels can be assigned up to 3 genres, with one primary genre.
**Writer Analytics & Withdrawal:** Tools for writers to track earnings, view novel performance, and manage withdrawals.
**Admin Dashboard:** Provides access to platform statistics (users, novels, revenue), user management (roles, ban/unban), and content management (novels, chapters) for authorized roles.
**Timeline (Linimasa) Feature:** An Instagram-style social feed for users to share posts, displaying content from admins, followed authors, and the user's own posts.
**Reader Experience:** Customizable reading settings including font size, themes, scroll/page-turn modes, and progress tracking.

### Platform-Specific Optimizations

**iOS:** Apple Sign-In, blur effects, haptic feedback.
**Android:** Google Sign-In, edge-to-edge display, adaptive icons.
**Web:** Single-page output with fallback for native APIs.

## External Dependencies

### Core Dependencies
- **Expo SDK**: Development platform
- **React Navigation**: Multi-stack navigation
- **React Native Reanimated**: Animations
- **React Native Gesture Handler**: Touch gestures
- **React Native Safe Area Context**: Notch and status bar handling

### UI Libraries
- **@expo/vector-icons (Feather)**: Icon system
- **expo-linear-gradient**: Gradient rendering
- **expo-blur**: iOS blur effects
- **@react-native-masked-view/masked-view**: Masking
- **expo-glass-effect**: Glass visual effects
- **react-native-svg**: Chart rendering for analytics

### Storage & State
- **@react-native-async-storage/async-storage**: Local data persistence
- **expo-secure-store**: Secure local storage for sensitive data (e.g., remembering email)

### Platform Integration
- **expo-web-browser**: OAuth flows
- **expo-linking**: Deep linking
- **expo-haptics**: Tactile feedback
- **expo-splash-screen**: Launch screen
- **react-native-iap**: In-app purchases for Google Play Billing

### Backend
- **Supabase**: Backend-as-a-Service (PostgreSQL, Auth, REST APIs, Edge Functions)
- **@supabase/supabase-js**: Supabase client library

### Development Tools
- **TypeScript**: Type safety
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Babel module resolver**: Path aliasing
- **eas-cli**: Expo Application Services CLI for builds