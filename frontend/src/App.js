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
  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar modal state
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

  // Modern, **JSON-safe** chat POST — displays ONLY the assistant's text (not the raw JSON).
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    appendMsg(userMsg);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-13b-instruct",
          messages: [...(sessions[currentSession]?.messages || []), userMsg],
        }),
      });
      const data = await res.json();
      let msgContent =
        data?.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : "API error: No response from backend.";
      const monday = (data.model && data.model.toLowerCase().includes("monday"));
      appendMsg({ role: "assistant", content: msgContent, monday });
    } catch (err) {
      appendMsg({ role: "assistant", content: "API error: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  // New chat session
  const handleNewChat = (e) => {
    e?.stopPropagation();
    const sid = makeId();
    setCurrentSession(sid);
    setSessions(prev => ({ ...prev, [sid]: { title: ts(), created: Date.now(), messages: [] }}));
    if (isMobile) setSidebarOpen(false);
  };

  const switchSession = (sid, e) => {
    e?.stopPropagation();
    setSidebarOpen(false);
    setCurrentSession(sid);
  };

  // Sidebar rendering (responsive)
  const renderSidebar = () => (
    <>
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="sidebar">
          <div className="sidebar-title">Chat Sessions</div>
          <button className="sidebar-new" onClick={handleNewChat}>+ New Chat</button>
          <div className="sidebar-list">
            {Object.entries(sessions)
              .sort((a, b) => b[1].created - a[1].created)
              .map(([sid, sess]) => (
                <div
                  key={sid}
                  className={`sidebar-item${sid === currentSession ? " active" : ""}`}
                  onClick={(e) => switchSession(sid, e)}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <div className="sidebar-label">{sess.title}</div>
                  <div className="sidebar-count">{(sess.messages||[]).length}</div>
                </div>
            ))}
          </div>
        </aside>
      )}
      {/* Mobile: floating tab button + animated modal sidebar */}
      {isMobile && (
        <>
          <button
            className="sidebar-tab-toggle"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >☰</button>
          <div
            className={`sidebar-modal${sidebarOpen ? " active" : ""}`}
            style={{
              pointerEvents: sidebarOpen ? "auto" : "none",
              opacity: sidebarOpen ? 1 : 0,
              transition: "opacity 0.25s cubic-bezier(.44,.05,.77,.41)"
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <nav
              className="sidebar"
              style={{
                height:"100vh",
                minWidth: "65vw",
                maxWidth: "97vw",
                transform: sidebarOpen ? "translateX(0%)" : "translateX(-110%)",
                boxShadow: sidebarOpen ? "12px 0 32px #000a" : undefined,
                transition: "transform 0.39s cubic-bezier(.57,.21,.69,1.25)",
                background: "#222228",
                zIndex: 202,
                overflowY: "auto"
              }}
              onClick={e => e.stopPropagation()}
            >
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
                      onClick={(e) => switchSession(sid, e)}
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="sidebar-label">{sess.title}</div>
                      <div className="sidebar-count">{(sess.messages||[]).length}</div>
                    </div>
                ))}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );

  // Main chat area
  return (
    <div className="app-bg">
      <div className="main-content" style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: isMobile ? "column" : "row"
      }}>
        {renderSidebar()}
        <main className="chat-main-area">
          <header className="header" style={{background: "none"}}>
            <img src={AppIcon} alt="App Logo" className="app-logo" />
            <span className="main-title">
              GodCore-The Experiment, yet <span className="smart-red-shadow">Smart</span>
            </span>
          </header>
          <section className="chat-history">
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
          </section>
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
        </main>
      </div>
    </div>
  );
}

export default App;
