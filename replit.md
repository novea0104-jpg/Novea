# Novea - Digital Novel Reading Platform

## Overview

Novea is a React Native mobile application for reading and writing digital novels with a coin-based monetization system. Built with Expo, it targets iOS and Android platforms and provides an immersive reading experience similar to modern content streaming apps. The app supports two user roles: Readers who consume content and Writers who create and publish novels.

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
- Reusable UI components: `Button`, `Card`, `NovelCard`, `EmptyState`, `FloatingActionButton`
- Error boundaries for graceful error handling

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

### Backend Architecture

**Server Framework**
- Express 5.1 REST API server
- Runs on port 3000 (mapped to external 3003 in Replit)
- Separate process from Expo frontend (dual-shell startup pattern)
- CORS enabled for cross-origin requests

**Database**
- PostgreSQL (Neon-backed) via Replit integration
- Drizzle ORM for type-safe database queries
- Schema defined in `shared/schema.ts`
- Database client in `server/storage.ts`

**Backend API Endpoints**
- `POST /api/auth/signup` - Create user with bcrypt-hashed password
- `POST /api/auth/login` - Authenticate user credentials
- `GET /api/auth/me` - Fetch current user data
- `PATCH /api/auth/me` - Update user profile (writer mode, coins)
- `GET /api/novels` - Get all novels with chapters
- `GET /api/novels/:id` - Get novel details
- `POST /api/novels/:id/follow` - Follow/unfollow novel
- `GET /api/chapters/:id` - Get chapter with unlock status
- `POST /api/chapters/:id/unlock` - Purchase chapter with coins
- `GET /api/user/unlocked-chapters` - User's unlocked chapters
- `GET /api/user/following` - User's followed novels
- `GET /api/user/reading-progress` - Reading history
- `POST /api/reading-progress` - Update progress

**Database Schema** (7 tables)
- `users`: Auth, profile, coin balance (bcrypt passwords)
- `novels`: Metadata, genre, pricing, statistics
- `chapters`: Content, pricing, word count
- `reading_progress`: User reading history
- `unlocked_chapters`: Purchased chapters per user
- `following_novels`: User's followed novels
- `coin_transactions`: Transaction log

**Sample Data**
- 5 novels across genres (Romance, Fantasy, Thriller, Mystery, Sci-Fi)
- 163 total chapters (5 free + paid per novel)
- Seeded via `server/seed.ts`

### Data Architecture

**Data Models**
- `User`: Authentication, role (Reader/Writer), coin balance
- `Novel`: Metadata, genre, status, rating, pricing, chapters count
- `Chapter`: Content, pricing (free/paid), unlock status, word count
- `CoinPackage`: In-app purchase packages with bonus coins
- `Genre`: Type-safe genre classification (Romance, Fantasy, Thriller, Mystery, Sci-Fi)

**API Client**
- `utils/api.ts` - HTTP client for backend API
- Environment-aware base URL (localhost for web, configurable for Expo Go)
- User ID header injection via `setCurrentUserId()`
- Type-safe request/response interfaces

**Data Storage**
- **Authoritative:** PostgreSQL database via backend API
- **Session Persistence:** AsyncStorage stores user ID only (`@novea_user_id`)
- **Legacy:** AsyncStorage utilities in `utils/storage.ts` (deprecated in favor of API)

**Authentication System**
- Email/password authentication via backend API
- Passwords hashed with bcrypt (10 rounds) on server
- Session managed via user ID in AsyncStorage
- Auth flow:
  - Signup: POST /api/auth/signup → Store user ID locally → Set current user
  - Login: POST /api/auth/login → Store user ID locally → Set current user
  - Session Restore: Load user ID → GET /api/auth/me → Restore user state
  - Logout: Clear user ID from AsyncStorage → Clear app state
- AuthContext in `contexts/AuthContext.tsx` handles all auth operations
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

### Recent Changes (November 2025)

**Authentication Implementation**
- ✅ Complete email/password authentication flow
- ✅ Persistent multi-user storage using AsyncStorage
- ✅ Logout bug fix: Changed from `clearAll()` to `clearSession()` to preserve users database
- ✅ AuthScreen compatibility: Uses regular ScrollView instead of ScreenKeyboardAwareScrollView (which requires navigator context)
- ✅ ProfileScreen accessibility: Added bottom spacer and accessibility labels to prevent tab bar overlap with logout button
- ✅ End-to-end testing verified: Signup → Logout → Login → Data persistence confirmed

### Future Integration Points
- Payment Gateway (GoPay, DANA, bank transfers, credit cards)
- Push notification service for chapter updates
- Cloud storage for user-generated content
- Backend API for enhanced authentication and data sync
- Analytics service for writer dashboards