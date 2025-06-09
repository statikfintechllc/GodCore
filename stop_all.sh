#!/bin/zsh

# Kill backend on port 8000
lsof -ti:8000 | xargs -r kill

# Kill backend on port 9973
lsof -ti:9973 | xargs -r kill

# Kill frontend on port 3000
lsof -ti:3000 | xargs -r kill

# Extra: kill by process name (as fallback)
pkill -f "uvicorn"
pkill -f "react-scripts"
pkill -f "npm start"
pkill -f "yarn start"

echo "[*] All backend and frontend processes killed."

echo "[*] Killing backend and frontend..."
pkill -f run_llama.py
pkill -f react-scripts

