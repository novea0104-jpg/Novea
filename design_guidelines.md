# Novea Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - App has user accounts, monetization, and social features.

**Implementation:**
- SSO with Apple Sign-In (required for iOS) and Google Sign-In
- Email/password fallback
- User role selection during signup: Reader or Writer
- Login screen with social sign-in buttons, collapsible email form, privacy policy/terms links
- Account screen includes: user profile (avatar, display name, role badge), prominent coin balance, role switching, logout (with confirmation), delete account (nested under Settings > Account > Delete, double confirmation)

### Navigation
**Tab Navigation** with 4 tabs + FAB:
- **Browse** - Novel discovery and catalog
- **Library** - Followed novels and reading history
- **Notifications** - Novel updates and system alerts
- **Profile** - Account settings and coin management

**FAB (Writer Mode Only):**
- Visible for writer role
- Action: Create novel or add chapter
- Position: bottom-right, above tab bar with drop shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)

### Screen Specifications

**Browse Home**
- Purpose: Discover novels
- Layout: Transparent header with logo (left), search icon (right); scrollable horizontal carousels
- Top inset: headerHeight + Spacing.xl; Bottom inset: tabBarHeight + Spacing.xl
- Components: Search, carousels (Trending, New Releases, Editor's Pick, genres); cards show cover, title, author, rating, coin price
- Interaction: Tap card → Novel Detail

**Novel Detail**
- Purpose: Novel info and chapter list
- Layout: Transparent header with back (left), share + bookmark (right); scrollable content
- Top inset: headerHeight + Spacing.xl; Bottom inset: insets.bottom + Spacing.xl
- Components: Hero (cover, title, author, rating), Follow/Share buttons, coin pricing, genre pills, expandable synopsis, chapter list (lock icon for paid, "FREE" badge for first 5)
- Interaction: Tap chapter → Reader (check coins if locked)

**Reader**
- Purpose: Immersive reading
- Layout: Hidden header (appears on tap), full-screen content, footer with Previous/Next buttons
- Components: Title/chapter number (fades out), scrollable text, floating settings button (bottom-right with drop shadow), progress indicator
- Unlock flow: Modal showing coin balance, unlock price, "Unlock" CTA
- Reading settings: font size (14-24px), background (pure black/dark grey/sepia), scroll/page mode, serif/sans-serif toggle

**Library Home**
- Layout: Default header with "Library" title, filter icon (right); scrollable list/grid toggle
- Top inset: Spacing.xl; Bottom inset: tabBarHeight + Spacing.xl
- Components: Segmented control (Following/History), grid/list toggle, novel cards with progress bars and "New Chapter" badges
- Empty state: Book illustration + message

**Coin Store**
- Purpose: Purchase coins
- Layout: Default header, scrollable content
- Components: Current balance (prominent gradient card at top), coin package cards with bonus badges, payment method selector (icons), "Get Free Coins" section (daily login, ads, missions)
- Interaction: Tap package → Payment modal → Process

**Writer Dashboard**
- Layout: Default header with "My Novels" title, add icon (right)
- Components: Stats cards (total readers, earnings, pending withdrawal), "Withdraw Earnings" button, published novel list with metrics
- Interaction: Tap novel → Manage Novel

**Manage Novel (Writer)**
- Layout: Default header, scrollable list
- Components: Editable cover/info, analytics (views, readers, revenue), chapter list with edit/delete, floating "Add Chapter" button

**Edit Chapter (Writer)**
- Layout: Header with cancel (left), "Save Draft" + "Publish" (right); scrollable form, keyboard-aware
- Components: Chapter number (auto), title input, markdown text editor, schedule publish toggle

**Profile Home**
- Layout: Default header with settings icon (right)
- Components: Avatar (tappable), display name, role badge, gradient coin balance card (tappable → Coin Store), role switch/dashboard link, menu items (Edit Profile, Reading Stats, Privacy, Help, Log Out)

## Design System

### Color Palette
**Pure Black Theme:**
- **Background Primary:** #000000 (pure black for main screens)
- **Card/Elevated:** #1A1A1A (dark grey for cards, modals)
- **Card Hover/Active:** #2A2A2A (interaction states)

**Gradients:**
- **Primary Accent:** Linear gradient purple to pink (#8B5CF6 → #EC4899)
  - Use for: Premium badges, featured content, highlights
- **CTA Accent:** Linear gradient yellow to green (#FACC15 → #84CC16)
  - Use for: Primary buttons, unlock actions, purchase CTAs

**Text:**
- **Primary:** #FFFFFF (high contrast on black)
- **Secondary:** #A3A3A3 (metadata, captions)
- **Muted:** #737373 (disabled states)

**Functional:**
- **Success:** #10B981 (free badges, confirmations)
- **Warning:** #F59E0B (lock icons, alerts)
- **Error:** #EF4444 (destructive actions)
- **Coin:** #FCD34D (solid gold for coin icon)

### Typography
- **System:** SF Pro (iOS) / Roboto (Android)
- **Reading Font:** Serif option (Merriweather) for immersive mode
- **Scale:**
  - H1: 28px Bold (titles)
  - H2: 22px Semibold (headers)
  - Body: 16px Regular (default)
  - Caption: 14px Regular (meta)
  - Reading: 18px adjustable (14-24px)

### Visual Design
- **Minimalist Aesthetic:**
  - Generous white space (24px minimum between sections)
  - Clean hierarchy with clear size/weight differences
  - Reduced visual clutter - only essential elements visible
  
- **Rounded Corners:** 16px for cards, 12px for buttons, 8px for pills/badges

- **Touchable Feedback:**
  - All interactive elements: 0.7 opacity on press
  - No blurred shadows except floating elements
  - Gradient buttons: slight scale (0.98) on press

- **Cards:**
  - Dark grey (#1A1A1A) background
  - 1px border with #2A2A2A for subtle definition
  - No drop shadow (flat design)
  - Novel cover cards: gradient overlay from transparent to black at bottom (for text readability)

- **Icons:** Feather icons (@expo/vector-icons), 24px default size, #FFFFFF or gradient fill for featured items

- **Elevation Hierarchy:**
  - Level 0: Pure black background
  - Level 1: Dark grey cards (#1A1A1A)
  - Level 2: Modals, dropdowns (#2A2A2A)
  - Floating only: FAB and reading settings button use subtle drop shadow

### Critical Assets
1. **App Logo:** "Novea" wordmark with minimalist book icon (gradient purple-pink)
2. **Coin Icon:** Solid gold coin (#FCD34D) with "N" emblem
3. **Novel Cover Placeholders:** 5 genre-specific covers with gradient overlays:
   - Romance: Pink-purple gradient
   - Fantasy: Purple-blue gradient  
   - Thriller: Dark red-black gradient
   - Mystery: Teal-black gradient
   - Sci-Fi: Cyan-purple gradient
4. **Empty State Illustrations:** Minimalist line art in gradient:
   - Library: Open book outline
   - Search: Magnifying glass
   - Notifications: Bell with checkmark
5. **User Avatar Presets:** 6 book-themed gradient avatars (abstract book shapes in different gradient combinations)

### Accessibility
- Touch targets: 44x44 minimum
- Text contrast: 4.5:1 minimum (white on pure black exceeds this)
- Reading mode: Dark/sepia toggle, font size adjustment, serif/sans-serif
- VoiceOver/TalkBack labels on all interactive elements
- Haptic feedback on critical actions (unlock, purchase)
- Gradient text: Ensure underlying solid color meets contrast requirements for accessibility mode