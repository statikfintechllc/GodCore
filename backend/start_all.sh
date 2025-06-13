#!/bin/zsh

set -e

# Always run from backend directory
cd "$(dirname "$0")"

# --- Config ---
ENV_NAME="runmistral"
BACKEND_DIR="$(pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=3000
FRONTEND_DIR="$BACKEND_DIR/../frontend"
FRONTEND_LOG="$BACKEND_DIR/logs/frontend.log"
BACKEND_LOG="$BACKEND_DIR/logs/backend.log"
BACKEND_FILE="$BACKEND_DIR/router.py"

echo "BACKEND_DIR: $BACKEND_DIR"
echo "FRONTEND_DIR: $FRONTEND_DIR"
echo "BACKEND_LOG: $BACKEND_LOG"
echo "FRONTEND_LOG: $FRONTEND_LOG"

export LLAMA_CPP_FORCE_CUDA=1
export GGML_CUDA_FORCE_MMQ=1
export GGML_CUDA_PEER_ACCESS=0

# --- Function: Start Backend (run_llama.py) ---
start_backend() {
    echo "\n[*] Starting backend (router.py)..."
    cd "$BACKEND_DIR"
    if [ ! -f "$BACKEND_FILE" ]; then
        echo "[FATAL] Backend file $BACKEND_FILE not found! Aborting." >&2
        exit 1
    fi
    source ~/miniconda3/etc/profile.d/conda.sh || { echo '[FATAL] Could not source conda. Aborting.'; exit 1; }
    conda activate $ENV_NAME || { echo '[FATAL] Could not activate env. Aborting.'; exit 1; }
    nohup python "$BACKEND_FILE" > "$BACKEND_LOG" 2>&1 &
    echo "[*] Backend log: $BACKEND_LOG"
    sleep 8  # Wait for backend to load Mistral-13B, can adjust if needed
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
echo "\n[*] Launching Godcore Mistral Full Stack..."

start_backend
start_frontend

echo "\n[*] Both backend and frontend are starting up."
echo "    Backend: http://localhost:8000"
echo "    Frontend: http://localhost:3000"
echo "[*] To stop: pkill -f run_llama.py && pkill -f react-scripts"
echo "[*] Tail logs: tail -f $BACKEND_LOG $FRONTEND_LOG"

FRONTEND_URL="http://localhost:3000"
LAN_IP=$(hostname -I | awk '{print $1}')
LAN_URL="http://$LAN_IP:3000"

echo "\n[*] Access frontend via:"
echo "    $FRONTEND_URL"
echo "    $LAN_URL"
echo "\n[*] Scan QR code below (LAN):"

python3 -c "
import qrcode
import sys
qr = qrcode.QRCode(border=2)
qr.add_data('$LAN_URL')
qr.make(fit=True)
qr.print_ascii(invert=True)
" || echo "Install python 'qrcode' module to print QR code."
