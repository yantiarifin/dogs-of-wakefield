#!/bin/sh
# Double-click this in Finder to serve the gallery and open it in a browser.
# The page reads portraits.json over fetch(), which browsers block on file://
# URLs, so it has to be served rather than opened directly.

cd "$(dirname "$0")" || exit 1

PORT=8899

# Reuse an already-running server on this port rather than failing to bind.
if curl -s -o /dev/null "http://localhost:$PORT/index.html"; then
  echo "Server already running on port $PORT."
else
  echo "Starting server on port $PORT..."
  python3 -m http.server "$PORT" &
  SERVER_PID=$!
  trap 'kill $SERVER_PID 2>/dev/null' EXIT INT TERM
  sleep 1
fi

open "http://localhost:$PORT"

echo
echo "Gallery running at http://localhost:$PORT"
echo "Close this window or press Ctrl-C to stop the server."
echo

# Hold the window open so the server keeps running.
while true; do sleep 3600; done
