#!/bin/zsh

set +e  # Never exit on command failure

echo "[*] Starting full kill of backend and frontend (robust mode)..."

kill_and_log() {
    local desc="$1"
    local cmd="$2"
    echo "[*] Attempting: $desc"
    eval "$cmd"
    local status=$?
    if [[ $status -eq 0 ]]; then
        echo "[+] Success: $desc"
    else
        echo "[!] Nothing killed (or error) for: $desc"
    fi
}

# 1. By explicit Python script
kill_and_log "pkill run_llama.py" 'pkill -f run_llama.py'

# 2. By react process
kill_and_log "pkill react-scripts" 'pkill -f react-scripts'

# 3. By port 8000
PIDS_8000=$(lsof -ti:8000)
if [[ -n "$PIDS_8000" ]]; then
    echo "[*] Found PIDs on port 8000: $PIDS_8000"
    echo "$PIDS_8000" | xargs kill
    echo "[+] Killed processes on port 8000"
else
    echo "[!] No process found on port 8000"
fi

# 4. By port 3000
PIDS_3000=$(lsof -ti:3000)
if [[ -n "$PIDS_3000" ]]; then
    echo "[*] Found PIDs on port 3000: $PIDS_3000"
    echo "$PIDS_3000" | xargs kill
    echo "[+] Killed processes on port 3000"
else
    echo "[!] No process found on port 3000"
fi

# 5. By port 9973
PIDS_9973=$(lsof -ti:9973)
if [[ -n "$PIDS_9973" ]]; then
    echo "[*] Found PIDs on port 9973: $PIDS_9973"
    echo "$PIDS_9973" | xargs kill
    echo "[+] Killed processes on port 9973"
else
    echo "[!] No process found on port 9973"
fi

# 6. By common backend names (redundant sweeps)
kill_and_log "pkill uvicorn" 'pkill -f "uvicorn"'
kill_and_log "pkill npm start" 'pkill -f "npm start"'
kill_and_log "pkill yarn start" 'pkill -f "yarn start"'

echo "[*] All targeted backend and frontend processes have been checked and killed if running."

