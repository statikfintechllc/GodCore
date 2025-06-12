#!/usr/bin/env python3

# ─────────────────────────────────────────────────────────────
# ⚠️ GodCore Open-Use | Commercial Use allowed
# Built under the GodCore Open-Use License v.0.3.0
# © 2025 StatikFintechLLC / GodCore Project
# Contact: ascend.gremlin@gmail.com
# ─────────────────────────────────────────────────────────────

# GodCore v.0.3.0 :: Module Integrity Directive
# This script is a component of the GodCore system, under Alpha expansion.

import os
import time
import pyautogui
import pyperclip
import pytesseract
import subprocess
import platform
from PIL import ImageGrab, Image
from datetime import datetime, timedelta
from pathlib import Path

# Uncomment when embedding/memory features are ready
# from memory.vector_store.embedder import embed_text, package_embedding, inject_watermark
# from memory.log_history import log_event

# WATERMARK = "source:GodCore"
# ORIGIN = "ask_monday_handler"

SCREENSHOT_DIR = Path(os.path.expanduser("data/logs/screenshots"))
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

MEMORY_DIR = Path(os.path.expanduser("data/logs/chat_responses"))
MEMORY_DIR.mkdir(parents=True, exist_ok=True)


def launch_chatgpt():
    """Launch native ChatGPT client based on platform."""
    try:
        system = platform.system()
        if system == "Linux":
            subprocess.Popen(["gtk-launch", "chatgpt"])
        elif system == "Windows":
            subprocess.Popen(["start", "", "ChatGPT"], shell=True)
        else:
            raise RuntimeError("Unsupported OS for launching ChatGPT.")
        time.sleep(5)
        pyautogui.click()
    except Exception as e:
        print(f"[ASK] Failed to launch ChatGPT: {e}")


def paste_and_enter(text):
    pyperclip.copy(text)
    pyautogui.hotkey("ctrl", "v")
    time.sleep(1)
    pyautogui.press("enter")


def ask_monday_stream(prompt, interrupt_checker=None):
    """
    Stream OCR'd content block by block as ChatGPT responds.
    Streams for up to 3.5 minutes unless interrupted.
    """
    print(f"[ASK] Asking ChatGPT: {prompt}")
    launch_chatgpt()
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


def ask_monday(prompt):
    # Kept for legacy sync use; not used for streaming
    print(f"[ASK] Asking ChatGPT: {prompt}")
    launch_chatgpt()
    paste_and_enter(prompt)
    time.sleep(10)
    screenshot = ImageGrab.grab()
    text = pytesseract.image_to_string(screenshot)
    response = text.strip() if text else ""
    # Optionally save to memory
    # save_to_memory(prompt, response)
    return {"prompt": prompt, "response": response}


# FSM-compatible entry point
def handle(task):
    prompt = task.get("target") or task.get("text") or "What is your task?"
    return ask_monday(prompt)


# Standalone test
if __name__ == "__main__":
    example = "Explain EMA crossover for penny stocks under 10 dollars."
    for chunk in ask_monday_stream(example):
        print(chunk)
