import { Briefcase, ChevronDown, Timer } from "lucide-react";
import { DIFFICULTIES, DURATIONS, formatTime, PERSONAS, TOPICS } from "../constants.ts";

interface Option {
  value: string | number;
  label: string;
}

function Select({
  label,
  value,
  options,
  disabled,
  onChange
}: {
  label: string;
  value: string | number;
  options: readonly Option[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-wrap">
      <span>{label}</span>
      <div className="select-inner">
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          {options.map(({ value: v, label: l }) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
      </div>
    </label>
  );
}

interface SettingsBarProps {
  topic: string;
  difficulty: string;
  persona: string;
  duration: number;
  voiceURI: string;
  autoStart: boolean;
  textMode: boolean;
  locked: boolean;
  voices: SpeechSynthesisVoice[];
  countdownSeconds: number;
  hasJobDescription: boolean;
  onTopicChange: (v: string) => void;
  onDifficultyChange: (v: string) => void;
  onPersonaChange: (v: string) => void;
  onDurationChange: (v: number) => void;
  onVoiceChange: (v: string) => void;
  onAutoStartChange: (v: boolean) => void;
  onOpenJobDescription: () => void;
}

export function SettingsBar(props: SettingsBarProps) {
  const { locked } = props;

  return (
    <div className="settings-bar">
      <Select
        label="Topic"
        value={props.topic}
        options={TOPICS}
        disabled={locked}
        onChange={props.onTopicChange}
      />
      <Select
        label="Difficulty"
        value={props.difficulty}
        options={DIFFICULTIES}
        disabled={locked}
        onChange={props.onDifficultyChange}
      />
      <Select
        label="Persona"
        value={props.persona}
        options={PERSONAS}
        disabled={locked}
        onChange={props.onPersonaChange}
      />
      <Select
        label="Timer"
        value={props.duration}
        options={DURATIONS}
        disabled={locked}
        onChange={(v) => props.onDurationChange(Number(v))}
      />

      {props.voices.length > 0 && (
        <label className="select-wrap">
          <span>Voice</span>
          <div className="select-inner">
            <select value={props.voiceURI} onChange={(e) => props.onVoiceChange(e.target.value)}>
              <option value="">Default</option>
              {props.voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
          </div>
        </label>
      )}

      <div className="settings-divider" aria-hidden="true" />

      <button
        type="button"
        className={props.hasJobDescription ? "jd-btn active" : "jd-btn"}
        onClick={props.onOpenJobDescription}
        title="Tailor the interview to a job description"
      >
        <Briefcase size={14} aria-hidden="true" />
        Job Description
        {props.hasJobDescription && <span className="jd-dot" aria-label="Job description set" />}
      </button>

      <label className="toggle-wrap">
        <input
          type="checkbox"
          checked={props.autoStart}
          onChange={(e) => props.onAutoStartChange(e.target.checked)}
          disabled={props.textMode}
        />
        <span>Auto-start mic</span>
      </label>

      {props.countdownSeconds > 0 && (
        <div className={`countdown-pill ${props.countdownSeconds <= 60 ? "urgent" : ""}`}>
          <Timer size={13} />
          {formatTime(props.countdownSeconds)}
        </div>
      )}
    </div>
  );
}
