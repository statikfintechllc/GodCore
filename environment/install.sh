#!/bin/zsh

set -e

ENV_NAME="runmistral"

echo "\n[*] Checking if conda env exists..."
if conda info --envs | grep -q "$ENV_NAME"; then
    echo "[*] Removing existing $ENV_NAME environment..."
    conda remove -y --name $ENV_NAME --all
fi

# --- Download Mistral-13B Model if missing ---
MODEL_DIR="models/Mistral-13B-Instruct"
MODEL_PATH="$MODEL_DIR/mistral-13b-instruct-v0.1.Q5_K_M.gguf"
MODEL_URL="https://huggingface.co/TheBloke/Mistral-13B-Instruct-v0.1-GGUF/resolve/main/mistral-13b-instruct-v0.1.Q5_K_M.gguf"

echo "[*] Checking for Mistral-13B model..."
mkdir -p "$MODEL_DIR"
if [ ! -f "$MODEL_PATH" ]; then
    echo "[*] Downloading Mistral-13B-Instruct Q5_K_M GGUF model..."
    curl -L --output "$MODEL_PATH" "$MODEL_URL"
    echo "[*] Model downloaded to $MODEL_PATH"
else
    echo "[*] Model already exists at $MODEL_PATH"
fi

echo "[*] Creating new $ENV_NAME environment from conda_env.yml..."
conda env create -f conda_env.yml

echo "[*] Activating $ENV_NAME..."
source ~/miniconda3/etc/profile.d/conda.sh
conda activate $ENV_NAME

# Optional: fallback to requirements.txt (shouldn't be needed unless pip-only install)
if ! conda info --envs | grep -q "$ENV_NAME"; then
    echo "[!] Conda env creation failed, falling back to pip install..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
fi

cd /home/statiksmoke8/godcore/frontend
source ~/miniconda3/etc/profile.d/conda.sh
conda activate runmistral
npm install
pip uninstall llama-cpp-python -y && CMAKE_ARGS="-DLLAMA_CUBLAS=on -DLLAMA_CUDA_FORCE_MMQ=on" pip install llama-cpp-python --force-reinstall --upgrade --no-cache-dir
python -c 'import torch; print(f"TORCH CUDA available: {torch.cuda.is_available()} - device count: {torch.cuda.device_count()}")'
conda deactivate

echo "[*] Verifying CUDA and GPU support..."
python -c 'import torch; print(f"TORCH CUDA available: {torch.cuda.is_available()}"); print(f"TORCH device count: {torch.cuda.device_count()}")'

echo "\n[*] Install complete. Activate with: conda activate $ENV_NAME"

