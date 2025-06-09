<link rel="stylesheet" type="text/css" href="docs/custom.css">
<div align="center">
  <a
href="https://github.com/statikfintechllc/GodCore/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/Open%20Use-black?style=for-the-badge&logo=dragon&logoColor=gold" alt="Fair Use License"/>
  </a>
  <a href="https://github.com/statikfintechllc/GodCore/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/GodCore%20v.0.1.0-darkred?style=for-the-badge&logo=dragon&logoColor=gold" alt="GremlinGPT License"/>
  </a>
</div>
<div align="center">
  <a
href="https://github.com/statikfintechllc/AscendAI/blob/master/About Us/WHY_GREMLINGPT.md">
    <img src="https://img.shields.io/badge/See-black?style=for-the-badge&logo=dragon&logoColor=gold" alt="Why"/>
  </a>
  <a href="https://github.com/statikfintechllc/AscendAI/blob/master/About Us/WHY_GREMLINGPT.md">
    <img src="https://img.shields.io/badge/GremlinGPT-darkred?style=for-the-badge&logo=dragon&logoColor=gold" alt="GremlinGPT"/>
  </a>

# GodCore Llama Mistral-13B Demo
*V.0.3.0 will be the bug removal and Perfecting the simple install.*
</div>

**Local LLM (llama.cpp) with Mistral-13B model**
> FastAPI backend (OpenAI-compatible route: `/v1/chat/completions`)
> Custom React dashboard (full-feature, modern UI)
> All-in-one repo, fully wired and ready

---

> Documentation is updated frequently. If you see an issue, submit a PR or open an issue!

---

## **Directory Layout**

```text
godcore/
├── README.md
├── LICENSE
├── launch_ngrok-UI.sh
├── run_llama.py
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
└── models/
        └── Mistral-13B-Instruct/
                  └── mistral-13b-instruct-v0.1.Q5_K_M.gguf  # Is downloaded by install.sh to GodCore/environment/

```

## **Install & Setup**

```bash
# 1. Clone and get in
git clone https://github.com/statikfintechllc/GodCore.git && \
cd GodCore

# 2. Install all dependencies and set up environment
cd environment && ./install.sh

# 3. After install.sh runs place your downloaded model file here:
#    /path/to/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf

# 4. Activate the environment
conda activate runmistral
cd frontend/
source ~/miniconda3/etc/profile.d/conda.sh
conda activate runmistral
npm install
```

*Inside run_llama.py Change this to match your system:*

```bash
MODEL_PATH = "/path/to/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf"          #CHANGE ME
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
> *Soon debunk, and bug free*

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

## 📡 Remote Access (ngrok) Setup

1. [Register for ngrok](https://ngrok.com/) and copy your **auth token** from your [dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).
2. On your system:
    ```sh
    ngrok config add-authtoken <YOUR_TOKEN_HERE>
    ```
3. Run the launch script:
    ```sh
    ./launch_ngrok-UI.sh
    ```
4. **Scan the QR code** shown in your terminal or **open the printed ngrok URL** in your phone’s browser.

Your GremlinGPT UI is now instantly accessible from your phone or any remote device.

## **API Spec**
1. POST /v1/chat/completions
- OpenAI-compatible: send {"model": ..., "messages": ...}
- See frontend/src/App.js for example usage.

2. Model Download
- Downloaded by install.sh is Mistral-13B-Instruct (e.g. Q5_K_M) from TheBloke on HuggingFace, to GodCore/environment.

3. Place the model file in:

```bash
/path/to/godcore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf
```

---

## **Stop All Services**

```bash
./stop_all.sh
# (Kills backend and frontend processes)
```

---

<h1 align="center">AscendAI Traffic</h1>
<div align="center">
  <a href="https://raw.githubusercontent.com/statikfintechllc/AscendAI/main/docs/traffic_graph.png">
  <img src="https://raw.githubusercontent.com/statikfintechllc/AscendAI/main/docs/traffic_graph.png" alt="Traffic Graph" />
  </a>
</div>
  
<div align="center">
  <em>
Reset: After 7:00pm CST on First 2 Clones
  </em>
</div>

---

## 🚨 Known Issues & Breaking Changes (Last Updated: 2025-06-09)

- **Llava wheel upgrade (June 2025):**  
  Recent update to Llava introduced a new Python wheel that breaks old installs.  
  **Solution:** See [llama-cpp-python/README.md#installation] for correct wheel and pip flags.  
  _If you get errors about incompatible architecture or missing symbols, re-install with the new wheel instructions. My install.sh builds clean Cuda Wheel every time if you remove your old runmistral environment._

- **General advice:**
- I built this to fully install amd build proper the furst try, you can use this soley for a gpu llama wheel build by adjusting the environment name in the .yml file in GodCore/environment.
  - Always check Python version compatibility (see `environment/conda_env.yml`).
  - If you run into dependency issues, try a clean install (`conda remove --all`, then fresh `install.sh`).
  - Report any new issues in [GitHub Issues](https://github.com/statikfintechllc/GodCore/issues).
