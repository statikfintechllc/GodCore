#!/usr/bin/env zsh

cd "$(dirname "$0")/.."       # Always go to repo root from scripts/
export PYTHONPATH="$PWD"

pkill -f react-scripts
pkill -f node        
pkill -f router.py
pkill -f ngrok

for port in 3000 8000 8080 8088 7070 9973; do
  lsof -ti :$port | xargs -r kill -9
done
