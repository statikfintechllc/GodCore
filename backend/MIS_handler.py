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
import json
import argparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Literal, Optional
from llama_cpp import Llama
import uvicorn

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
    TENSOR_SPLIT=[20, 20],
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

def stream_completion(prompt, temperature, top_p, max_tokens, stop):
    global llm
    cumulative = ""
    idx = 0
    try:
        for chunk in llm(
            prompt=prompt,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            stop=stop or ["</s>", "User:", "Assistant:"],
            stream=True,
        ):
            token = chunk["choices"][0]["text"]
            cumulative += token
            data = {
                "id": "chatcmpl-stream",  # Placeholder, for full compat you might want to use uuid4
                "object": "chat.completion.chunk",
                "created": int(os.environ.get("EPOCH", 0) or __import__("time").time()),
                "model": "mistral",
                "choices": [
                    {
                        "delta": {"content": token},
                        "index": idx,
                        "finish_reason": None,
                    }
                ],
                "cumulative": cumulative
            }
            idx += 1
            yield f"data: {json.dumps(data)}\n\n"
        # Stream a final chunk with finish_reason
        yield f"data: {json.dumps({'choices':[{'delta': {}, 'index': idx, 'finish_reason': 'stop'}]})}\n\n"
    except Exception as e:
        error_data = {"error": str(e)}
        yield f"data: {json.dumps(error_data)}\n\n"

@app.post("/v1/chat/completions")
def chat_completion(request: ChatRequest):
    prompt = (
        "".join([f"{msg.role.capitalize()}: {msg.content.strip()}\n" for msg in request.messages])
        + "Assistant:"
    )
    return StreamingResponse(
        stream_completion(
            prompt,
            request.temperature,
            request.top_p,
            request.max_tokens,
            request.stop,
        ),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000, help="Port to run server on")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to run server on")
    args = parser.parse_args()
    print(f"🚀 SOTA Streaming Mistral API ready on http://{args.host}:{args.port}")
    uvicorn.run("run_llama:app", host=args.host, port=args.port)
