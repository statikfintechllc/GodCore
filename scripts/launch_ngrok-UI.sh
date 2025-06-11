#!/bin/zsh

cd "$(dirname "$0")/.."
export PYTHONPATH="$PWD"

set -e

# --- Config ---
ENV_NAME="runmistral"
BACKEND_DIR="$(pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=3000
FRONTEND_DIR="$BACKEND_DIR/frontend"
BACKEND_LOG="$BACKEND_DIR/scripts/run_llama.log"
FRONTEND_LOG="$FRONTEND_DIR/frontend.log"
BACKEND_FILE="$BACKEND_DIR/scripts/run_llama.py"

export LLAMA_CPP_FORCE_CUDA=1
export GGML_CUDA_FORCE_MMQ=1
export GGML_CUDA_PEER_ACCESS=0

# --- Function: Activate Conda and Env ---
activate_conda() {
    source ~/miniconda3/etc/profile.d/conda.sh || { echo '[FATAL] Could not source conda. Aborting.'; exit 1; }
    conda activate $ENV_NAME || { echo '[FATAL] Could not activate env. Aborting.'; exit 1; }
}

# --- Function: Get Local IP Address ---
get_local_ip() {
    ip addr | awk '/inet / && $2 !~ /^127/ {split($2,a,"/"); print a[1]; exit}'
}

# --- Function: Start Backend (run_llama.py) ---
start_backend() {
    echo "\n[*] Starting backend (run_llama.py)..."
    cd "$BACKEND_DIR"
    if [ ! -f "$BACKEND_FILE" ]; then
        echo "[FATAL] Backend file $BACKEND_FILE not found! Aborting." >&2
        exit 1
    fi
    nohup python "$BACKEND_FILE" > "$BACKEND_LOG" 2>&1 &
    echo "[*] Backend log: $BACKEND_LOG"
}

# --- Function: Start Frontend (React) ---
start_frontend() {
    echo "\n[*] Starting frontend (React)..."
    cd "$FRONTEND_DIR"
    if [ ! -d node_modules ]; then
        npm install
    fi
    nohup npm start > "$FRONTEND_LOG" 2>&1 &
    echo "[*] Frontend log: $FRONTEND_LOG"
}

# --- Main Execution ---
echo "\n[*] Launching Godcore Mistral Full Stack with ngrok (frontend tunnel)..."

activate_conda
start_backend
sleep 5
start_frontend

# --- Print ALL Accessible URLs ---
LOCAL_IP=$(get_local_ip)
echo "\n[*] Both backend and frontend are starting up."
echo "    Backend (localhost):    http://localhost:$BACKEND_PORT"
echo "    Backend (LAN):         http://$LOCAL_IP:$BACKEND_PORT"
echo "    Frontend (localhost):  http://localhost:$FRONTEND_PORT"
echo "    Frontend (LAN):        http://$LOCAL_IP:$FRONTEND_PORT"
echo "[*] To stop: pkill -f run_llama.py && pkill -f react-scripts"
echo "[*] Tail logs: tail -f $BACKEND_LOG $FRONTEND_LOG"

# --- Wait for frontend to be ready ---
echo "[*] Waiting for frontend to be ready on port $FRONTEND_PORT..."
success=0
for i in {1..30}; do
  if lsof -i:$FRONTEND_PORT | grep LISTEN; then
    echo "[+] Frontend running on port $FRONTEND_PORT"
    success=1
    break
  fi
  sleep 1
done

if [ $success -eq 0 ]; then
  echo "[FATAL] Frontend did not start on port $FRONTEND_PORT after 30 seconds!"
  echo "==== Last 40 lines of frontend log ===="
  tail -40 "$FRONTEND_LOG"
  exit 1
fi

# --- Start ngrok in the background ---
echo "[*] Starting ngrok tunnel to frontend (http://$LOCAL_IP:$FRONTEND_PORT)..."

# Kill any previous ngrok sessions just in case
pkill -f "ngrok http $FRONTEND_PORT" || true

# Launch ngrok in the background, writing logs to a temp file
NGROK_LOG="/tmp/ngrok.log"
ngrok http $FRONTEND_PORT --log=stdout > "$NGROK_LOG" 2>&1 &

# Wait for ngrok to start and print the public URL
NGROK_URL=""
for i in {1..20}; do
  NGROK_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.ngrok-free\.app" "$NGROK_LOG" | head -n1)
  if [[ -n "$NGROK_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$NGROK_URL" ]]; then
    echo "[FATAL] ngrok did not return a valid URL. See log below:"
    tail -20 "$NGROK_LOG"
    exit 1
fi
echo "[+] ngrok tunnel is live: $NGROK_URL"

# --- QR Code for ngrok (global access) ---
if command -v qrencode > /dev/null; then
    echo "\n[+] Scan this QR code with your phone to open the UI (ANYWHERE):"
    echo "$NGROK_URL" | qrencode -t ansiutf8
    echo "\n[+] Or open this URL on your phone: $NGROK_URL"
else
    echo "[!] qrencode not installed. Install with: sudo apt install qrencode"
fi

# --- QR Code for local LAN access (home/office only) ---
LAN_URL="http://$LOCAL_IP:$FRONTEND_PORT"
if command -v qrencode > /dev/null; then
    echo "\n[+] Scan this QR code with your phone to open the UI (LAN only):"
    echo "$LAN_URL" | qrencode -t ansiutf8
    echo "\n[+] Or open this URL on your phone: $LAN_URL"
fi
echo "\n[+] Open this URL on your phone to access the UI:"
echo "$NGROK_URL"
echo "\n[*] Done."

# Optionally: Do not clean up $NGROK_LOG in case you want to review ngrok output

