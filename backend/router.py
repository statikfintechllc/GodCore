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
import sys
import time
import uuid
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Literal, Optional
from llama_cpp import Llama
import uvicorn
import argparse

from ask_monday_handler import ask_monday_stream

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

os.environ["PYTHONPATH"] = REPO_ROOT
os.environ["LLAMA_CPP_FORCE_CUDA"] = "1"
os.environ["GGML_CUDA_FORCE_MMQ"] = "1"
os.environ["GGML_CUDA_PEER_ACCESS"] = "0,1"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

MODEL_PATH = "/home/statiksmoke8/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf"
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
    session_id: Optional[str] = None  # Used for Monday session binding

@app.get("/")
def root():
    return {
        "message": "GodCore API live. Use /v1/chat/completions/[mistral|monday] endpoints."
    }

@app.post("/v1/chat/completions/mistral")
def completions_mistral(request: ChatRequest):
    prompt = (
        "".join(
            [
                f"{msg.role.capitalize()}: {msg.content.strip()}\n"
                for msg in request.messages
            ]
        )
        + "Assistant:"
    )
    global llm
    try:
        output = llm(
            prompt=prompt,
            temperature=request.temperature,
            top_p=request.top_p,
            max_tokens=request.max_tokens,
            stop=request.stop or ["</s>", "User:", "Assistant:"],
        )
        mistral_answer = output["choices"][0]["text"].strip()
        return {"model": "mistral", "content": mistral_answer}
    except Exception as e:
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
                return {"model": "mistral", "content": mistral_answer}
            except Exception as e2:
                mistral_answer = f"[Mistral reload error: {e2}]"
        return {"model": "mistral", "content": mistral_answer}

from fastapi.responses import StreamingResponse

@app.post("/v1/chat/completions/monday")
def completions_monday(request: ChatRequest):
    # ---- Validate session_id presence ----
    if not request.session_id or not isinstance(request.session_id, str):
        raise HTTPException(status_code=400, detail="Missing or invalid session_id for Monday binding.")
    prompt = (
        "".join(
            [
                f"{msg.role.capitalize()}: {msg.content.strip()}\n"
                for msg in request.messages
            ]
        )
        + "Assistant:"
    )

    def stream():
        try:
            # Always forward session_id to handler
            for chunk in ask_monday_stream(prompt, session_id=request.session_id):
                yield json.dumps({"model": "monday", "delta": chunk}) + "\n"
        except Exception as e:
            yield json.dumps({"model": "monday", "delta": f"[ERROR: {e}]"}) + "\n"
    return StreamingResponse(stream(), media_type="text/event-stream")

@app.post("/v1/chat/completions")
def completions_both(request: ChatRequest):
    # This endpoint runs both, for legacy/mux mode
    prompt = (
        "".join(
            [
                f"{msg.role.capitalize()}: {msg.content.strip()}\n"
                for msg in request.messages
            ]
        )
        + "Assistant:"
    )

    def event_stream():
        global llm
        # ---- Mistral first ----
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
            mistral_answer = f"[Mistral inference error: {e}]"
        yield json.dumps({"model": "mistral", "content": mistral_answer}) + "\n"
        # ---- Monday streaming (session_id optional for legacy) ----
        try:
            for chunk in ask_monday_stream(prompt, session_id=request.session_id):
                yield json.dumps({"model": "monday", "delta": chunk}) + "\n"
        except Exception as e:
            yield json.dumps({"model": "monday", "delta": f"[ERROR: {e}]"}) + "\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000, help="Port to run server on")
    args = parser.parse_args()
    print(f"🚀 GodCore API ready on http://localhost:{args.port}")
    uvicorn.run("run_llama:app", host="0.0.0.0", port=args.port)
