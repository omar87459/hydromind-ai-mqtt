import { useState, useRef, useEffect } from "react";
import { Send, BookOpen, Bot, User, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { postRagAsk } from "../api";

const EXAMPLE_QUESTIONS = [
  "Why is pH important?",
  "What is the best method for lettuce?",
  "How can I reduce EC?",
  "What happens if water temperature is high?",
];

function SourcesList({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-6"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: "var(--brand-blue)",
          fontSize: 11.5,
          fontWeight: 600,
        }}
      >
        <FileText size={12} />
        {sources.length} source{sources.length > 1 ? "s" : ""} retrieved
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="flex flex-col gap-8 mt-8">
          {sources.map((s, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 11.5,
              }}
            >
              <div className="flex items-center justify-between">
                <strong>
                  {s.source} — {s.heading}
                </strong>
                <span className="badge badge-neutral">{Math.round(s.score * 100)}% match</span>
              </div>
              <div className="text-muted mt-8" style={{ lineHeight: 1.5 }}>
                {s.snippet}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi, I'm the HydroMind AI Knowledge Assistant. Ask me anything about hydroponics — pH, EC, methods, growth stages, or troubleshooting.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendQuestion(question) {
    const q = question.trim();
    if (!q || sending) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setSending(true);
    try {
      const result = await postRagAsk(q);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.answer,
          sources: result.sources,
          confidence: result.confidence,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I couldn't reach the backend knowledge base. Is the FastAPI server running?" },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-2" style={{ alignItems: "start" }}>
      <div className="card flex flex-col" style={{ gridColumn: "span 1" }}>
        <div className="flex items-center gap-8" style={{ marginBottom: 12 }}>
          <Bot size={18} color="var(--brand-blue)" />
          <h3 style={{ margin: 0 }}>HydroMind Knowledge Assistant</h3>
        </div>

        <div className="chat-window" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              <div className="flex items-center gap-6" style={{ marginBottom: 2 }}>
                {m.role === "assistant" ? <Bot size={13} /> : <User size={13} />}
                <strong style={{ fontSize: 11.5 }}>{m.role === "assistant" ? "HydroMind AI" : "You"}</strong>
              </div>
              <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>
              {m.confidence !== undefined && (
                <div className="chat-meta">Retrieval confidence: {Math.round(m.confidence * 100)}%</div>
              )}
              <SourcesList sources={m.sources} />
            </div>
          ))}
          {sending && (
            <div className="chat-bubble assistant flex items-center gap-8">
              <span className="spinner" /> Retrieving from knowledge base...
            </div>
          )}
        </div>

        <form
          className="flex gap-8 mt-16"
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a hydroponics question..."
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              fontSize: 13.5,
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={sending}>
            <Send size={15} />
          </button>
        </form>

        <div className="flex gap-6 wrap mt-16">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button key={q} className="btn btn-sm" onClick={() => sendQuestion(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-16">
        <div className="card">
          <div className="flex items-center gap-8" style={{ color: "var(--brand-blue)", fontWeight: 700, fontSize: 13.5 }}>
            <BookOpen size={16} />
            How this assistant works
          </div>
          <p className="text-secondary mt-8" style={{ fontSize: 13, lineHeight: 1.6 }}>
            This is a prototype <strong>Retrieval-Augmented Generation (RAG)</strong> pipeline. Your
            question is matched against a local markdown knowledge base (<code>backend/knowledge_base/</code>)
            using TF-IDF retrieval — a classic sparse text-similarity method — and the best-matching
            passages are returned directly as the answer.
          </p>
          <p className="text-secondary mt-8" style={{ fontSize: 13, lineHeight: 1.6 }}>
            There is no external LLM call, so every answer is fully offline and traceable to a
            specific source file. Expand "sources retrieved" under any answer to see exactly which
            knowledge base passages were matched and their similarity score. In production, this
            retrieval step would feed an LLM (and a much larger corpus of manuals, papers, and farm
            records) to synthesize a more fluent answer — the retrieval interface is designed to
            support that swap without changing the API.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Knowledge Base Topics</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.9 }}>
            <li>pH management</li>
            <li>EC / nutrient strength management</li>
            <li>Water and air temperature effects</li>
            <li>Lighting and photoperiod</li>
            <li>Nutrients and deficiencies</li>
            <li>Hydroponic methods (DWC, NFT, Ebb & Flow, Drip, Aeroponics, Vertical)</li>
            <li>Crop requirements</li>
            <li>Growth stage lifecycle</li>
            <li>Root health and disease prevention</li>
            <li>Remote farm / satellite connectivity concept</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
