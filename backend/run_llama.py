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
import uuid
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Literal, Optional
from llama_cpp import Llama
import uvicorn
import argparse
import sys
import json

from backend.ask_monday_handler import ask_monday_stream

# Ensure PYTHONPATH is repo root regardless of current dir
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
    
os.environ['PYTHONPATH'] = REPO_ROOT
# --- CUDA/Persistent GPU OFFLOAD (set before import) ---
os.environ["LLAMA_CPP_FORCE_CUDA"] = "1"
os.environ["GGML_CUDA_FORCE_MMQ"] = "1"
os.environ["GGML_CUDA_PEER_ACCESS"] = "0,1"

# --- FastAPI + CORS ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- Model Config ---
MODEL_PATH = "/home/statiksmoke8/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf"  # CHANGE ME
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=4096,
    n_gpu_layers=35,
    main_gpu=1,         # 0 = first GPU, or 1 = second GPU
    TENSOR_SPLIT=[16, 19],
    n_threads=24,
    use_mmap=True,
    use_mlock=False,
    verbose=True,
)

class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[Message]
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9
    max_tokens: Optional[int] = 16184
    stop: Optional[List[str]] = None

@app.get("/")
def root():
    return {
        "message": "Mistral LLaMA API is live. Use POST /v1/chat/completions to interact."
    }

from fastapi.responses import StreamingResponse

@app.post("/v1/chat/completions")
def chat_completion(request: ChatRequest):
    # Build prompt
    prompt = (
        "".join(
            [f"{msg.role.capitalize()}: {msg.content.strip()}\n" for msg in request.messages]
        ) + "Assistant:"
    )

    def event_stream():
    global llm  # Required if you want to reset/reload the model

    # 1. Full Mistral answer (blocking, robust to token/context errors)
    try:
        output = llm(
            prompt=prompt,
            temperature=request.temperature,
            top_p=request.top_p,
            max_tokens=request.max_tokens,
            stop=request.stop or ["</s>", "User:", "Assistant:"],
        )
        mistral_answer = output["choices"][0]["text"].strip()
    except Exception as e:
        # Optionally: try to reload model on token/context error, then retry inference ONCE
        mistral_answer = f"[Mistral inference error: {e}]"
        if "token" in str(e).lower() or "context" in str(e).lower():
            try:
                llm = Llama(
                    model_path=MODEL_PATH,
                    n_ctx=4096,
                    n_gpu_layers=35,
                    main_gpu=1,
                    TENSOR_SPLIT=[16, 19],
                    n_threads=24,
                    use_mmap=True,
                    use_mlock=False,
                    verbose=True,
                )
                output = llm(
                    prompt=prompt,
                    temperature=request.temperature,
                    top_p=request.top_p,
                    max_tokens=request.max_tokens,
                    stop=request.stop or ["</s>", "User:", "Assistant:"],
                )
                mistral_answer = output["choices"][0]["text"].strip()
            except Exception as e2:
                mistral_answer = f"[Mistral reload error: {e2}]"

    # 2. Immediately yield Mistral result as first event
    yield json.dumps({"model": "mistral", "content": mistral_answer}) + "\n"

    # 3. Now stream ChatGPT’s result, chunk by chunk
    try:
        for chunk in ask_monday_stream(prompt):
            yield json.dumps({"model": "chatgpt", "delta": chunk}) + "\n"
    except Exception as e:
        yield json.dumps({"model": "chatgpt", "delta": f"[ERROR: {e}]"})
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000, help="Port to run server on")
    args = parser.parse_args()

    print(f"🚀 Devin-compatible API ready on http://localhost:{args.port}")
    uvicorn.run("run_llama:app", host="0.0.0.0", port=args.port)
