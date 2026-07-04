import { Check, Copy, Download, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types.ts";

function buildTranscriptText(conversation: ChatMessage[]): string {
  return conversation
    .map((m) => {
      const speaker = m.role === "user" ? "You" : m.isHint ? "Hint" : "Interviewer";
      const code = m.code ? `\n\n\`\`\`\n${m.code}\n\`\`\`` : "";
      return `${speaker}: ${m.content}${code}`;
    })
    .join("\n\n");
}

interface ConversationLogProps {
  conversation: ChatMessage[];
  currentTranscript: string;
  streamingReply: string;
}

export function ConversationLog({
  conversation,
  currentTranscript,
  streamingReply
}: ConversationLogProps) {
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, streamingReply]);

  function copyTranscript(): void {
    navigator.clipboard.writeText(buildTranscriptText(conversation)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadTranscript(): void {
    const blob = new Blob([buildTranscriptText(conversation)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const userTurns = conversation.filter((m) => m.role === "user").length;

  if (conversation.length === 0 && !currentTranscript && !streamingReply) {
    return (
      <section className="conversation-panel" aria-label="Interview transcript" aria-live="polite">
        <div className="empty-state">
          <MessageSquare size={36} strokeWidth={1.3} />
          <p>
            Click Begin Interview for a first question, or Start to jump straight into recording.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="conversation-panel" aria-label="Interview transcript" aria-live="polite">
      {conversation.length > 0 && (
        <div className="conversation-toolbar">
          <span className="turn-count">
            {userTurns} turn{userTurns !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={copyTranscript}
            title="Copy transcript"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={downloadTranscript}
            title="Download transcript"
          >
            <Download size={15} />
          </button>
        </div>
      )}

      <div className="conversation-log">
        {conversation.map((message, i) => (
          <article
            key={i}
            className={
              message.role === "user"
                ? "turn user-turn"
                : message.isHint
                  ? "turn hint-turn"
                  : "turn interviewer-turn"
            }
          >
            <span>{message.role === "user" ? "You" : message.isHint ? "Hint" : "Interviewer"}</span>
            <p>{message.content}</p>
            {message.code && (
              <pre className="code-block">
                <code>{message.code}</code>
              </pre>
            )}
          </article>
        ))}

        {currentTranscript && (
          <article className="turn user-turn streaming-pending">
            <span>You</span>
            <p>{currentTranscript}</p>
          </article>
        )}

        {streamingReply && (
          <article className="turn interviewer-turn">
            <span>Interviewer</span>
            <p>
              {streamingReply}
              <span className="cursor-blink">▋</span>
            </p>
          </article>
        )}

        <div ref={endRef} />
      </div>
    </section>
  );
}
