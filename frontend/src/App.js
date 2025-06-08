import React, { useState } from "react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function sendPrompt() {
    setLoading(true);
    setError("");
    setResponse("");
    setCopied(false);
    try {
      const r = await fetch("http://localhost:8000/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral",
          messages: [
            { role: "user", content: prompt }
          ]
        }),
      });
      if (!r.ok) {
        throw new Error(`Server returned ${r.status}`);
      }
      const data = await r.json();
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        setResponse(data.choices[0].message.content.trim());
      } else if (data.error) {
        setError("API error: " + (data.detail || data.error));
      } else {
        setError("Unknown API response format.");
      }
    } catch (err) {
      setError("API error: " + err.message);
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <div className="root">
      <div className="card">
        <h1>Mistral-13B <span className="sub">llama.cpp</span> Chat UI</h1>
        <textarea
          rows={4}
          className="prompt"
          placeholder="Type your prompt here..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
        <button className="send" onClick={sendPrompt} disabled={loading || !prompt.trim()}>
          {loading ? "Processing..." : "Send"}
        </button>
        {error && <div className="error">{error}</div>}
        {response && (
          <div className="result">
            <pre>{response}</pre>
            <button className="copy" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
          </div>
        )}
      </div>
      <footer>
        <span>Powered by Mistral-13B | <a href="https://github.com/statikfintechllc" target="_blank" rel="noopener noreferrer">Statik DK Smoke</a></span>
      </footer>
    </div>
  );
}

export default App;

