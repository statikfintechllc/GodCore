#!/bin/zsh

pkill -f react-scripts
pkill -f node        
pkill -f run_llama.py
lsof -ti:3000 | xargs -r kill -9
lsof -ti:8000 | xargs -r kill -9
pkill -f ngrok
for port in 8000 3000 7070 9973; do
  lsof -ti :$port | xargs -r kill -9
done
