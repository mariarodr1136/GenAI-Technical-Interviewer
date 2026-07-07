# GenAI Technical Interviewer 🎙️

[![CI](https://github.com/mariarodr1136/GenAI-Technical-Interviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/mariarodr1136/GenAI-Technical-Interviewer/actions/workflows/ci.yml) ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6) ![React](https://img.shields.io/badge/React-Frontend-61DAFB) ![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF) ![Node.js](https://img.shields.io/badge/Node.js-Backend-339933) ![Express](https://img.shields.io/badge/Express-API-000000) ![Vitest](https://img.shields.io/badge/Vitest-Tested-6E9F18) ![Groq](https://img.shields.io/badge/Groq-AI_Inference-F55036) ![Whisper](https://img.shields.io/badge/Whisper_Large_v3-STT-8A2BE2) ![Qwen](https://img.shields.io/badge/Qwen3.6_27B-LLM-FF6F00) ![Web Speech API](https://img.shields.io/badge/Web_Speech_API-TTS-0F8F83)

The **GenAI Technical Interviewer** is a voice-driven **web application** designed to simulate a technical interview for candidates transitioning into software engineering. It opens with a polished **landing page** that introduces the product, and routes users into a full interview session on demand.

By combining a **React + TypeScript frontend** with a **Node.js/Express (TypeScript) backend**, the platform lets users answer interview questions aloud, receive AI-generated follow-ups, and hear the interviewer response spoken back through the browser — with replies **spoken sentence-by-sentence while they stream** for a natural conversational pace.

The application uses **Groq Whisper Large v3** for speech-to-text transcription and **Groq Qwen3.6 27B** for interview reasoning. For text-to-speech, it uses the native **Browser Web Speech API**, which avoids adding a paid TTS provider and keeps the architecture free-tier friendly.

The ultimate goal is to help aspiring software engineers practice **problem-solving**, **algorithmic thinking**, **system logic**, and **technical communication** in a realistic interview flow. Paste in a **target job description** and the interviewer tailors questions to the role; open the **code editor** to submit real code for line-level review. 💻🎧

---

Live Application: https://genai-technical-interviewer-1.onrender.com/

*Note: The live application is hosted on Render's free tier, so the backend may take up to a minute to wake up after a period of inactivity. The landing page pings the server in the background so it is usually warm by the time you start — and the app shows a wake-up notice if a first request is slow.*

---




https://github.com/user-attachments/assets/26e1f829-82ba-47d4-ae72-aedfc8625eff



---

### Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Core Components](#-core-components)
- [Experience & UI](#-experience--ui)
- [Demo Flow](#-demo-flow)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#contributing)
- [Contact](#contact-)

---

### Features:

- **Landing Page**: Informational homepage with hero, features, how-it-works, topics, and CTA — also warms up the free-tier backend in the background
- **Voice Interview Flow**: Answer interview prompts using your microphone
- **Text Input Fallback**: Switch to typed answers for silent environments or accessibility needs
- **Coding Mode** 🆕: Open a monospace code editor and attach real code to any answer — the interviewer reviews it concretely and asks follow-ups about your implementation
- **Run Your Code In-Browser** 🆕: Execute attached JavaScript in a sandboxed Web Worker or Python via Pyodide (WebAssembly) — the program output is sent along with your answer so the interviewer reacts to what the code actually did
- **Job Description Tailoring** 🆕: Paste a target job posting and the interviewer tailors question themes, technologies, and expectations to the role
- **Resume Upload** 🆕: Upload a PDF (parsed entirely in your browser — the file never leaves your machine) or paste text, and the interviewer asks about your real projects and experience
- **Structured System Design Mode** 🆕: System design sessions move through real interview phases — requirements → high-level design → deep dive → trade-offs — and the code panel becomes a design-notes pad
- **Behavioral STAR Coaching** 🆕: Behavioral sessions probe for missing Situation/Task/Action/Result components and push for specifics and measurable results
- **Hands-Free Mode** 🆕: Silence detection auto-stops the recording after you pause, and with auto-start enabled the whole interview loop runs without touching the keyboard
- **Downloadable Debrief Report** 🆕: Export any session (from the debrief or history) as a Markdown report with ratings, feedback, and the full transcript
- **Installable PWA** 🆕: Web app manifest + icons so the interviewer installs to your home screen or dock
- **Streaming Voice Replies** 🆕: Interviewer responses are spoken sentence-by-sentence *while* they stream from the LLM — no long-utterance cutoffs, faster perceived response
- **Stop Generating** 🆕: Cancel a reply mid-stream; the partial answer is kept and the server aborts the upstream AI call
- **Topic Selector**: Choose a focus area — General, Algorithms, System Design, Frontend, Backend, or Behavioral
- **Difficulty Selector**: Set the question level — Easy, Medium, or Hard
- **Interviewer Personas**: Professional, Strict, Encouraging, or Fast-paced
- **Persistent Preferences** 🆕: Topic, difficulty, persona, timer, voice, theme, auto-start, and job description survive page reloads
- **Microphone Permission Handling**: Clean browser permission flow using `getUserMedia`
- **Audio Recording**: Captures user responses with the native `MediaRecorder` API
- **Recording Timer & Audio Level Visualizer**: Elapsed time plus a live microphone amplitude bar while recording
- **Groq Whisper Transcription**: Sends recorded audio to Groq's Whisper Large v3 model
- **AI Interviewer Brain**: Uses Groq Qwen3.6 27B to generate technical follow-up questions
- **Browser Text-to-Speech**: Reads interviewer responses aloud with `window.speechSynthesis`
- **Auto-Start Mode**: Automatically begins recording after the interviewer finishes speaking
- **Hint System**: One-sentence nudges when you're stuck, without giving the answer away
- **Session Debrief**: End-of-session AI summary with strengths, areas to improve, topics covered, and a readiness rating — schema-validated server-side
- **Session History & Readiness Trend**: Past sessions with full transcripts and a rating trend chart, stored locally
- **Scrollable Conversation Log**: Full interview history displayed in a chat-style panel with auto-scroll, transcript copy, and download
- **Dynamic Status Signals**: Live indicators for mic, Groq STT, Qwen3.6 27B, and Browser TTS — each reflects actual runtime state
- **Strict Input Validation** 🆕: Topic, difficulty, persona, job description, and code are whitelist-validated server-side with clear 400 responses
- **Resilient AI Layer** 🆕: Request timeouts, automatic retries on 429/5xx, friendly error messages, and upstream aborts when the client disconnects
- **Banned-Word Guard**: Lexical sanitizer enforced on the server *and* mirrored client-side so streamed text and speech stay clean
- **Rate Limiting**: API requests are capped at 30 per 15-minute window per IP (proxy-aware, so limits are actually per visitor on Render)
- **Tested & CI-Gated** 🆕: ~100 Vitest tests across server (Supertest + mocked Groq SDK) and client (Testing Library), plus a Playwright e2e smoke test; GitHub Actions runs lint, typecheck, tests, build, and e2e on every push
- **Free-Tier Friendly Architecture**: No paid TTS service, no database requirement, and minimal server footprint

---

### Technology Stack:

#### Frontend (Voice UI + Browser TTS)
- **React 19 + TypeScript (strict)** (component-driven single-page app)
- **Vite** (fast local development and production builds)
- **Custom hooks** (`useRecorder`, `useTTS`, `useCountdown`) isolating browser-API state
- **MediaRecorder API** (records candidate audio in the browser)
- **Web Audio API** (real-time microphone level visualization)
- **Web Speech API** (sentence-queued text-to-speech playback)
- **Lucide React** (clean UI icons for interview controls)
- **pdf.js** (client-side resume PDF text extraction — lazy-loaded, nothing uploaded)
- **Web Workers + Pyodide** (sandboxed in-browser JavaScript and Python execution)
- **CSS** (responsive layout split into per-area stylesheets, light/dark themes)

#### Backend (API + AI Orchestration)
- **Node.js 22 + TypeScript** (runs natively via Node's type stripping — zero build step)
- **Express 5** (REST API and middleware pipeline)
- **express-rate-limit** (per-IP request throttling on all `/api` routes)
- **Multer** (multipart audio upload handling)
- **Groq SDK** (speech-to-text and LLM API calls with timeout + retry)
- **dotenv** (environment-based configuration)
- **CORS** (frontend/backend local development access)

#### AI & Speech Layer
- **Groq Whisper Large v3** (speech-to-text transcription)
- **Groq Qwen3.6 27B** (technical interviewer reasoning and session debrief)
- **Dynamic Prompt Engineering** (per-session system prompt built from topic, difficulty, persona, and job description)
- **JSON Mode** (structured debrief output via `response_format: json_object`, schema-validated before returning)
- **Response Sanitization** (server-side lexical guard, mirrored client-side for streamed text)

#### Quality & DevOps
- **Vitest + Supertest** (server: route tests with a mocked Groq SDK; client: Testing Library component, hook, and lib tests)
- **Playwright** (e2e smoke test: landing → interview → mocked SSE turn, plus a real code-runner check)
- **ESLint 9 + typescript-eslint + react-hooks** (flat config, React compiler rules)
- **Prettier** (consistent formatting)
- **GitHub Actions CI** (lint → typecheck → test → build, plus an e2e job, on every push and PR)
- **npm Workspaces** (client/server project organization)

---

### Getting Started:

#### Prerequisites
- Node.js **22.18+** (the TypeScript server runs directly on Node — no build step)
- npm
- Git
- Groq API key
- A modern browser with microphone support

#### Setting Up the Project:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mariarodr1136/GenAI-Technical-Interviewer.git
   cd GenAI-Technical-Interviewer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create the backend environment file**:
   ```bash
   cp server/.env.example server/.env
   ```

4. **Add your Groq API key**:
   ```bash
   nano server/.env
   ```

   Update the key:
   ```bash
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

5. **Run the full application**:
   ```bash
   npm run dev
   ```

6. **Access the application** at http://localhost:3000

The Express backend runs on http://localhost:8080.

---

### Development Workflow

| Command | What it does |
|---|---|
| `npm run dev` | Runs the Express server and Vite client together |
| `npm test` | Runs the server and client test suites (Vitest, Groq mocked) |
| `npm run e2e` | Playwright smoke test (starts the client dev server itself) |
| `npm run typecheck` | Type-checks both workspaces with `tsc --noEmit` |
| `npm run lint` | ESLint across client and server |
| `npm run format` | Prettier write |
| `npm run build` | Production client build |

All of these run in CI on every push and pull request.

---

<img width="1470" height="803" alt="Screenshot 2026-06-29 at 2 00 08 PM" src="https://github.com/user-attachments/assets/b360e486-64d9-4eaa-ba81-c2774db75815" />


<img width="1470" height="789" alt="preview" src="https://github.com/user-attachments/assets/84b4601b-d1b4-4953-bb3e-047d41d39581" />


---


### Project Structure

```
GenAI Technical Interviewer/
├── .github/workflows/ci.yml        # Lint, typecheck, test, build on every push
├── client/                         # React + TypeScript frontend
│   ├── index.html                  # Vite HTML entry
│   ├── vite.config.ts              # Vite config + API proxy (port 3000)
│   ├── tsconfig.json
│   └── src/
│       ├── components/
│       │   ├── ControlPanel.tsx    # Meter, record/mute/type controls, code editor + runner
│       │   ├── ConversationLog.tsx # Chat-style transcript with code blocks + copy/download
│       │   ├── DebriefModal.tsx    # End-of-session readiness report + Markdown export
│       │   ├── HistoryModal.tsx    # Past sessions, trend chart, per-session report download
│       │   ├── JobDescriptionModal.tsx # Paste a job posting to tailor the interview
│       │   ├── ResumeModal.tsx     # Upload (PDF, parsed in-browser) or paste a resume
│       │   ├── RatingChart.tsx     # SVG trend line of readiness ratings
│       │   └── SettingsBar.tsx     # Topic/difficulty/persona/timer/voice + hands-free toggle
│       ├── hooks/
│       │   ├── useCountdown.ts     # Session timer
│       │   ├── useRecorder.ts      # Mic access, MediaRecorder, level analysis, silence auto-stop
│       │   └── useTTS.ts           # Sentence-queued speech synthesis
│       ├── lib/
│       │   ├── api.ts              # Typed API client (SSE streaming, AbortController)
│       │   ├── codeRunner.ts       # Sandboxed JS (Web Worker) + Python (Pyodide) execution
│       │   ├── history.ts          # localStorage session history
│       │   ├── prefs.ts            # Persistent user preferences
│       │   ├── recorder.ts         # MediaRecorder MIME helpers
│       │   ├── report.ts           # Markdown debrief report builder + download
│       │   ├── resume.ts           # Client-side PDF/text resume extraction (pdf.js)
│       │   ├── sanitizer.ts        # Client-side banned-word mirror
│       │   ├── speech.ts           # SpeechQueue: streaming sentence TTS
│       │   └── stream.ts           # SSE consumer
│       ├── styles/                 # Per-area stylesheets (tokens, base, layout, …)
│       ├── App.tsx                 # Session orchestration
│       ├── LandingPage.tsx         # Marketing homepage + backend warm-up ping
│       ├── constants.ts / types.ts / main.tsx
│       ├── public/                 # PWA manifest, icons, service worker
│       └── test/                   # Client Vitest suite (libs, hooks, components)
│
├── server/                         # Node/Express backend (TypeScript, no build step)
│   ├── .env.example                # Required environment variables
│   ├── tsconfig.json / vitest.config.ts
│   ├── test/                       # Vitest + Supertest suite (Groq SDK mocked)
│   └── src/
│       ├── app.ts                  # Express app factory (testable), trust proxy, rate limiting
│       ├── index.ts                # Entry point + graceful shutdown
│       ├── config/                 # env.ts + shared constants/enums
│       ├── controllers/            # Voice turn, text turn, start, hint, debrief
│       ├── middleware/             # Error handler (friendly AI errors), audio upload
│       ├── prompts/                # Dynamic prompt builder (topic/difficulty/persona/JD)
│       ├── routes/
│       ├── services/groqService.ts # STT, streaming LLM replies, hint, debrief
│       ├── types.ts
│       └── utils/                  # validation, history parsing, sanitizer, error mapping
│
├── eslint.config.js / .prettierrc  # Shared lint + format config
├── package.json                    # npm workspace scripts
└── README.md
```

---

### 🧠 Core Components

| Component | What It Covers |
|---|---|
| **Settings Bar** | Topic, difficulty, persona, timer, and voice selectors (locked once session starts); job description button; auto-start toggle |
| **Voice Capture UI** | Microphone access, recording controls, timer, audio level bar, mute toggle |
| **Text Input Mode** | Textarea fallback that skips STT and submits typed answers directly |
| **Coding Mode** | Monospace editor (tab-friendly) whose contents ride along with your next answer for code review |
| **Job Description Tailoring** | Persisted job posting injected into the system prompt, delimited and length-capped server-side |
| **Interview API Routes** | `/turn` (audio), `/text-turn`, `/start`, `/hint`, `/debrief` |
| **SpeechQueue** | Sentence-by-sentence TTS that speaks while the reply streams; avoids Chrome's long-utterance cutoff |
| **Stop Generating** | Client `AbortController` + server-side upstream abort when the socket closes |
| **Input Validation** | Whitelist validation for enums, length caps for job description/code, 400s with clear messages |
| **Debrief Service** | JSON-mode Groq call, schema-validated (`readinessRating` enum, required fields) before returning |
| **Friendly Error Mapping** | Groq 429/5xx/timeouts become human-readable messages instead of SDK internals |
| **Rate Limiter** | `express-rate-limit`, 30 req / 15 min per IP, `trust proxy` aware for Render |
| **Session History** | localStorage sessions with quota-safe writes, trend chart, transcript expansion |
| **Test Suite** | 38 Vitest tests incl. Supertest route tests against a fully mocked Groq SDK |

---

### 🧭 Experience & UI

- **Topic, difficulty, persona, and timer selectors** locked once the interview begins
- **Job Description button** in the settings bar — paste a posting once, it persists across sessions
- **Attach Code** button opens a monospace editor; a dot indicator shows code is attached
- **Auto-start toggle** to keep the flow moving — mic fires automatically after TTS finishes
- **Interviewer speaks while thinking** — sentences play as they stream from the model
- **Stop Generating** cancels a long reply and keeps the partial text
- **Cold-start notice** — if the free-tier server is waking up, the meter says so instead of leaving you guessing
- **Live audio level bar** so the candidate can confirm the microphone is picking up their voice
- **Dynamic status indicators** — each signal (Mic, Groq STT, Qwen3.6 27B, Browser TTS) reflects actual runtime state
- **Scrollable conversation log** with per-turn code blocks, transcript copy, and download
- **Session debrief modal** with readiness rating, topics covered, strengths, and areas to improve
- **Session history** with readiness trend chart across your last sessions
- **Dark mode**, **mute control**, **keyboard shortcuts** (Space to record, M to mute, Esc to stop)
- **Responsive design** for desktop and mobile screens

---

### 🧪 Demo Flow

For local demos and portfolio walkthroughs:

- **Start the app locally** with `npm run dev`
- **Choose a topic and difficulty** in the settings bar (e.g., Algorithms / Medium)
- **(Optional)** click **Job Description** and paste a posting to tailor the session
- **Allow microphone access** when the browser prompts you
- **Click Begin Interview** — the first question is spoken as it streams in
- **Answer aloud**, or click **Attach Code** and paste an implementation for review
- **Review the transcript** generated by Groq Whisper in the conversation log
- **Continue the interview** with follow-up turns; grab a **hint** if you're stuck
- **Click End & Debrief** when finished to see a structured session summary and your readiness trend

Suggested demo question to answer aloud:

```text
Walk me through how you would check whether a string has balanced parentheses.
```

---

### 📝 API Documentation

This section describes how the React frontend communicates with the Express backend.

> **Rate limit:** All `/api` routes are limited to **30 requests per 15-minute window** per IP address.
>
> **Validation:** `topic`, `difficulty`, and `persona` are whitelist-validated (unknown values → `400`). `jobDescription` is capped at 2,000 characters, `resume` at 2,500, and `code` at 4,000 server-side.

---

## 1. Health Check

```bash
GET /health        # detailed (models)
GET /api/health    # minimal (used for keep-alive pings and warm-up)
```

<details>
<summary>Sample Response</summary>

```json
{
  "status": "ok",
  "sttModel": "whisper-large-v3",
  "llmModel": "qwen/qwen3.6-27b"
}
```

</details>

---

## 2. Start Interview

```bash
POST /api/interview/start
Content-Type: application/json
```

| Field | Type | Required | Description |
|---|---|---|---|
| `topic` | string | No | One of `general`, `algorithms`, `system-design`, `frontend`, `backend`, `behavioral` |
| `difficulty` | string | No | `easy`, `medium`, or `hard` |
| `persona` | string | No | `professional`, `strict`, `encouraging`, or `fast-paced` |
| `jobDescription` | string | No | Target job posting to tailor the interview to |
| `resume` | string | No | Candidate resume text (extracted client-side) to ground questions in real experience |

<details>
<summary>Sample Response</summary>

```json
{
  "question": "Welcome! Let's start with something practical — how would you find the first non-repeating character in a string?"
}
```

</details>

---

## 3. Voice Interview Turn (SSE)

```bash
POST /api/interview/turn
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|---|---|---|---|
| `audio` | File | Yes | Browser-recorded audio file, usually `.webm` (max 25 MB) |
| `history` | JSON string | No | Recent `{ role, content }` conversation messages |
| `topic` / `difficulty` / `persona` | string | No | Interview configuration |
| `jobDescription` | string | No | Target job posting |
| `resume` | string | No | Candidate resume text |
| `code` | string | No | Code (or system-design notes) the candidate attached to this answer, including any run output |

The response is a **Server-Sent Events stream**:

```
data: {"transcript":"I would use a stack and scan each character."}

data: {"delta":"Good start. "}
data: {"delta":"What would you store on the stack?"}

data: {"done":true,"reply":"Good start. What would you store on the stack?"}
```

An error mid-stream is delivered as `data: {"error":"..."}`. If the client disconnects, the server aborts the upstream Groq request.

### Sample Request

```bash
curl -N -X POST http://localhost:8080/api/interview/turn \
  -F "audio=@candidate-answer.webm" \
  -F 'history=[]' \
  -F 'topic=algorithms' \
  -F 'difficulty=medium'
```

---

## 4. Text Interview Turn (SSE)

```bash
POST /api/interview/text-turn
Content-Type: application/json
```

Accepts a typed answer directly — no audio upload or STT step required. Same SSE response format as the voice turn.

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | Yes | Candidate's typed answer |
| `history` | JSON string | No | Recent `{ role, content }` conversation messages |
| `topic` / `difficulty` / `persona` | string | No | Interview configuration |
| `jobDescription` | string | No | Target job posting |
| `resume` | string | No | Candidate resume text |
| `code` | string | No | Attached code or design notes |

### Sample Request

```bash
curl -N -X POST http://localhost:8080/api/interview/text-turn \
  -H "Content-Type: application/json" \
  -d '{"text": "I would use a hash map to count character frequencies.", "history": "[]", "topic": "algorithms", "code": "function firstUnique(s) { /* ... */ }"}'
```

---

## 5. Hint

```bash
POST /api/interview/hint
Content-Type: application/json
```

| Field | Type | Required | Description |
|---|---|---|---|
| `history` | JSON string | Yes | Recent conversation (must contain at least one user turn) |

<details>
<summary>Sample Response</summary>

```json
{
  "hint": "Think about what data structure lets you check the most recent unmatched opener in O(1)."
}
```

</details>

---

## 6. Session Debrief

```bash
POST /api/interview/debrief
Content-Type: application/json
```

Analyzes the conversation history and returns structured, schema-validated session feedback.

| Field | Type | Required | Description |
|---|---|---|---|
| `history` | JSON string | Yes | Full `{ role, content }` conversation to debrief |

<details>
<summary>Sample Response</summary>

```json
{
  "turnCount": 3,
  "topicsCovered": ["stacks", "balanced parentheses", "hash maps"],
  "strengths": "The candidate communicated their reasoning clearly and arrived at correct core logic for both problems without prompting.",
  "areasToImprove": "Complexity analysis needed more depth — space complexity was not addressed and edge cases around empty input were missed.",
  "readinessRating": "Developing",
  "closingNote": "You showed real growth in how you explained your thinking — keep working on complexity analysis and you will be ready to interview confidently."
}
```

</details>

---

## 7. Environment Variables

```bash
PORT=8080
CLIENT_ORIGIN=http://localhost:3000
GROQ_API_KEY=gsk_your_key_here
GROQ_STT_MODEL=whisper-large-v3
GROQ_LLM_MODEL=qwen/qwen3.6-27b
```

| Variable | Purpose |
|---|---|
| `PORT` | Express server port |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `GROQ_API_KEY` | Server-only Groq credential |
| `GROQ_STT_MODEL` | Speech-to-text model |
| `GROQ_LLM_MODEL` | Interviewer chat model |

---

### 🚀 Deployment

#### Recommended Free-Tier Deployment Pattern

This project is designed so the frontend and backend can be deployed separately:

- **Frontend**: Deploy `client/` as a static React/Vite site
- **Backend**: Deploy `server/` as a Node.js web service — requires **Node 22.18+** (the TypeScript sources run directly, no build step; set the platform Node version, e.g. `NODE_VERSION` on Render)
- **Secrets**: Store `GROQ_API_KEY` as a backend environment variable only
- **CORS**: Set `CLIENT_ORIGIN` to your deployed frontend URL
- **Frontend API URL**: Set `VITE_API_BASE_URL` to your deployed backend URL

##### Build Commands

Frontend:
```bash
cd client
npm install
npm run build
```

Backend:
```bash
cd server
npm install
npm run start
```

##### Production Environment Example

Backend:
```bash
PORT=8080
CLIENT_ORIGIN=https://your-frontend-url.com
GROQ_API_KEY=gsk_your_key_here
GROQ_STT_MODEL=whisper-large-v3
GROQ_LLM_MODEL=qwen/qwen3.6-27b
```

Frontend:
```bash
VITE_API_BASE_URL=https://your-backend-url.com
```

---

### Contributing

Feel free to submit issues or pull requests for improvements, bug fixes, or new interview modes. You can also open issues to discuss potential enhancements such as coding challenge categories, scoring rubrics, or new personas.

To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feat/your-feature-name
   ```
   Alternatively, for bug fixes:
   ```bash
   git checkout -b fix/your-bug-fix-name
   ```
3. Make your changes and run the checks before committing:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
4. Commit your changes with a descriptive message:
   ```bash
   git commit -m "add your commit message"
   ```
5. Push your branch:
   ```bash
   git push origin feat/your-feature-name
   ```
6. Submit a pull request explaining your changes and any testing performed.

---

### Contact 🌐

If you have any questions or feedback, feel free to reach out at [mrodr.contact@gmail.com](mailto:mrodr.contact@gmail.com).
