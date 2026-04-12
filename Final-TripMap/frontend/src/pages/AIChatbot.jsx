import React, { useState } from "react";

export default function AIChatbot({ context }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text:
        "Hi! I'm your AI Travel Copilot 🤖\n\n" +
        "Ask me about:\n" +
        "• Your itinerary\n" +
        "• Budget & savings\n" +
        "• Health & safety\n" +
        "• Nearby food & places\n" +
        "• Weather & best travel tips"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Call backend AI endpoint
  async function fetchAIResponse(message) {
    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context
        })
      });

      const data = await res.json();
      return data.reply || "AI did not return a response.";
    } catch (err) {
      return "⚠ AI service is offline. Make sure Ollama + backend server are running.";
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { from: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const aiText = await fetchAIResponse(input);

    const botReply = { from: "bot", text: aiText };
    setMessages((m) => [...m, botReply]);
    setLoading(false);
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
  onClick={() => setOpen(true)}
  style={{
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 99999,
    background: "red",
    color: "white",
    padding: "20px",
    borderRadius: "50%"
  }}
>
  CHAT
</button>


      {/* CHAT PANEL */}
      {open && (
        <div className="fixed bottom-6 right-6 w-80 h-[28rem] bg-white text-black rounded-2xl shadow-2xl z-50 flex flex-col">
          {/* HEADER */}
          <div className="bg-purple-600 text-white p-3 rounded-t-2xl flex justify-between items-center">
            <span className="font-bold">AI Travel Copilot</span>
            <button onClick={() => setOpen(false)}>❌</button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm max-w-[80%] whitespace-pre-line ${
                  m.from === "user"
                    ? "bg-purple-200 ml-auto text-right"
                    : "bg-gray-200"
                }`}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className="bg-gray-200 p-2 rounded-lg text-sm w-fit">
                🤖 Thinking...
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="p-2 flex gap-2 border-t">
            <input
              className="flex-1 p-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ask your travel AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 rounded"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
