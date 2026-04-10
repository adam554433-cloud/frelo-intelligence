"use client";

import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Send, Loader2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  note?: string;
}

const EXAMPLES = [
  "What does frelo's voice sound like vs gym-bro brands?",
  "Why would a 55-year-old woman choose creatine over collagen?",
  "What's the strongest objection vegans have to creatine?",
  "If Create Wellness launched gummies tomorrow, how should we respond?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(message: string) {
    if (!message.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.answer, note: data.note }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto flex h-screen max-w-4xl flex-col px-6">
        <div className="py-8">
          <div className="flex items-center gap-2 text-sm text-accent-light">
            <Sparkles className="h-4 w-4" />
            <span className="uppercase tracking-[0.2em]">ask anything</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold">Chat with frelo&apos;s brain.</h1>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.length === 0 && (
            <div className="space-y-2">
              <div className="text-sm text-text-muted">Try:</div>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="block w-full rounded-card border border-surface-border bg-surface px-5 py-3 text-left text-sm text-text-secondary transition-colors hover:border-accent/40 hover:bg-surface-hover hover:text-text-primary"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-card p-5 ${
                m.role === "user"
                  ? "bg-accent/10 border border-accent/20 ml-12"
                  : "bg-surface border border-surface-border mr-12"
              }`}
            >
              <div className="mb-1 text-xs uppercase tracking-wider text-text-muted">
                {m.role === "user" ? "you" : "frelo intelligence"}
              </div>
              <div className="whitespace-pre-wrap text-text-primary">{m.content}</div>
              {m.note && <div className="mt-2 text-xs text-text-muted italic">{m.note}</div>}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-0 bg-background py-4"
        >
          <div className="flex gap-2 rounded-card border border-surface-border bg-surface p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your audience, competitors, hypotheses..."
              className="flex-1 bg-transparent px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 rounded-card bg-accent-gradient px-5 py-2 font-medium text-chocolate transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Ask
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
