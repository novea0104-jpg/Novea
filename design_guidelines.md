# Novea Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app has explicit user accounts, monetization, and social features.

**Implementation:**
- Use SSO with Google Sign-In and Apple Sign-In
- Include email/password as fallback option
- Separate onboarding flows for Readers vs Writers (user selects role during signup)
- Login screen features:
  - App logo and tagline
  - Social sign-in buttons (Apple, Google)
  - Email/password form (collapsible)
  - Privacy policy & terms of service links
- Account screen includes:
  - User profile (avatar, display name, role badge: Reader/Writer)
  - Coin balance display (prominent)
  - Switch to Writer mode (for readers who want to publish)
  - Log out with confirmation
  - Delete account (Settings > Account > Delete Account, double confirmation)

### Navigation Structure
**Tab Navigation** with 4 tabs + Floating Action Button (FAB) for Writers:

1. **Browse (Home)** - Novel catalog and discovery
2. **Library** - Followed novels and reading history
3. **Notifications** - Updates on followed novels and system notifications
4. **Profile** - User account, settings, coin management

**FAB (Writer Mode Only):**
- Visible when user has writer role activated
- Action: Create New Novel or Add Chapter
- Positioned bottom-right, above tab bar

### Information Architecture

**Browse Stack:**
- Browse Home (catalog with categories)
- Novel Detail
- Reader (reading experience)
- Genre Filter Results
- Search Results

**Library Stack:**
- Library Home (followed novels, reading history)
- Novel Detail
- Reader

**Notifications Stack:**
- Notifications List
- Novel Detail (deep link)

**Profile Stack:**
- Profile Home
- Edit Profile
- Coin Store (purchase coins)
- Payment Method
- Writer Dashboard (if writer role active)
- Manage Novel (writer)
- Edit Chapter (writer)
- Settings
- Privacy Policy / Terms

## Screen Specifications

### Browse Home
- **Purpose:** Discover and browse novels
- **Layout:**
  - Transparent header with app logo (left), search icon (right)
  - Scrollable content with horizontal carousels
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - Search bar (modal screen when tapped)
  - Horizontal scrolling carousels:
    - Trending (large cards with cover images)
    - New Releases (medium cards)
    - Editor's Pick (medium cards)
    - Genre sections (Romance, Fantasy, Thriller)
  - Each card shows: cover, title, author, rating stars, coin icon + price per chapter
- **Interactions:** Tap card → Navigate to Novel Detail

### Novel Detail
- **Purpose:** Display novel information and chapter list
- **Layout:**
  - Custom transparent header with back button (left), share + bookmark icons (right)
  - Scrollable content
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components:**
  - Hero section: Cover image, title, author name, rating (stars + count)
  - Action buttons: Follow/Unfollow, Share
  - Coin pricing: "X coins per chapter" with icon
  - Genre tags (pills)
  - Synopsis (expandable)
  - Chapter list (numbered, with lock icon for paid chapters, "FREE" badge for first 5 chapters)
- **Interactions:** Tap chapter → Reader screen (check coin balance if locked)

### Reader
- **Purpose:** Immersive reading experience
- **Layout:**
  - Hidden header (appears on tap with back, settings icons)
  - Full-screen content area
  - Footer with chapter navigation (Previous/Next buttons)
  - Top/bottom insets: 0 when header hidden, normal when visible
- **Components:**
  - Novel title and chapter number (top, fades out)
  - Reading content (scrollable or paginated based on user preference)
  - Reading settings button (floating, bottom-right): font size, background color, scroll/page mode
  - Progress indicator (small, bottom center)
- **Unlock Flow:** If chapter is locked, show modal with coin balance, unlock price, and "Unlock" CTA

### Library Home
- **Purpose:** Access followed novels and reading history
- **Layout:**
  - Default header with "Library" title, filter icon (right)
  - Scrollable list/grid toggle
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - Segmented control: "Following" / "History"
  - Grid or list view of novel cards
  - Each card shows: cover, title, progress bar, "New Chapter" badge if updated
  - Empty state: Illustration + "Start following novels to see them here"

### Coin Store
- **Purpose:** Purchase coin packages
- **Layout:**
  - Default header with "Buy Coins" title, close button (left)
  - Scrollable content
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components:**
  - Current balance display (prominent, at top)
  - Coin packages (cards with coin amount, price, bonus badge for larger packages)
  - Payment method selector (GoPay, DANA, Bank Transfer, Credit Card icons)
  - "Get Free Coins" section: Daily login, watch ads, complete missions
- **Interactions:** Tap package → Payment confirmation modal → Process payment

