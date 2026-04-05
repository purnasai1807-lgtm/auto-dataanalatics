import { FormEvent, useState } from "react";
import { Bot, SendHorizontal, User2 } from "lucide-react";
import { ChatResponse } from "../../api/types";
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
}
interface ChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (question: string) => Promise<void>;
}
function ChatPanel({ messages, loading, onSend }: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }
    const value = question;
    setQuestion("");
    await onSend(value);
  };
  return (
    <section className="glass-panel rounded-[28px] p-5 shadow-panel">
      <div className="mb-5">
        <h2 className="section-title">Chat With Data</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Ask natural-language questions like “Show top 5 countries” or “Predict next month sales”.
        </p>
      </div>
      <div className="space-y-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-[24px] bg-white/60 p-4 dark:bg-slate-950/30">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Start with a business question and the platform will map it to a data result.
            </p>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-[22px] p-4 ${
                message.role === "user"
                  ? "ml-auto max-w-[80%] bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "max-w-[88%] bg-white/90 text-slate-900 dark:bg-slate-900/80 dark:text-white"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em] opacity-70">
                {message.role === "user" ? <User2 className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                {message.role}
              </div>
              <p className="text-sm leading-6">{message.content}</p>
              {message.response?.tabular_result?.length ? (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/80 p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr>
                        {Object.keys(message.response.tabular_result[0]).map((key) => (
                          <th key={key} className="pb-2 pr-4 font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {message.response.tabular_result.slice(0, 6).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-slate-200/70 dark:border-slate-700">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="py-2 pr-4">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about this dataset..."
            className="flex-1 rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50 dark:bg-white dark:text-slate-950"
          >
            <SendHorizontal className="mr-2 h-4 w-4" />
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>
      </div>
    </section>
  );
}
export default ChatPanel;
