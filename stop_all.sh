#!/bin/zsh
echo "[*] Killing backend and frontend..."
pkill -f run_llama.py
pkill -f react-scripts

