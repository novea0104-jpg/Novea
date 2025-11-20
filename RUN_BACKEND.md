# 🚀 Running Novea Backend Server

## Quick Start

**Open a NEW TERMINAL** in Replit and run:

```bash
PORT=3000 npx tsx server/index.ts
```

**Expected Output:**
```
🚀 Novea Backend API running on port 3000
📚 Database connected: Yes
```

## Why Manual Start?

Replit environment requires backend server to run in **active terminal session** (not background process). Keep the terminal running while developing.

## Two Processes Required

1. **Frontend (Expo)**: Automatically started by "Start application" workflow (port 8081)
2. **Backend (Express)**: Manually started in separate terminal (port 3000)

## Troubleshooting

**Backend won't start:**
- Check DATABASE_URL is set: `echo $DATABASE_URL`
- Check port not in use: `lsof -i :3000`

**Frontend can't connect:**
- Verify backend running (check for startup message)
- Check API URL: `http://localhost:3000/api`
- Test health endpoint: `curl http://localhost:3000/api/health`

**Database errors:**
- Sync schema: `npx drizzle-kit push --force`
- Check connection: `psql $DATABASE_URL -c "SELECT 1"`

## Testing Backend API

```bash
# Health check
curl http://localhost:3000/api/health

# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@novea.com","password":"test123","name":"Test User"}'

# Get novels
curl http://localhost:3000/api/novels
```

## Development Workflow

1. **Terminal 1**: Keep backend running (`PORT=3000 npx tsx server/index.ts`)
2. **Terminal 2/3**: Use for other commands (git, drizzle, etc)
3. **Expo Dev**: Already running via workflow

## Notes

- Backend logs show in the terminal where you started it
- Frontend logs show in Expo dev server
- Database changes require `npx drizzle-kit push`
- Hot reload works for both frontend and backend code
