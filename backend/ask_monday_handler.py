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
from datetime import datetime
from pathlib import Path

# I will uncomment whenI finish adding embedding/memory features
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
            subprocess.Popen(["gdk-launch", "chatgpt"])
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

def ask_monday_stream(prompt):
    """Stream OCR'd content block by block as ChatGPT responds."""
    print(f"[ASK] Asking ChatGPT: {prompt}")
    launch_chatgpt()
    paste_and_enter(prompt)
    last_text = ""
    for i in range(5):  # up to 5 scrolls (can adjust for longer sessions)
        time.sleep(2.5 if i == 0 else 1.5)
        screenshot = ImageGrab.grab()
        text = pytesseract.image_to_string(screenshot)
        if text and text.strip() and text != last_text:
            last_text = text
            yield text.strip()
        pyautogui.scroll(-500)
    yield "[END]"

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
