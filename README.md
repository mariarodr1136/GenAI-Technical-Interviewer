# GenAI Technical Interviewer 🎙️

![React](https://img.shields.io/badge/React-Frontend-61DAFB) ![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF) ![Node.js](https://img.shields.io/badge/Node.js-Backend-339933) ![Express](https://img.shields.io/badge/Express-API-000000) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E) ![Groq](https://img.shields.io/badge/Groq-AI_Inference-F55036) ![Whisper](https://img.shields.io/badge/Whisper_Large_v3-STT-8A2BE2) ![Qwen](https://img.shields.io/badge/Qwen3.6_27B-LLM-FF6F00) ![Web Speech API](https://img.shields.io/badge/Web_Speech_API-TTS-0F8F83)

The **GenAI Technical Interviewer** is a voice-driven **web application** designed to simulate a technical interview for candidates transitioning into software engineering. It opens with a polished **landing page** that introduces the product, and routes users into a full interview session on demand.

By combining a **React frontend** with a lightweight **Node.js/Express backend**, the platform lets users answer interview questions aloud, receive AI-generated follow-ups, and hear the interviewer response spoken back through the browser.

The application uses **Groq Whisper Large v3** for speech-to-text transcription and **Groq Qwen3.6 27B** for interview reasoning. For text-to-speech, it uses the native **Browser Web Speech API**, which avoids adding a paid TTS provider and keeps the architecture free-tier friendly.

The ultimate goal is to help aspiring software engineers practice **problem-solving**, **algorithmic thinking**, **system logic**, and **technical communication** in a realistic interview flow. The interviewer persona is tuned for candidates who have not yet held an official Software Engineer title, giving them focused practice without relying on resume pedigree. 💻🎧

---

Live Application: https://genai-technical-interviewer-1.onrender.com/

*Note: The live application is hosted on Render's free tier, so the backend may take up to a minute to wake up after a period of inactivity. If the first interview request feels slow, please give the server a moment to start. Groq usage depends on account limits, and the browser handles TTS locally through `window.speechSynthesis`.*

---




https://github.com/user-attachments/assets/26e1f829-82ba-47d4-ae72-aedfc8625eff



---

### Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
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

- **Landing Page**: Informational homepage with hero, features, how-it-works, topics, and CTA — routes into the interview app on demand with a back button to return
- **Voice Interview Flow**: Answer interview prompts using your microphone
- **Text Input Fallback**: Switch to typed answers for silent environments or accessibility needs
- **Topic Selector**: Choose a focus area — General, Algorithms, System Design, Frontend, Backend, or Behavioral
- **Difficulty Selector**: Set the question level — Easy, Medium, or Hard
- **Microphone Permission Handling**: Clean browser permission flow using `getUserMedia`
- **Audio Recording**: Captures user responses with the native `MediaRecorder` API
- **Recording Timer**: Displays elapsed recording time in the control panel
- **Audio Level Visualizer**: Live microphone amplitude bar via the Web Audio API while recording
- **Groq Whisper Transcription**: Sends recorded audio to Groq's Whisper Large v3 model
- **AI Interviewer Brain**: Uses Groq Qwen3.6 27B to generate technical follow-up questions
- **Browser Text-to-Speech**: Reads interviewer responses aloud with `window.speechSynthesis`
- **Auto-Start Mode**: Automatically begins recording after the interviewer finishes speaking
- **Session Debrief**: End-of-session AI summary with strengths, areas to improve, topics covered, and a readiness rating
- **Scrollable Conversation Log**: Full interview history displayed in a chat-style panel with auto-scroll
- **Dynamic Status Signals**: Live indicators for mic, Groq STT, Qwen3.6 27B, and Browser TTS — each reflects actual runtime state
- **Conversation Context**: Sends recent candidate/interviewer turns to preserve interview flow
- **Strict Interview Persona**: Engineering-manager prompt focused on fundamentals and reasoning
- **Dynamic Prompt System**: System prompt is built per session from the selected topic and difficulty
- **Banned-Word Guard**: Backend sanitizer enforces forbidden response terms
- **Rate Limiting**: API requests are capped at 30 per 15-minute window per IP to protect the Groq key
- **Clean Modular Backend**: Routes, controllers, services, middleware, prompt, and config are separated
- **Free-Tier Friendly Architecture**: No paid TTS service, no database requirement, and minimal server footprint
- **Portfolio-Ready UI**: Polished interview control panel, settings bar, conversation log, and debrief modal

---

### Technology Stack:

#### Frontend (Voice UI + Browser TTS)
- **React** (component-driven single-page app)
- **Vite** (fast local development and production builds)
- **JavaScript (ES6+)** (modern async browser APIs)
- **MediaRecorder API** (records candidate audio in the browser)
- **Web Audio API** (real-time microphone level visualization)
- **Web Speech API** (native text-to-speech playback)
- **Lucide React** (clean UI icons for interview controls)
- **CSS** (responsive layout, status states, and interview dashboard styling)

#### Backend (API + AI Orchestration)
- **Node.js** (JavaScript runtime)
- **Express** (REST API and middleware pipeline)
- **express-rate-limit** (per-IP request throttling on all `/api` routes)
- **Multer** (multipart audio upload handling)
- **Groq SDK** (speech-to-text and LLM API calls)
- **dotenv** (environment-based configuration)
- **CORS** (frontend/backend local development access)

#### AI & Speech Layer
- **Groq Whisper Large v3** (speech-to-text transcription)
- **Groq Qwen3.6 27B** (technical interviewer reasoning and session debrief)
- **Dynamic Prompt Engineering** (per-session system prompt built from topic + difficulty)
- **JSON Mode** (structured debrief output via `response_format: json_object`)
- **Response Sanitization** (server-side lexical guard before returning speech text)

#### Deployment & DevOps
- **npm Workspaces** (client/server project organization)
- **Environment Variables** (no hardcoded secrets)
- **Git/GitHub** (source control and portfolio presentation)
- **Free Static Hosting + Free Node Hosting** (recommended deployment pattern)

---

### Getting Started:

#### Prerequisites
- Node.js 20+
- npm
- Git
- Groq API key
- A modern browser with microphone support

#### Setting Up the Project:

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd "GenAI Technical Interviewer"
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

6. **Access the application** at http://localhost:3002

The Express backend runs on http://localhost:8080.

---

<img width="1470" height="803" alt="Screenshot 2026-06-29 at 2 00 08 PM" src="https://github.com/user-attachments/assets/b360e486-64d9-4eaa-ba81-c2774db75815" />


<img width="1470" height="789" alt="preview" src="https://github.com/user-attachments/assets/84b4601b-d1b4-4953-bb3e-047d41d39581" />


---


### Project Structure

```
GenAI Technical Interviewer/
├── client/                         # React frontend
│   ├── index.html                  # Vite HTML entry
│   ├── vite.config.js              # Vite config + API proxy
│   └── src/
│       ├── lib/
│       │   ├── recorder.js         # MediaRecorder MIME helpers
│       │   └── speech.js           # Browser speech synthesis helpers (onStart/onEnd callbacks)
│       ├── App.jsx                 # Main interview UI — voice, text, history, debrief
│       ├── LandingPage.jsx         # Marketing homepage with hero, features, and CTA
│       ├── main.jsx                # React entry point — routes between landing page and app
│       └── styles.css              # Responsive interface styling
│
├── server/                         # Node/Express backend
│   ├── .env.example                # Required environment variables
│   └── src/
│       ├── config/
│       │   └── env.js              # Environment validation
│       ├── controllers/
│       │   └── interviewController.js  # Handles voice turn, text turn, and debrief
│       ├── middleware/
│       │   ├── errorHandler.js     # API error responses
│       │   └── upload.js           # Audio upload configuration
│       ├── prompts/
│       │   └── interviewerPrompt.js    # Dynamic prompt builder (topic + difficulty)
│       ├── routes/
│       │   └── interviewRoutes.js  # /turn, /text-turn, /debrief
│       ├── services/
│       │   └── groqService.js      # Groq STT, LLM reply, and debrief summary
│       ├── utils/
│       │   └── responseSanitizer.js
│       └── index.js                # Express app entry + rate limiting
│
├── package.json                    # npm workspace scripts
├── package-lock.json               # Locked dependency versions
├── .gitignore                      # Git ignore file
└── README.md                       # Project documentation
```

---

### 🧠 Core Components

| Component | What It Covers |
|---|---|
| **Settings Bar** | Topic and difficulty selectors (locked once session starts); auto-start toggle |
| **Voice Capture UI** | Microphone access, recording controls, timer, audio level bar, mute toggle |
| **Text Input Mode** | Textarea fallback that skips STT and submits typed answers directly |
| **Recording Helper** | Browser MIME-type detection and upload file extension handling |
| **Interview API Route** | `POST /api/interview/turn` — multipart audio upload |
| **Text Turn Route** | `POST /api/interview/text-turn` — JSON body, no audio required |
| **Debrief Route** | `POST /api/interview/debrief` — returns structured session feedback as JSON |
| **Transcription Service** | Streams uploaded audio to Groq Whisper Large v3 |
| **LLM Interview Service** | Sends transcript and recent history to Groq Qwen3.6 27B |
| **Dynamic Prompt Builder** | Builds the system prompt from selected topic and difficulty per session |
| **Debrief Service** | Calls Groq with `json_object` mode to produce structured session feedback |
| **Response Sanitizer** | Final backend lexical check before returning interviewer text |
| **Browser TTS Helper** | `speakText(text, { onStart, onEnd })` — drives speaking state and auto-start flow |
| **Conversation Log** | Scrollable full-session history with auto-scroll on new turns |
| **Debrief Modal** | Shown on reset — displays readiness rating, strengths, improvements, and topics |
| **Rate Limiter** | `express-rate-limit` middleware — 30 requests per 15-minute window per IP |

---

### 🧭 Experience & UI

- **Topic and difficulty selectors** at the top of the session, locked once the interview begins
- **Auto-start toggle** to keep the flow moving — mic fires automatically after TTS finishes
- **Voice-first interview layout** with clear start/stop controls and elapsed recording timer
- **Live audio level bar** so the candidate can confirm the microphone is picking up their voice
- **Dynamic status indicators** — each signal (Mic, Groq STT, Qwen3.6 27B, Browser TTS) reflects actual runtime state rather than always showing green
- **Scrollable conversation log** showing the full interview history in a chat-style panel
- **Text input mode** toggled via a button — useful for quiet environments or accessibility
- **Session debrief modal** on reset — AI-generated readiness rating, topics covered, strengths, and areas to improve
- **Mute control** for silent practice sessions
- **Responsive design** for desktop and mobile screens
- **Calm dashboard styling** designed for repeated practice sessions

---

### 🧪 Demo Flow

For local demos and portfolio walkthroughs:

- **Start the app locally** with `npm run dev`
- **Choose a topic and difficulty** in the settings bar (e.g., Algorithms / Medium)
- **Allow microphone access** when the browser prompts you
- **Click Start** and answer a technical question aloud
- **Click Stop** to send the recording to the backend
- **Review the transcript** generated by Groq Whisper in the conversation log
- **Listen to the AI interviewer response** through browser TTS
- **Continue the interview** with follow-up turns
- **Click End & Debrief** when finished to see a structured session summary

Suggested demo question to answer aloud:

```text
Walk me through how you would check whether a string has balanced parentheses.
```

---

### 📝 API Documentation

This section describes how the React frontend communicates with the Express backend.

> **Rate limit:** All `/api` routes are limited to **30 requests per 15-minute window** per IP address.

---

## 1. Health Check

```bash
GET /health
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

## 2. Voice Interview Turn

```bash
POST /api/interview/turn
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|---|---|---|---|
| `audio` | File | Yes | Browser-recorded audio file, usually `.webm` |
| `history` | JSON string | No | Recent `{ role, content }` conversation messages |
| `topic` | string | No | Interview topic (e.g. `algorithms`, `system-design`) |
| `difficulty` | string | No | Difficulty level (`easy`, `medium`, `hard`) |

### Sample Request

```bash
curl -X POST http://localhost:8080/api/interview/turn \
  -F "audio=@candidate-answer.webm" \
  -F 'history=[]' \
  -F 'topic=algorithms' \
  -F 'difficulty=medium'
```

<details>
<summary>Sample Response</summary>

```json
{
  "transcript": "I would use a stack and scan each character from left to right.",
  "reply": "Good start. What would you store on the stack, and how would your logic handle a closing parenthesis when the stack is empty?"
}
```

</details>

---

## 3. Text Interview Turn

```bash
POST /api/interview/text-turn
Content-Type: application/json
```

Accepts a typed answer directly — no audio upload or STT step required.

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | Yes | Candidate's typed answer |
| `history` | JSON string | No | Recent `{ role, content }` conversation messages |
| `topic` | string | No | Interview topic |
| `difficulty` | string | No | Difficulty level |

### Sample Request

```bash
curl -X POST http://localhost:8080/api/interview/text-turn \
  -H "Content-Type: application/json" \
  -d '{"text": "I would use a hash map to count character frequencies.", "history": "[]", "topic": "algorithms", "difficulty": "medium"}'
```

<details>
<summary>Sample Response</summary>

```json
{
  "transcript": "I would use a hash map to count character frequencies.",
  "reply": "That works. What is the time and space complexity of your approach, and how would you handle Unicode characters?"
}
```

</details>

---

## 4. Session Debrief

```bash
POST /api/interview/debrief
Content-Type: application/json
```

Analyzes the full conversation history and returns structured session feedback.

| Field | Type | Required | Description |
|---|---|---|---|
| `history` | JSON string | Yes | Full `{ role, content }` conversation to debrief |

### Sample Request

```bash
curl -X POST http://localhost:8080/api/interview/debrief \
  -H "Content-Type: application/json" \
  -d '{"history": "[{\"role\":\"user\",\"content\":\"I would use a stack...\"},{\"role\":\"assistant\",\"content\":\"Good start...\"}]"}'
```

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

## 5. Environment Variables

```bash
PORT=8080
CLIENT_ORIGIN=http://localhost:5173
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
- **Backend**: Deploy `server/` as a Node.js web service
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

Feel free to submit issues or pull requests for improvements, bug fixes, or new interview modes. You can also open issues to discuss potential enhancements such as coding challenge categories, scoring rubrics, saved sessions, or interview difficulty levels.

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
3. Make your changes and run checks before committing:
   ```bash
   npm run build --workspace client
   find server/src -name '*.js' -exec node --check {} \;
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
