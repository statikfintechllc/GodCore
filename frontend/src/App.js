import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";
import AppIcon from "./Icon_Logo/App_Icon_&_Loading_&_Inference_Image.png";

function ts() {
  return new Date().toLocaleString(undefined, { hour12: false }).replace(/:\d{2}$/, "");
}
function makeId() {
  return "chat_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
}
function getBubbleClass(role, isMonday) {
  if (role === "user") return "chat-bubble user-bubble";
  if (isMonday) return "chat-bubble monday-bubble";
  return "chat-bubble ai-bubble";
}
function CodeBlock({ className, children }) {
  return (
    <pre className={className || "block"} style={{ background: "#14141a", borderRadius: 10, padding: 12, overflowX: "auto" }}>
      <code>{children}</code>
    </pre>
  );
}

// Utility for streaming JSONL from Monday/ChatGPT backend
async function* streamJSONL(response) {
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let lines = buffer.split("\n");
    buffer = lines.pop();
    for (let line of lines) {
      line = line.trim();
      if (line) yield line;
    }
  }
  if (buffer.trim()) yield buffer.trim();
}

function App() {
  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar modal state (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chat sessions and UI state
  const [sessions, setSessions] = useState(() => {
    const raw = localStorage.getItem("godcore_sessions");
    return raw ? JSON.parse(raw) : {};
  });
  const [currentSession, setCurrentSession] = useState(() => {
    const sid = localStorage.getItem("godcore_current") || makeId();
    return sid;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Model picker state
  const [targetModel, setTargetModel] = useState("monday");

  // Ensure at least one session exists
  useEffect(() => {
    if (!sessions[currentSession]) {
      setSessions(prev => ({
        ...prev,
        [currentSession]: {
          title: ts(),
          created: Date.now(),
          messages: [],
          session_id: currentSession // Store session_id here
        }
      }));
    }
  }, [currentSession, sessions]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("godcore_sessions", JSON.stringify(sessions));
    localStorage.setItem("godcore_current", currentSession);
  }, [sessions, currentSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSession]);

  // Message appenders
  const appendMsg = (msg) => {
    setSessions(prev => {
      const updated = { ...prev };
      const session = updated[currentSession] || {
        title: ts(),
        created: Date.now(),
        messages: [],
        session_id: currentSession
      };
      session.messages = [...(session.messages || []), msg];
      updated[currentSession] = session;
      return updated;
    });
  };

  // Used by streaming handler to update last assistant message "live"
  const updateLastAssistantMsg = (content, monday) => {
    setSessions(prev => {
      const updated = { ...prev };
      const session = updated[currentSession] || {
        title: ts(),
        created: Date.now(),
        messages: [],
        session_id: currentSession
      };
      const idx = (session.messages || []).map(m => m.role).lastIndexOf("assistant");
      if (idx >= 0) {
        session.messages = [
          ...session.messages.slice(0, idx),
          { role: "assistant", content, monday }
        ];
      } else {
        session.messages = [...(session.messages || []), { role: "assistant", content, monday }];
      }
      updated[currentSession] = session;
      return updated;
    });
  };

  // Delete chat
  const handleDeleteChat = (sid, e) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = { ...prev };
      delete updated[sid];
      let newCurrent = currentSession;
      if (sid === currentSession) {
        const remaining = Object.keys(updated);
        newCurrent = remaining.length ? remaining[0] : makeId();
        if (!updated[newCurrent]) {
          updated[newCurrent] = {
            title: ts(),
            created: Date.now(),
            messages: [],
            session_id: newCurrent
          };
        }
      }
      setCurrentSession(newCurrent);
      return updated;
    });
  };

  // ---- Mistral (NO streaming, normal POST) ----
  const handleSendMistral = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    appendMsg(userMsg);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/v1/chat/completions/mistral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-13b-instruct",
          messages: [...(sessions[currentSession]?.messages || []), userMsg],
        }),
      });
      const data = await res.json();
      let msgContent =
        data?.content
          ? data.content
          : "API error: No response from Mistral backend.";
      appendMsg({ role: "assistant", content: msgContent, monday: false });
    } catch (err) {
      appendMsg({ role: "assistant", content: "API error: " + err.message, monday: false });
    } finally {
      setLoading(false);
    }
  };

  // ---- Monday (ChatGPT, streaming JSONL) ----
  const handleSendMonday = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    appendMsg(userMsg);
    setInput("");
    setLoading(true);

    let accumulated = "";
    let gotChunk = false;
    let errorMsg = null;

    // Use actual session_id stored on the session object
    const session_id = sessions[currentSession]?.session_id || currentSession;

    try {
      const res = await fetch("/v1/chat/completions/monday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "monday",
          session_id,
          messages: [...(sessions[currentSession]?.messages || []), userMsg],
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      for await (const line of streamJSONL(res)) {
        if (line === "[END_OF_RESPONSE]") break;
        let obj = null;
        try { obj = JSON.parse(line); } catch { continue; }
        if (obj && obj.delta) {
          gotChunk = true;
          accumulated += obj.delta + "\n";
          updateLastAssistantMsg(
            accumulated.trim(),
            obj.model && obj.model.toLowerCase().includes("monday")
          );
        }
      }

      if (!gotChunk) {
        errorMsg = "No response received from backend (is it running?)";
      }
    } catch (err) {
      errorMsg = `API error: ${err.message}`;
    } finally {
      if (errorMsg) {
        appendMsg({ role: "assistant", content: errorMsg, monday: true });
      }
      setLoading(false);
    }
  };

  // Universal "send" dispatcher
  const handleSend = (e) => {
    if (targetModel === "monday") {
      handleSendMonday(e);
    } else {
      handleSendMistral(e);
    }
  };

  // New chat session (now includes unique session_id!)
  const handleNewChat = () => {
    const sid = makeId();
    setCurrentSession(sid);
    setSessions(prev => ({
      ...prev,
      [sid]: {
        title: ts(),
        created: Date.now(),
        messages: [],
        session_id: sid // unique for each chat
      }
    }));
    if (isMobile) setSidebarOpen(false);
  };

  const switchSession = (sid) => {
    setCurrentSession(sid);
    if (isMobile) setSidebarOpen(false);
  };

  // Sidebar rendering (desktop or modal/mobile)
  const sidebarContent = (
    <>
      <div className="sidebar-title">Chat Sessions</div>
      <button className="sidebar-new" onClick={handleNewChat}>+ New Chat</button>
      <div className="sidebar-list">
        {Object.entries(sessions)
          .sort((a, b) => b[1].created - a[1].created)
          .map(([sid, sess]) => (
            <div
              key={sid}
              className={`sidebar-item${sid === currentSession ? " active" : ""}`}
              onClick={() => switchSession(sid)}
              tabIndex={0}
              style={{ cursor: "pointer", position: "relative" }}
            >
              <div className="sidebar-label">{sess.title}</div>
              <div className="sidebar-count">{(sess.messages || []).length}</div>
              <button
                className="sidebar-delete-btn"
                title="Delete chat"
                onClick={e => handleDeleteChat(sid, e)}
                tabIndex={-1}
              >🗑️</button>
            </div>
          ))}
      </div>
    </>
  );

  return (
    <div>
      <div className="app-bg" />
      <div className="main-content">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="sidebar">{sidebarContent}</div>
        )}

        {/* Mobile: Sidebar tab & modal overlay */}
        {isMobile && (
          <>
            <button
              className="sidebar-tab-toggle"
              style={{
                display: "block",
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: 110
              }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >☰</button>
            {sidebarOpen && (
              <div
                className="sidebar-modal active"
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  position: "fixed",
                  zIndex: 201,
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(20,20,24,0.85)",
                  alignItems: "flex-start"
                }}
              >
                <div
                  className="sidebar"
                  style={{
                    height: "100vh",
                    minWidth: "65vw",
                    background: "#222228",
                    zIndex: 202,
                    overflowY: "auto"
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        background: "none", color: "#fff", fontSize: "2rem", border: "none", padding: 12, cursor: "pointer"
                      }}
                      aria-label="Close sidebar"
                    >×</button>
                  </div>
                  {sidebarContent}
                </div>
              </div>
            )}
          </>
        )}

        {/* Chat main area */}
        <div className="chat-main-area">
          <div className="header" style={{ background: "none" }}>
            <img src={AppIcon} alt="App Logo" className="app-logo" />
            <span className="main-title">
              GodCore-The Experiment, yet <span className="smart-red-shadow">Smart</span>
            </span>
          </div>
          <div className="chat-history">
            {(sessions[currentSession]?.messages || []).map((msg, idx) => (
              <div key={idx} className={getBubbleClass(msg.role, msg.monday)}>
                <ReactMarkdown
                  children={msg.content}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return !inline ? (
                        <CodeBlock className={className}>{children}</CodeBlock>
                      ) : (
                        <code className={className} style={{ background: "#23232a", borderRadius: 4, padding: "1px 6px" }} {...props}>{children}</code>
                      );
                    },
                    pre({ node, ...props }) {
                      return <pre style={{ background: '#14141a', borderRadius: 10, padding: 10, overflowX: 'auto' }} {...props} />;
                    }
                  }}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              className="chat-input"
              type="text"
              value={input}
              disabled={loading}
              placeholder={loading ? "Waiting for response..." : "Type your message..."}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>
              {loading ? "..." : "Send"}
            </button>
            <select
              value={targetModel}
              onChange={e => setTargetModel(e.target.value)}
              disabled={loading}
              style={{ marginLeft: 8, borderRadius: 5, padding: "6px 8px", background: "#19191e", color: "#fff" }}
              aria-label="Choose model"
            >
              <option value="monday">Monday (ChatGPT, Live)</option>
              <option value="mistral">Mistral (Fast, One-shot)</option>
            </select>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
