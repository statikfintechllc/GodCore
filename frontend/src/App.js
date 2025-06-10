import React, { useState, useRef, useEffect } from "react";
import "./App.css";

// Optionally allow backend URL override (not used in fetch below, but safe to keep)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Import your logos (ensure these paths are correct)
import AppIcon from "./Icon_Logo/App_Icon_&_Loading_&_Inference_Image.png";

from fastapi.middleware.cors import CORSMiddleware;

# Always allow both your local and any public ngrok origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # For production: use exact ngrok URL(s) and localhost, but '*' is easiest for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const newUserMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-13b-instruct",
          messages: [
            ...messages,
            newUserMsg,
          ],
        }),
      });

      const data = await res.json();
      if (data.choices && data.choices[0]?.message?.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.choices[0].message.content },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "API error: No response from backend." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "API error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg">
      <div className="main-content">
        <div className="header">
          <img src={AppIcon} alt="App Logo" className="app-logo" />
          <span className="main-title">
            GodCore-The Experiment, yet{" "}
            <span className="smart-red-shadow">Smart</span>
          </span>
        </div>
        <div className="chat-history">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "ai-bubble"}`}
            >
              <span>{msg.content}</span>
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
          />
          <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;

