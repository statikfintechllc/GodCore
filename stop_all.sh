#!/bin/zsh
for port in 8000 3000 7070 9973; do
  lsof -ti :$port | xargs -r kill -9
done

# Kill backend on port 8000
lsof -ti:8000 | xargs -r kill

# Kill frontend on port 3000
lsof -ti:3000 | xargs -r kill

echo "[*] Killing backend and frontend..."
pkill -f run_llama.py
pkill -f react-scripts
pkill -f launch_ngrok-UI.sh

