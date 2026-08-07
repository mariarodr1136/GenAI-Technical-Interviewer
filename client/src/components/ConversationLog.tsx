import {
  Bot,
  Check,
  Copy,
  Download,
  Lightbulb,
  MessageSquare,
  MessagesSquare,
  Timer,
  UserRound
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatTime } from "../constants.ts";
import type { ChatMessage } from "../types.ts";

/** Speaker label for a turn — icon plus name. */
function TurnLabel({ role, isHint }: { role: ChatMessage["role"]; isHint?: boolean }) {
  if (role === "user") {
    return (
      <span>
        <UserRound size={11} aria-hidden="true" />
        You
      </span>
    );
  }
  return isHint ? (
    <span>
      <Lightbulb size={11} aria-hidden="true" />
      Hint
    </span>
  ) : (
    <span>
      <Bot size={11} aria-hidden="true" />
      Interviewer
    </span>
  );
}

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
  /** Seconds left on a timed session; 0 when untimed. */
  countdownSeconds: number;
}

export function ConversationLog({
  conversation,
  currentTranscript,
  streamingReply,
  countdownSeconds
}: ConversationLogProps) {
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // "nearest" keeps the scroll inside the transcript; the default would also
    // scroll the page itself, dragging the header out of view.
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
      <section className="conversation-panel" aria-label="Interview transcript">
        <div className="empty-state">
          <MessageSquare size={36} strokeWidth={1.3} />
          <p>
            Click Begin Interview for a first question, or Record to jump straight into answering.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="conversation-panel" aria-label="Interview transcript">
      {conversation.length > 0 && (
        <div className="conversation-toolbar">
          <div className="toolbar-meta">
            <span className="turn-count">
              <MessagesSquare size={13} aria-hidden="true" />
              {userTurns} turn{userTurns !== 1 ? "s" : ""}
            </span>

            {countdownSeconds > 0 && (
              <div
                className={`countdown-pill ${countdownSeconds <= 60 ? "urgent" : ""}`}
                role="timer"
                aria-label="Session time remaining"
              >
                <Timer size={13} aria-hidden="true" />
                {formatTime(countdownSeconds)}
              </div>
            )}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={copyTranscript}
            aria-label={copied ? "Transcript copied" : "Copy transcript"}
            title="Copy transcript"
          >
            {copied ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <Copy size={15} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={downloadTranscript}
            aria-label="Download transcript"
            title="Download transcript"
          >
            <Download size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* aria-busy holds screen-reader announcements until a reply finishes
          streaming, so it is read once as a whole instead of word by word. */}
      <div className="conversation-log" aria-live="polite" aria-busy={Boolean(streamingReply)}>
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
            <TurnLabel role={message.role} isHint={message.isHint} />
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
            <TurnLabel role="user" />
            <p>{currentTranscript}</p>
          </article>
        )}

        {streamingReply && (
          <article className="turn interviewer-turn">
            <TurnLabel role="assistant" />
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
