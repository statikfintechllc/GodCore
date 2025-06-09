#!/bin/zsh

set +e  # Never exit on command failure

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


echo "[*] All targeted backend and frontend processes have been checked and killed if running."

