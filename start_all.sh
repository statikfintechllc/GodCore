#!/bin/zsh

set -e

# --- Config ---
ENV_NAME="runmistral"
BACKEND_DIR="$(pwd)"
FRONTEND_DIR="$BACKEND_DIR/frontend"
BACKEND_LOG="$BACKEND_DIR/run_llama.log"
FRONTEND_LOG="$FRONTEND_DIR/frontend.log"

# --- Function: Start Backend (run_llama.py) ---
start_backend() {
    echo "\n[*] Starting backend (run_llama.py)..."
    cd "$BACKEND_DIR"
    conda activate $ENV_NAME
    nohup python run_llama.py > "$BACKEND_LOG" 2>&1 &
    echo "[*] Backend log: $BACKEND_LOG"
    sleep 8  # Wait for backend to load Mistral-13B, can adjust if needed
}

# --- Function: Start Frontend (React) ---
start_frontend() {
    echo "\n[*] Starting frontend (React)..."
    cd "$FRONTEND_DIR"
    # Always ensure node modules are present
    if [ ! -d node_modules ]; then
        npm install
    fi
    nohup npm start > "$FRONTEND_LOG" 2>&1 &
    echo "[*] Frontend log: $FRONTEND_LOG"
}

# --- Main Execution ---
echo "\n[*] Launching Godcore Mistral Full Stack..."

start_backend
start_frontend

echo "\n[*] Both backend and frontend are starting up."
echo "    Backend: http://localhost:8000"
echo "    Frontend: http://localhost:3000"
echo "[*] To stop: pkill -f run_llama.py && pkill -f react-scripts"
echo "[*] Tail logs: tail -f $BACKEND_LOG $FRONTEND_LOG"
