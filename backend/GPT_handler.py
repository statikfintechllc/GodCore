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

SESSION_WINDOWS = {}

def list_chatgpt_windows():
    """Return a dict mapping window IDs to titles for all ChatGPT windows."""
    out = subprocess.check_output(["wmctrl", "-lx"]).decode()
    # Example output line:
    # 0x04600005 -1 N/A   chatgpt.Chatgpt  hostname  ChatGPT
    return {
        line.split()[0]: line for line in out.strip().splitlines()
        if "chatgpt" in line.lower()
    }

def focus_window(window_id):
    subprocess.run(["wmctrl", "-ia", window_id])
    time.sleep(0.7)  # Give focus time to swap

def launch_chatgpt_for_session(session_id):
    """Ensure ChatGPT instance for session_id exists, focus it, else launch and bind."""
    # Already launched?
    if session_id in SESSION_WINDOWS and SESSION_WINDOWS[session_id]:
        focus_window(SESSION_WINDOWS[session_id])
        return
    # Else: launch new and bind
    before = set(list_chatgpt_windows().keys())
    subprocess.Popen(["gtk-launch", "chatgpt"])
    time.sleep(4)
    after = list_chatgpt_windows()
    new_windows = set(after.keys()) - before
    if not new_windows:
        raise RuntimeError("Failed to launch new ChatGPT window")
    # Bind to session_id
    win_id = list(new_windows)[0]
    SESSION_WINDOWS[session_id] = win_id
    focus_window(win_id)

def paste_and_enter(text):
    pyperclip.copy(text)
    pyautogui.hotkey("ctrl", "v")
    time.sleep(1)
    pyautogui.press("enter")

def ask_monday_stream(prompt, session_id=None, interrupt_checker=None):
    """
    Stream OCR'd content block by block as ChatGPT responds, bound to session window.
    """
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

if __name__ == "__main__":
    example = "Explain EMA crossover for penny stocks under 10 dollars."
    session_id = "demo-session"
    for chunk in ask_monday_stream(example, session_id=session_id):
        print(chunk)
