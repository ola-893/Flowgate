#!/usr/bin/env bash
set -e

# Start server and client dev servers in parallel
# Trap Ctrl+C to kill both processes on exit

cleanup() {
  echo -e "\n🛑 Shutting down..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  wait $SERVER_PID $CLIENT_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting server (port 3001)..."
(cd server && npm run dev) &
SERVER_PID=$!

echo "🌐 Starting client (port 3000)..."
(cd client && npm run dev) &
CLIENT_PID=$!

echo ""
echo "✅ Both servers running:"
echo "   Server: http://localhost:3001"
echo "   Client: http://localhost:3000"
echo ""

# Wait for either process to exit
wait
