import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";
import AppIcon from "./Icon_Logo/App_Icon_&_Loading_&_Inference_Image.png";

function ts() {
  return new Date().toLocaleString(undefined, { hour12: false }).replace(/:\d{2}$/, "");
}
function makeId() {
  return "chat_" + Date.now() + "_" + Math.floor(Math.random()*10000);
}
function getBubbleClass(role, isMonday) {
  if (role === "user") return "chat-bubble user-bubble";
  if (isMonday) return "chat-bubble monday-bubble";
  return "chat-bubble ai-bubble";
}
function CodeBlock({ className, children }) {
  return (
    <pre className={className || "block"} style={{background:"#14141a", borderRadius:10, padding:12, overflowX:"auto"}}>
      <code>{children}</code>
    </pre>
  );
}

function App() {
  // Mobile sidebar modal state
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

  // Ensure at least one session exists
  useEffect(() => {
    if (!sessions[currentSession]) {
      setSessions(prev => ({
        ...prev,
        [currentSession]: { title: ts(), created: Date.now(), messages: [] }
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

  const appendMsg = (msg) => {
    setSessions(prev => {
      const updated = { ...prev };
      const session = updated[currentSession] || { title: ts(), created: Date.now(), messages: [] };
      session.messages = [...(session.messages || []), msg];
      updated[currentSession] = session;
      return updated;
    });
  };

  // Stream-aware send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    appendMsg(userMsg);
    setInput("");
    setLoading(true);

    let buffer = "";
    let lastMsgIndex = null;
    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-13b-instruct",
          messages: [...(sessions[currentSession]?.messages || []), userMsg],
        }),
      });
      if (res.body && res.body.getReader) {
        // Streaming (futureproof; backend may need chunked streaming)
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let monday = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            try {
              const data = JSON.parse(buffer);
              let content = data.choices?.[0]?.message?.content || "";
              if (data.model && data.model.toLowerCase().includes("monday")) monday = true;
              if (content) {
                setSessions(prev => {
                  const updated = {...prev};
                  let msgs = [...(updated[currentSession].messages || [])];
                  if (lastMsgIndex == null) {
                    msgs.push({ role: "assistant", content, monday });
                    lastMsgIndex = msgs.length - 1;
                  } else {
                    msgs[lastMsgIndex] = { role: "assistant", content, monday };
                  }
                  updated[currentSession].messages = msgs;
                  return updated;
                });
              }
            } catch {}
          }
        }
        setSessions(prev => {
          const updated = {...prev};
          let msgs = [...(updated[currentSession].messages || [])];
          if (lastMsgIndex == null) {
            msgs.push({ role: "assistant", content: buffer, monday: false });
          } else {
            msgs[lastMsgIndex] = { role: "assistant", content: buffer, monday: false };
          }
          updated[currentSession].messages = msgs;
          return updated;
        });
      } else {
        // No stream
        const data = await res.json();
        let msgContent = data.choices?.[0]?.message?.content || "";
        const monday = (data.model && data.model.toLowerCase().includes("monday"));
        appendMsg({ role: "assistant", content: msgContent, monday });
      }
    } catch (err) {
      appendMsg({ role: "assistant", content: "API error: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  // New chat session
  const handleNewChat = () => {
    const sid = makeId();
    setCurrentSession(sid);
    setSessions(prev => ({ ...prev, [sid]: { title: ts(), created: Date.now(), messages: [] }}));
  };

  const switchSession = (sid) => {
    setSidebarOpen(false);
    setCurrentSession(sid);
  };

  // Single, de-duplicated sidebar rendering
  const renderSidebar = () => (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar">
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
              >
                <div className="sidebar-label">{sess.title}</div>
                <div className="sidebar-count">{(sess.messages||[]).length}</div>
              </div>
          ))}
        </div>
      </div>
      {/* Mobile: floating tab button */}
      <button
        className="sidebar-tab-toggle"
        style={{
          display: window.innerWidth <= 900 ? "block" : "none",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 100,
          background: "#1b1d28ee",
          color: "#fff",
          border: "none",
          borderRadius: "0 0 14px 0",
          fontSize: "1.55rem",
          padding: "9px 25px 10px 16px",
          cursor: "pointer"
        }}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >☰</button>
      <div className={`sidebar-modal${sidebarOpen ? " active" : ""}`} onClick={() => setSidebarOpen(false)}>
        <div className="sidebar" style={{height:"100vh", minWidth: "65vw"}} onClick={e => e.stopPropagation()}>
          <div style={{textAlign:"right"}}>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: "none", color:"#fff", fontSize:"2rem", border:"none", padding:12, cursor:"pointer"
              }}
              aria-label="Close sidebar"
            >×</button>
          </div>
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
                >
                  <div className="sidebar-label">{sess.title}</div>
                  <div className="sidebar-count">{(sess.messages||[]).length}</div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // Main chat area
  return (
    <div className="app-bg">
      <div className="main-content">
        {renderSidebar()}
        <div className="chat-main-area">
          <div className="header" style={{background: "none"}}>
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
                        <code className={className} style={{background:"#23232a", borderRadius:4, padding:"1px 6px"}} {...props}>{children}</code>
                      );
                    },
                    pre({node, ...props}) {
                      return <pre style={{background:'#14141a', borderRadius:10, padding:10, overflowX:'auto'}} {...props} />;
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
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
