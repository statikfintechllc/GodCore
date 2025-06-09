#!/bin/zsh

set -e

# --- Config ---
ENV_NAME="runmistral"
BACKEND_DIR="$(pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=3000
FRONTEND_DIR="$BACKEND_DIR/frontend"
BACKEND_LOG="$BACKEND_DIR/run_llama.log"
FRONTEND_LOG="$FRONTEND_DIR/frontend.log"
BACKEND_FILE="$BACKEND_DIR/run_llama.py"

# --- Function: Start Backend (run_llama.py) ---
start_backend() {
    echo "\n[*] Starting backend (run_llama.py)..."
    cd "$BACKEND_DIR"
    if [ ! -f "$BACKEND_FILE" ]; then
        echo "[FATAL] Backend file $BACKEND_FILE not found! Aborting." >&2
        exit 1
    fi
    source ~/miniconda3/etc/profile.d/conda.sh || { echo '[FATAL] Could not source conda. Aborting.'; exit 1; }
    conda activate $ENV_NAME || { echo '[FATAL] Could not activate env. Aborting.'; exit 1; }
    # Make sure backend binds to 0.0.0.0 (edit your run_llama.py to use 0.0.0.0 as host)
    nohup python "$BACKEND_FILE" > "$BACKEND_LOG" 2>&1 &
    echo "[*] Backend log: $BACKEND_LOG"
    sleep 8  # Wait for backend to load model
}

# --- Function: Start Frontend (React) ---
start_frontend() {
    echo "\n[*] Starting frontend (React)..."
    cd "$FRONTEND_DIR"
    if [ ! -d node_modules ]; then
        npm install
    fi
    # Start on 0.0.0.0 for remote access
    nohup HOST=0.0.0.0 npm start > "$FRONTEND_LOG" 2>&1 &
    echo "[*] Frontend log: $FRONTEND_LOG"
}

# --- Main Execution ---
echo "\n[*] Launching Godcore Mistral Full Stack..."

start_backend
start_frontend

echo "\n[*] Both backend and frontend are starting up."
echo "    Backend: http://localhost:$BACKEND_PORT"
echo "    Frontend: http://localhost:$FRONTEND_PORT"
echo "[*] To stop: pkill -f run_llama.py && pkill -f react-scripts"
echo "[*] Tail logs: tail -f $BACKEND_LOG $FRONTEND_LOG"

# Wait for frontend to be ready
echo "[*] Waiting for frontend to be ready on port $FRONTEND_PORT..."
for i in {1..30}; do
  if lsof -i:$FRONTEND_PORT | grep LISTEN; then
    echo "[+] Frontend running on port $FRONTEND_PORT"
    break
  fi
  sleep 1
done

# --- ngrok Tunnel ---
echo "[*] Starting ngrok tunnel to frontend (http://localhost:$FRONTEND_PORT)..."

python3 <<EOF > ngrok_url.txt
from pyngrok import ngrok
try:
    tunnel = ngrok.connect($FRONTEND_PORT, "http", bind_tls=True)
    print(tunnel.public_url)
except Exception as e:
    print(f"[NGROK ERROR] {e}")
EOF

NGROK_URL=$(cat ngrok_url.txt | grep "https://" || true)
if [[ -z "$NGROK_URL" ]]; then
    echo "[FATAL] ngrok did not return a valid URL. See above for errors."
    exit 1
fi
echo "[+] ngrok tunnel is live: $NGROK_URL"

# --- QR Code ---
if command -v qrencode > /dev/null; then
    echo "\n[+] Scan this QR code with your phone to open the UI:"
    echo "$NGROK_URL" | qrencode -t ansiutf8
else
    echo "[!] qrencode not installed. Install with: sudo apt install qrencode"
fi

echo "\n[+] Open this URL on your phone to access the UI:"
echo "$NGROK_URL"
echo "\n[*] Done."

# Clean up
rm -f ngrok_url.txt
