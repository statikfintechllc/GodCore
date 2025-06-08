# GodCore Llama Mistral-13B Demo

**Local LLM (llama.cpp) with Mistral-13B model**
- FastAPI backend (OpenAI-compatible route: `/v1/chat/completions`)
- Custom React dashboard (full-feature, modern UI)
- All-in-one repo, fully wired and ready

---

## **Directory Layout**

```text
godcore/
├── README.md
├── LICENSE
├── start_all.sh
├── stop_all.sh
│
├── environment/
│       ├── install.sh
│       ├── conda_env.yml
│       └── requirements.txt
│
├── frontend/
│   │   ├── package.json
│   │   └── pack
│   │
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── App.css
│   │
│   └── node_modules/     # All node_modules are built here
│       └── ...
│
├── llama-cpp-python/        
│       └── ...           # All llama-cpp-python files and folders here
│
├── models/
│       └── Mistral-13B-Instruct/
│                  └── mistral-13b-instruct-v0.1.Q5_K_M.gguf  # Need to download
│
└── tests/
      └── test_api.py
```

---

## **Install & Setup**

```bash
# 1. Clone and get in
git clone https://github.com/statikfintechllc/godcore.git && \
cd godcore

# 2. Install all dependencies and set up environment
cd environment && ./install.sh

# 3. After install.sh runs place your downloaded model file here:
#    godcore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf

# 4. Activate the environment
conda activate runmistral
```

## **Start the Full Stack**

```bash
# From godcore/ root:
cd godcore && ./start_all.sh

# This will:
#   - Launch the FastAPI backend (localhost:8000)
#   - Launch the React frontend (localhost:3000)
```

## **Manual Start** *(Advanced/Debug)*

> Start backend only:

```bash
conda activate runmistral
python run_llama.py
# (Backend API live at http://localhost:8000)
```

> Start frontend only:

```bash
cd frontend
npm install   # (first time only)
npm start     # (Frontend live at http://localhost:3000)
```

---

## **API Spec**
1. POST /v1/chat/completions
- OpenAI-compatible: send {"model": ..., "messages": ...}
- See frontend/src/App.js for example usage.

2. Model Download
- Download the GGUF file for Mistral-13B-Instruct (e.g. Q4 or Q5_K_M) from TheBloke on HuggingFace.

3. Place in:
- godcore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf

---

## **Stop All Services**

```bash
zsh stop_all.sh
# (Kills backend and frontend processes)
```

---

