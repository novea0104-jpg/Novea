# Novea Backend Server

Express-based REST API server untuk Novea digital novel platform with PostgreSQL database.

## Running the Backend

The backend server runs **separately** from the Expo frontend app.

### Option 1: Manual Start (Recommended for Development)

Open a **separate terminal** in Replit Shell and run:

```bash
PORT=3000 npx tsx server/index.ts
```

This starts the backend on port 3000. Keep this terminal running while developing.

### Option 2: Using Helper Script

```bash
bash start-services.sh
```

This script starts both backend (port 3000) and frontend (port 8081) together.

## Backend Server Details

- **Port:** 3000 (mapped to external port 3003 in Replit)
- **Database:** PostgreSQL (Neon) via DATABASE_URL environment variable
- **API Base:** `http://localhost:3000/api`
- **Health Check:** `GET /api/health`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current user (requires x-user-id header)
- `PATCH /api/auth/me` - Update user profile

### Novels
- `GET /api/novels` - Get all novels with chapters
- `GET /api/novels/:id` - Get novel by ID with chapters
- `POST /api/novels/:id/follow` - Follow/unfollow novel

### Chapters
- `GET /api/chapters/:id` - Get chapter details and unlock status
- `POST /api/chapters/:id/unlock` - Unlock chapter (purchase with coins)

### User Data
- `GET /api/user/unlocked-chapters` - Get user's unlocked chapters
- `GET /api/user/following` - Get user's followed novels
- `GET /api/user/reading-progress` - Get reading progress
- `POST /api/reading-progress` - Update reading progress

## Database Management

### Push Schema Changes
```bash
npx drizzle-kit push
```

### Re-seed Database
```bash
npx tsx server/seed.ts
```

### Open Drizzle Studio (Database GUI)
```bash
npx drizzle-kit studio
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (automatically set by Replit)
- `PORT` - Server port (default: 3000)

## Architecture

- **Framework:** Express 5.1
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** bcrypt password hashing
- **Schema:** See `shared/schema.ts`
- **Storage:** `server/storage.ts` (Drizzle client)

## Security

- Passwords hashed with bcrypt (10 rounds)
- User authentication via x-user-id header
- CORS enabled for cross-origin requests
- Input validation on all endpoints

## Sample Data

Database seeded with:
- 5 sample novels across genres (Romance, Fantasy, Thriller, Mystery, Sci-Fi)
- 163 total chapters (5 free + paid chapters per novel)
- Chapter pricing: 10 coins per chapter (after first 5 free)

## Troubleshooting

**Backend won't start:**
- Check DATABASE_URL environment variable is set
- Ensure port 3000 is not already in use
- Check logs for TypeScript or dependency errors

**Can't connect from frontend:**
- Verify backend is running (check terminal output)
- Ensure API base URL matches environment (localhost for web, Replit URL for Expo Go)
- Check CORS settings if using external clients

**Database errors:**
- Run `npx drizzle-kit push` to sync schema
- Check PostgreSQL connection with `psql $DATABASE_URL`
- Re-seed database if data is corrupted