### Writer Dashboard (Writer Role Only)
- **Purpose:** Manage published novels and view analytics
- **Layout:**
  - Default header with "My Novels" title, add icon (right)
  - Scrollable list
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - Stats summary cards: Total readers, total earnings (coins), pending withdrawal
  - "Withdraw Earnings" button (if balance > threshold)
  - List of published novels with: cover thumbnail, title, status (On-Going/Completed), chapter count, reader count, earnings
  - FAB for creating new novel
- **Interactions:** Tap novel → Manage Novel screen

### Manage Novel (Writer)
- **Purpose:** Edit novel details and manage chapters
- **Layout:**
  - Default header with novel title, edit icon (right)
  - Scrollable list
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components:**
  - Novel cover and basic info (editable)
  - Analytics: views, readers, revenue per chapter
  - Chapter list with edit/delete actions
  - "Add Chapter" button (floating)
- **Interactions:** Tap chapter → Edit Chapter screen

### Edit Chapter (Writer)
- **Purpose:** Write or edit chapter content
- **Layout:**
  - Header with cancel (left), "Save Draft" and "Publish" (right)
  - Scrollable form
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl (keyboard aware)
- **Components:**
  - Chapter number (auto-incremented)
  - Chapter title input
  - Rich text editor (simple markdown support)
  - Schedule publish toggle + date picker
  - Draft indicator if not published

### Profile Home
- **Purpose:** User account management
- **Layout:**
  - Default header with "Profile" title, settings icon (right)
  - Scrollable content
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - User avatar (tappable to change), display name, role badge
  - Coin balance card (prominent, tappable → Coin Store)
  - "Switch to Writer Mode" toggle (if reader) or "Writer Dashboard" link (if writer)
  - Menu items: Edit Profile, Reading Stats, Privacy, Help & Support, Log Out

## Design System

### Color Palette
- **Primary:** Deep Purple (#6C5CE7) - for CTAs, active states, branding
- **Secondary:** Warm Gold (#FFD700) - for coin icons, premium badges
- **Background:** Dark mode optimized
  - Dark: #1A1A2E (primary background)
  - Card: #16213E (elevated surfaces)
  - Light: #FFFFFF (for light mode toggle)
- **Text:**
  - Primary: #FFFFFF (dark mode) / #1A1A2E (light mode)
  - Secondary: #B0B0C3
  - Muted: #6C6C80
- **Accent:**
  - Success: #27AE60 (for "Free" badges)
  - Warning: #F39C12 (for lock icons)
  - Error: #E74C3C

### Typography
- **System Font:** SF Pro (iOS) / Roboto (Android)
- **Novel Reading Font:** Serif option (Georgia, Merriweather) for immersive reading
- **Sizes:**
  - H1: 28px, Bold (screen titles)
  - H2: 22px, Semibold (section headers)
  - Body: 16px, Regular (default text)
  - Caption: 14px, Regular (metadata)
  - Reading: 18px adjustable (14-24px, user preference)

### Visual Design
- **Icons:** Use Feather icons from @expo/vector-icons
- **Touchable Feedback:** All buttons have press state with 0.7 opacity
- **Cards:** Rounded corners (12px), subtle elevation
  - Novel cards use cover images as hero
  - Floating elements (FAB, reading settings) use drop shadow:
    - shadowOffset: {width: 0, height: 2}
    - shadowOpacity: 0.10
    - shadowRadius: 2
- **Coin Icon:** Custom asset - golden coin with "N" emblem
- **Lock Icon:** Standard Feather "lock" icon in Warning color
- **Rating:** Star icons (filled/outline) in Secondary Gold color

### Critical Assets
1. **App Logo** - "Novea" wordmark with book icon
2. **Coin Icon** - Golden coin with "N" emblem (used throughout app)
3. **Novel Cover Placeholders** - 5 generic covers for different genres (Romance: pink gradient, Fantasy: purple mystical, Thriller: dark blue)
4. **Empty State Illustrations:**
   - Library empty: Open book illustration
   - No search results: Magnifying glass with question mark
   - No notifications: Bell with checkmark
5. **User Avatar Presets** - 6 book-themed avatars (different colored books, reader silhouettes) that users can select

### Accessibility
- Minimum touch target: 44x44 points
- Text contrast ratio: 4.5:1 minimum
- Reading mode supports: Dark mode toggle, font size adjustment (14-24px), serif/sans-serif toggle
- VoiceOver/TalkBack labels for all interactive elements
- Haptic feedback on critical actions (unlock chapter, purchase coins)