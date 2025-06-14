<link rel="stylesheet" type="text/css" href="docs/custom.css">
<div align="center">
  <a
href="https://github.com/statikfintechllc/GodCore/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/FAIR%20USE-black?style=for-the-badge&logo=dragon&logoColor=gold" alt="Fair Use License"/>
  </a>
  <a href="https://github.com/statikfintechllc/GodCore/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/GREMLINGPT%20v1.0.3-darkred?style=for-the-badge&logo=dragon&logoColor=gold" alt="GremlinGPT License"/>
  </a>
</div>

<div align="center">
  <a
href="https://github.com/statikfintechllc/GodCore/blob/master/About Us/WHY_GREMLINGPT.md">
    <img src="https://img.shields.io/badge/Why-black?style=for-the-badge&logo=dragon&logoColor=gold" alt="Why"/>
  </a>
  <a href="https://github.com/statikfintechllc/GodCore/blob/master/About Us/WHY_GREMLINGPT.md">
    <img src="https://img.shields.io/badge/GremlinGPT-darkred?style=for-the-badge&logo=dragon&logoColor=gold" alt="GremlinGPT"/>
  </a>
</div>

  <div align="center">
  <a href="https://ko-fi.com/statikfintech_llc">
    <img src="https://img.shields.io/badge/Support-black?style=for-the-badge&logo=dragon&logoColor=gold" alt="Support"/>
  </a>
  <a href="https://patreon.com/StatikFinTech_LLC?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink">
    <img src="https://img.shields.io/badge/SFTi-darkred?style=for-the-badge&logo=dragon&logoColor=gold" alt="SFTi"/>
  </a>
</div>
  
# GodCore Llama Mistral-13B Expirament

> **Currently in the middle of adding a main feature — Switch between Local and "Cloud" ChatGPT Chatting non-api.**
> 
> **Stay tuned if this intrigues you.**

---

*Documentation is updated frequently. If you see an issue, submit a PR or open an issue!*

---

## **Directory Layout**
</div>

```text
GodCore/
│
├── README.md
├── LICENSE
├── DEV_DIARY.md
│
├── backend/
│    │
│    ├── launch_ngrok-UI.sh
│    ├── start_all.sh
│    ├── GPT_handler.py
│    ├── MIS_handler.py
│    ├── router.py
│    ├── stop_all.sh
│    │
│    ├── llama-cpp-python/
│    │    │
│    │    └── ...    # All llama-cpp-python files and folders here
│    │
│    └── logs/
│         │
│         ├── backend.log
│         ├── router.log
│         ├── MIS.log
│         ├── GPT.log
│         ├── frontend.log
│         │
│         ├── chat_responses/
│         │   │
│         │   └── ...    # All chatgpt files here
│         │
│         └── screenshots/
│             │
│             └── ...    # All screenshots here
│
├── environment/
│         │
│         ├── install.sh
│         ├── conda_env.yml
│         └── requirements.txt
│
└── frontend/
    │     │
    │     ├── package.json
    │     └── package-lock.json
    │
    ├── public/
    │     │
    │     └── index.html
    │
    ├── src/
    │     │
    │     ├── App.js
    │     ├── setupProxy.js
    │     ├── index.js
    │     └── App.css
    │
    └── node_modules/
          │
          └── ...    # All node_modules are built here
```

---

<div align="center">

  *V.0.3.0 will be the Background image bug removal for mobile(Done), Proper Alignment of contents in the SideBar on Mobile(Done), as well as proper Hide-away side bar on DeskTop(In-Progress). And The Addition Of the GPT_handler.py, router.py, and setupProxy.js.(In-Progress)*

</div>

---

**🚀 Built by a Solo Engineer, Not a Prompt Engineer**

- *This system—GodCore—was built in 5 days, from scratch, by one hands-on builder.*
- *No coding background. No team. It’s a persistent, multi-brain LLM dashboard.
- *Local Mistral and free ChatGPT, streaming UI, persistent chat history, and instant mobile access (QR/ngrok).*

**If you want to hire a doer, not a talker, contact me:**

**ascend.gremlin@gmail.com** | *[Ko-fi](https://ko-fi.com/statikfintech_llc)* | *[Patreon](https://patreon.com/StatikFinTech_LLC?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink)*

or

**ascend.help@gmail.com** | *[Ko-fi](https://ko-fi.com/statikfintech_llc)* | *[Patreon](https://patreon.com/StatikFinTech_LLC?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink)*

---

## **Install & Setup**

```bash
# 1. Clone and get in
git clone https://github.com/statikfintechllc/GodCore.git && \
cd GodCore

# 2. Install all dependencies and set up environment
cd environment && ./install.sh && \

# 3. After install.sh runs it places's your downloaded model file here:(Always double check)
# /path/to/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf

# 4. Activate the environment
conda activate runmistral && \
cd .. && cd frontend/ && \
source ~/miniconda3/etc/profile.d/conda.sh && \
conda activate runmistral && \
npm install
```

*Inside environment/install.sh Change this "/path/to/", so it matches your system:*

```bash
MODEL_PATH = "/path/to/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf"          #CHANGE ME
```

*Inside run_llama.py Change this to match your system:*

```bash
MODEL_PATH = "/path/to/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf"          #CHANGE ME
```

## **Start the Full Stack**

```bash
cd backend && \
./start_all.sh

# This will:
#   - Launch the FastAPI backend (localhost:8000)
#   - Launch the React frontend (localhost:3000)
```

## **Manual Start** *(Advanced/Debug)*
*Soon debunk, and bug free*

> Start backend only:

```bash
conda activate runmistral && \
python run_llama.py
# (Backend API live at http://localhost:8000)
```

> Start frontend only:

```bash
cd frontend && \
npm install && \   # (first time only)
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
    cd backend && \
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
> *install.sh does this for you, but checking is good*
```bash
/your/path/to/GodCore/models/Mistral-13B-Instruct/mistral-13b-instruct-v0.1.Q5_K_M.gguf
```

---

## **Stop All Services**

```bash
cd backend
./stop_all.sh
# (Kills backend and frontend processes)
```

---

**The Local LLM (llama.cpp) with Mistral-13B model**
> FastAPI backend
> OpenAI-compatible route: `/v1/chat/completions`
> Custom React dashboard (full-feature, modern UI)
> All-in-one repo, fully wired and ready

**The Cloud LLM (ChatGPT) with GPT_handler**
> Same as Local
> State-of-the-Art OCR and Scrapping with live feed text-extraction
>     - That’s the wild “screen scrape” automation you’re running with pytesseract + pyautogui for GPT_handler.
>     - You’re not just doing “API call,” you’re doing live window wrangling.

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

## 🚨 Known Issues & Breaking Changes (Last Updated(by myself): 2025-06-09)

- **Llava wheel upgrade (I found it in early June 2025):**  
  Recent update to Llava introduced a new Python wheel that breaks old installs.  
  **Solution:** See [llama-cpp-python/README.md#installation] for correct wheel and pip flags.  
  _If you get errors about incompatible architecture or missing symbols, re-install with the new wheel instructions. My install.sh builds clean Cuda Wheel every time if you remove your old runmistral environment._

- **General advice:**
- I built this to fully install amd build proper the furst try, you can use this soley for a gpu llama wheel build by adjusting the environment name in the .yml file in GodCore/environment.
  - Always check Python version compatibility (see `environment/conda_env.yml`).
  - If you run into dependency issues, try a clean install (`conda remove --all`, then fresh `install.sh`).
  - Report any new issues in [GitHub Issues](https://github.com/statikfintechllc/GodCore/issues).
