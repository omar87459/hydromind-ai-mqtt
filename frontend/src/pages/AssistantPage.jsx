import { useState, useRef, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Send, BookOpen, Bot, User, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { postRagAsk } from "../api";

function SourcesList({ sources }) {
  const { t } = useTranslation();
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
        {t("assistant.sourcesRetrieved", { count: sources.length })}
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
                <span className="badge badge-neutral">{t("assistant.matchPct", { pct: Math.round(s.score * 100) })}</span>
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
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
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
      setMessages((prev) => [...prev, { role: "assistant", text: t("assistant.connectionError") }]);
    } finally {
      setSending(false);
    }
  }

  const exampleQuestions = t("assistant.exampleQuestions", { returnObjects: true });
  const topics = t("assistant.topics", { returnObjects: true });

  return (
    <div className="grid grid-cols-2" style={{ alignItems: "start" }}>
      <div className="card flex flex-col" style={{ gridColumn: "span 1" }}>
        <div className="flex items-center gap-8" style={{ marginBottom: 12 }}>
          <Bot size={18} color="var(--brand-blue)" />
          <h3 style={{ margin: 0 }}>{t("assistant.cardTitle")}</h3>
        </div>

        <div className="chat-window" ref={scrollRef}>
          <div className="chat-bubble assistant">
            <div className="flex items-center gap-6" style={{ marginBottom: 2 }}>
              <Bot size={13} />
              <strong style={{ fontSize: 11.5 }}>{t("assistant.assistantName")}</strong>
            </div>
            <div>{t("assistant.greeting")}</div>
          </div>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              <div className="flex items-center gap-6" style={{ marginBottom: 2 }}>
                {m.role === "assistant" ? <Bot size={13} /> : <User size={13} />}
                <strong style={{ fontSize: 11.5 }}>
                  {m.role === "assistant" ? t("assistant.assistantName") : t("assistant.you")}
                </strong>
              </div>
              <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>
              {m.confidence !== undefined && (
                <div className="chat-meta">
                  {t("assistant.retrievalConfidence", { pct: Math.round(m.confidence * 100) })}
                </div>
              )}
              <SourcesList sources={m.sources} />
            </div>
          ))}
          {sending && (
            <div className="chat-bubble assistant flex items-center gap-8">
              <span className="spinner" /> {t("assistant.retrieving")}
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
            placeholder={t("assistant.inputPlaceholder")}
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
          {exampleQuestions.map((q) => (
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
            {t("assistant.howItWorksTitle")}
          </div>
          <p className="text-secondary mt-8" style={{ fontSize: 13, lineHeight: 1.6 }}>
            <Trans i18nKey="assistant.howItWorksP1">
              This is a prototype <strong>Retrieval-Augmented Generation (RAG)</strong> pipeline. Your
              question is matched against a local markdown knowledge base (<code>backend/knowledge_base/</code>)
              using TF-IDF retrieval — a classic sparse text-similarity method — and the best-matching
              passages are returned directly as the answer.
            </Trans>
          </p>
          <p className="text-secondary mt-8" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {t("assistant.howItWorksP2")}
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t("assistant.topicsTitle")}</h3>
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13, lineHeight: 1.9 }}>
            {topics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
