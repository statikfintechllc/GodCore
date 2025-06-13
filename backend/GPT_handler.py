#!/usr/bin/env python3

# ─────────────────────────────────────────────────────────────
# ⚠️ GodCore Open-Use | Commercial Use allowed
# Built under the GodCore Open-Use License v.0.3.0
# © 2025 StatikFintechLLC / GodCore Project
# Contact: ascend.gremlin@gmail.com
# ─────────────────────────────────────────────────────────────

# GodCore v.0.3.0 :: Module Integrity Directive
# This script is a component of the GodCore system, under Alpha expansion.

import subprocess
import platform
import time
import os
import pyautogui
import pyperclip
import pytesseract
from PIL import ImageGrab
from datetime import datetime, timedelta
from pathlib import Path
import json
import argparse

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn

SESSION_WINDOWS = {}

def list_chatgpt_windows():
    """Return a dict mapping window IDs to titles for all ChatGPT windows."""
    out = subprocess.check_output(["wmctrl", "-lx"]).decode()
    return {
        line.split()[0]: line for line in out.strip().splitlines()
        if "chatgpt" in line.lower()
    }

def focus_window(window_id):
    subprocess.run(["wmctrl", "-ia", window_id])
    time.sleep(0.7)  # Give focus time to swap

def launch_chatgpt_for_session(session_id):
    """Ensure ChatGPT instance for session_id exists, focus it, else launch and bind."""
    if session_id in SESSION_WINDOWS and SESSION_WINDOWS[session_id]:
        focus_window(SESSION_WINDOWS[session_id])
        return
    before = set(list_chatgpt_windows().keys())
    subprocess.Popen(["gtk-launch", "chatgpt"])
    time.sleep(4)
    after = list_chatgpt_windows()
    new_windows = set(after.keys()) - before
    if not new_windows:
        raise RuntimeError("Failed to launch new ChatGPT window")
    win_id = list(new_windows)[0]
    SESSION_WINDOWS[session_id] = win_id
    focus_window(win_id)

def paste_and_enter(text):
    pyperclip.copy(text)
    pyautogui.hotkey("ctrl", "v")
    time.sleep(1)
    pyautogui.press("enter")

def ask_monday_stream(prompt, session_id=None, interrupt_checker=None):
    print(f"[ASK] Asking ChatGPT (session {session_id}): {prompt}")
    launch_chatgpt_for_session(session_id or "default")
    paste_and_enter(prompt)
    last_text = ""
    start_time = datetime.utcnow()
    max_duration = timedelta(minutes=3.5)
    while True:
        now = datetime.utcnow()
        if now - start_time > max_duration:
            break
        if interrupt_checker and interrupt_checker():
            print("[ASK] Streaming interrupted by backend.")
            break
        time.sleep(2.5 if last_text == "" else 1.5)
        screenshot = ImageGrab.grab()
        text = pytesseract.image_to_string(screenshot)
        if text and text.strip() and text != last_text:
            last_text = text
            yield json.dumps({"model": "chatgpt", "delta": text.strip()}) + "\n"
        pyautogui.scroll(-500)
    yield "[END_OF_RESPONSE]"

# Legacy for non-stream mode, uses same binding logic
def ask_monday(prompt, session_id=None):
    print(f"[ASK] Asking ChatGPT (session {session_id}): {prompt}")
    launch_chatgpt_for_session(session_id or "default")
    paste_and_enter(prompt)
    time.sleep(10)
    screenshot = ImageGrab.grab()
    text = pytesseract.image_to_string(screenshot)
    response = text.strip() if text else ""
    return {"prompt": prompt, "response": response}

def handle(task):
    prompt = task.get("target") or task.get("text") or "What is your task?"
    session_id = task.get("session_id", None)
    return ask_monday(prompt, session_id=session_id)

# ==== FastAPI Server for Web API ====

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ChatGPT handler is live. POST to /v1/chat/completions"}

@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    try:
        body = await request.json()
        prompt = body.get("target") or body.get("text") or ""
        session_id = body.get("session_id", None)
        # Streaming response
        async def streamer():
            for chunk in ask_monday_stream(prompt, session_id=session_id):
                yield f"data: {chunk}\n\n"
        return StreamingResponse(streamer(), media_type="text/event-stream")
    except Exception as e:
        async def errstream():
            yield f"data: [ERROR: {str(e)}]\n\n"
        return StreamingResponse(errstream(), media_type="text/event-stream")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8080, help="Port to run server on")
    parser.add_argument('--host', type=str, default="0.0.0.0", help="Host to run server on")
    args = parser.parse_args()

    print(f"🚀 ChatGPT handler API ready on http://{args.host}:{args.port}")
    uvicorn.run("GPT_handler:app", host=args.host, port=args.port)
