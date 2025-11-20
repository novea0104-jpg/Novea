#!/bin/bash

# Start backend server in background
echo "🚀 Starting Backend API on port 3000..."
PORT=3000 npx tsx server/index.ts &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start frontend Expo server
echo "📱 Starting Expo Frontend..."
EXPO_PACKAGER_PROXY_URL=https://$REPLIT_DEV_DOMAIN REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN npx expo start

# If expo exits, kill backend
kill $BACKEND_PID 2>/dev/null
