# Dev Diary & Gotchas

## The Wheel of Pain (Llama/Llava Wheel Build Hell)

- **Problem:**  
  Every time `llama-cpp-python` or Llava updated, CUDA support would break, and building a working Python wheel was a multi-day process.
- **Root Cause:**  
  Hidden in `llama_cpp/` are config checks like:
  ```bash
  if (LLAVA)
  if (GGML)
  if (DGGML)
  if (DLLAMA)
  ```
  Miss the right combo or option, and the build silently disables features or fails.
- **Solution:**  
  After much docs/source diving, I automated the right build flags into `./install.sh`. Now, just clone and run the installer—no headaches.
- **Lesson:**  
  When the build breaks, read the source, not just the error. And always check for sneaky conditional logic in CMake/bash.

---

**If you’re stuck, open an issue. If you fixed something, PR your solution so the next person doesn’t have to suffer.**

---

*“I killed this in 3 hours so you don’t have to lose 3 days. You’re welcome.”*
