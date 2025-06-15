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
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Literal, Optional
from llama_cpp import Llama
import uvicorn
import argparse
import sys

# --- CUDA/Persistent GPU OFFLOAD (set before import) ---
os.environ["LLAMA_CPP_FORCE_CUDA"] = "1"
os.environ["GGML_CUDA_FORCE_MMQ"] = "1"
os.environ["GGML_CUDA_PEER_ACCESS"] = "0"

# --- FastAPI + CORS ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Config ---
MODEL_PATH = "/home/statiksmoke8/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf"
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=4096,
    n_gpu_layers=35,    # FULL offload for 13B, always use all available
    main_gpu=0,    # 0 = first GPU, you can set this to 1 if desired
    TENSOR_SPLIT=[20, 20],    # Split evenly for two 3060s
    n_threads=24,    # Only affects CPU, low = more GPU work, high = more CPU
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
    max_tokens: Optional[int] = 16384
    stop: Optional[List[str]] = None

@app.get("/")
def root():
    return {
        "message": "Mistral LLaMA API is live. Use POST /v1/chat/completions to interact."
    }

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    prompt = (
        "".join(
            [
                f"{msg.role.capitalize()}: {msg.content.strip()}\n"
                for msg in request.messages
            ]
        )
        + "Assistant:"
    )
    try:
        # Streaming token output
        def generate():
            try:
                for chunk in llm(
                    prompt=prompt,
                    temperature=request.temperature,
                    top_p=request.top_p,
                    max_tokens=request.max_tokens,
                    stop=request.stop or ["</s>", "User:", "Assistant:"],
                    stream=True,  # CRITICAL: enable streaming
                ):
                    token = chunk["choices"][0]["text"]
                    yield f'data: {token}\n\n'
            except Exception as e:
                yield f'data: [Mistral inference error: {str(e)}]\n\n'

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        # Return OpenAI-style error
        return JSONResponse(status_code=500, content={"error": "InferenceFailure", "detail": str(e)})

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000, help="Port to run server on")
    parser.add_argument(
        "--host", type=str, default="0.0.0.0", help="Host to run server on"
    )
    args = parser.parse_args()

    print(f"🚀 Devin-compatible API ready on http://{args.host}:{args.port}")
    uvicorn.run("MIS_handler:app", host=args.host, port=args.port)
