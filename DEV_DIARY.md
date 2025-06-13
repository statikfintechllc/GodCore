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

# GodCore: Dev Diary & Gotchas

</div>

---

## v0.3.0 Progress Log

### Rapid Prototyping & Key Milestones

- **Sunday–Wednesday, v0.1.0 → v0.3.0**  
  *Part-time (~4 hours a day, 3 days):*
    - Prototyped a full 5T GPT wrapper enabling **free usage of ChatGPT (alpha)** with seamless local integration.
    - Developed **persistent chat memory in the UI**; chat history is now stored in system storage and reloads reliably.
    - UI is now fully operational—live chat, local memory, fast reloads, and robust error handling.
    - Repo is reproducible from zero; every install script tested E2E.

---

## The Wheel of Pain (Llama/Llava Wheel Build Hell)

- **Problem:**  
  Every time `llama-cpp-python` or Llava updated, CUDA support would break, and building a working Python wheel was a multi-day process.

- **Root Cause:**  
  Hidden in `llama_cpp/` are config checks like:

      if (LLAVA)
      if (GGML)
      if (DGGML)
      if (DLLAMA)

  Miss the right combo or option, and the build silently disables features or fails.

- **Solution:**  
  After much docs/source diving, I automated the right build flags into `./install.sh`. Now, just clone and run the installer—no headaches.

- **Lesson:**  
  When the build breaks, read the source, not just the error. And always check for sneaky conditional logic in CMake/bash.

---

**If you’re stuck, open an issue. If you fixed something, PR your solution so the next person doesn’t have to suffer.**

---

*“I killed this in 3 hours so you don’t have to lose 3 days. You’re welcome.”*

---
