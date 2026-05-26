# GenAI Technical Interviewer 🎙️

![React](https://img.shields.io/badge/React-Frontend-61DAFB) ![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF) ![Node.js](https://img.shields.io/badge/Node.js-Backend-339933) ![Express](https://img.shields.io/badge/Express-API-000000) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E) ![Groq](https://img.shields.io/badge/Groq-AI_Inference-F55036) ![Whisper](https://img.shields.io/badge/Whisper_Large_v3-STT-8A2BE2) ![Llama](https://img.shields.io/badge/Llama_3_70B-LLM-FF6F00) ![Web Speech API](https://img.shields.io/badge/Web_Speech_API-TTS-0F8F83)

The **GenAI Technical Interviewer** is a voice-driven **web application** designed to simulate a technical interview for candidates transitioning into software engineering. By combining a **React frontend** with a lightweight **Node.js/Express backend**, the platform lets users answer interview questions aloud, receive AI-generated follow-ups, and hear the interviewer response spoken back through the browser.

The application uses **Groq Whisper Large v3** for speech-to-text transcription and **Groq Llama 3 70B** for interview reasoning. For text-to-speech, it uses the native **Browser Web Speech API**, which avoids adding a paid TTS provider and keeps the architecture free-tier friendly.

The ultimate goal is to help aspiring software engineers practice **problem-solving**, **algorithmic thinking**, **system logic**, and **technical communication** in a realistic interview flow. The interviewer persona is tuned for candidates who have not yet held an official Software Engineer title, giving them focused practice without relying on resume pedigree. 💻🎧

---

Live Application: https://genai-technical-interviewer-1.onrender.com/

*Note: The live application is hosted on Render’s free tier, so the backend may take up to a minute to wake up after a period of inactivity. If the first interview request feels slow, please give the server a moment to start. Groq usage depends on account limits, and the browser handles TTS locally through `window.speechSynthesis`.*

---

<img width="1465" height="792" alt="Screenshot 2026-05-26 at 3 29 04 PM" src="https://github.com/user-attachments/assets/b631b289-815b-4bdb-a640-a944b5b1eca9" />

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

- **Voice Interview Flow**: Answer interview prompts using your microphone
- **Microphone Permission Handling**: Clean browser permission flow using `getUserMedia`
- **Audio Recording**: Captures user responses with the native `MediaRecorder` API
- **Groq Whisper Transcription**: Sends recorded audio to Groq's Whisper Large v3 model
- **AI Interviewer Brain**: Uses Groq Llama 3 70B to generate technical follow-up questions
- **Browser Text-to-Speech**: Reads interviewer responses aloud with `window.speechSynthesis`
- **Conversation Context**: Sends recent candidate/interviewer turns to preserve interview flow
- **Strict Interview Persona**: Engineering-manager prompt focused on fundamentals and reasoning
- **Banned-Word Guard**: Backend sanitizer enforces the forbidden response terms required by the project
- **Clean Modular Backend**: Routes, controllers, services, middleware, prompt, and config are separated
- **Free-Tier Friendly Architecture**: No paid TTS service, no database requirement, and minimal server footprint
- **Portfolio-Ready UI**: Polished interview control panel, status indicators, transcript area, and voice controls

---

### Technology Stack:

#### Frontend (Voice UI + Browser TTS)
- **React** (component-driven single-page app)
- **Vite** (fast local development and production builds)
- **JavaScript (ES6+)** (modern async browser APIs)
- **MediaRecorder API** (records candidate audio in the browser)
- **Web Speech API** (native text-to-speech playback)
- **Lucide React** (clean UI icons for interview controls)
- **CSS** (responsive layout, status states, and interview dashboard styling)

#### Backend (API + AI Orchestration)
- **Node.js** (JavaScript runtime)
- **Express** (REST API and middleware pipeline)
- **Multer** (multipart audio upload handling)
- **Groq SDK** (speech-to-text and LLM API calls)
- **dotenv** (environment-based configuration)
- **CORS** (frontend/backend local development access)

#### AI & Speech Layer
- **Groq Whisper Large v3** (speech-to-text transcription)
- **Groq Llama 3 70B** (technical interviewer reasoning)
- **Prompt Engineering** (strict engineering-manager interview persona)
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

6. **Access the application** at http://localhost:5173

The Express backend runs on http://localhost:8080.

---


https://github.com/user-attachments/assets/bc081428-720f-4b65-814d-6639dac8c18d


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
│       │   └── speech.js           # Browser speech synthesis helpers
│       ├── App.jsx                 # Main voice interview UI
│       ├── main.jsx                # React entry point
│       └── styles.css              # Responsive interface styling
│
├── server/                         # Node/Express backend
│   ├── .env.example                # Required environment variables
│   └── src/
│       ├── config/
│       │   └── env.js              # Environment validation
│       ├── controllers/
│       │   └── interviewController.js
│       ├── middleware/
│       │   ├── errorHandler.js     # API error responses
│       │   └── upload.js           # Audio upload configuration
│       ├── prompts/
│       │   └── interviewerPrompt.js
│       ├── routes/
│       │   └── interviewRoutes.js
│       ├── services/
│       │   └── groqService.js      # Groq STT + LLM calls
│       ├── utils/
│       │   └── responseSanitizer.js
│       └── index.js                # Express app entry
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
| **Voice Capture UI** | Microphone access, recording controls, mute toggle, reset flow |
| **Recording Helper** | Browser MIME-type detection and upload file extension handling |
| **Interview API Route** | `POST /api/interview/turn` multipart audio request |
| **Transcription Service** | Streams uploaded audio to Groq Whisper Large v3 |
| **LLM Interview Service** | Sends transcript and recent history to Groq Llama 3 70B |
| **System Prompt** | Engineering-manager interview behavior and strict response constraints |
| **Response Sanitizer** | Final backend check before returning interviewer text |
| **Browser TTS Helper** | Converts returned text into spoken audio with `speechSynthesis` |

---

### 🧭 Experience & UI

- **Voice-first interview layout** with clear start/stop controls
- **Status indicators** for microphone, Groq STT, Llama 70B, and browser TTS
- **Candidate transcript panel** for reviewing what Whisper detected
- **Interviewer response panel** for reading the generated follow-up
- **Mute control** for silent practice sessions
- **Reset control** for starting a fresh interview flow
- **Responsive design** for desktop and mobile screens
- **Calm dashboard styling** designed for repeated practice sessions

---

### 🧪 Demo Flow

For local demos and portfolio walkthroughs:

- **Start the app locally** with `npm run dev`
- **Allow microphone access** when the browser prompts you
- **Click Start** and answer a technical question aloud
- **Click Stop** to send the recording to the backend
- **Review the transcript** generated by Groq Whisper
- **Listen to the AI interviewer response** through browser TTS
- **Continue the interview** with follow-up turns

Suggested demo question to answer aloud:

```text
Walk me through how you would check whether a string has balanced parentheses.
```

---

### 📝 API Documentation

This section describes how the React frontend communicates with the Express backend.

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
  "llmModel": "llama-3.3-70b-versatile"
}
```

</details>

---

## 2. Interview Turn

```bash
POST /api/interview/turn
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|---|---|---|---|
| `audio` | File | Yes | Browser-recorded audio file, usually `.webm` |
| `history` | JSON string | No | Recent `{ role, content }` conversation messages |

### Sample Request

```bash
curl -X POST http://localhost:8080/api/interview/turn \
  -F "audio=@candidate-answer.webm" \
  -F 'history=[]'
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

## 3. Environment Variables

```bash
PORT=8080
CLIENT_ORIGIN=http://localhost:5173
GROQ_API_KEY=gsk_your_key_here
GROQ_STT_MODEL=whisper-large-v3
GROQ_LLM_MODEL=llama-3.3-70b-versatile
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
GROQ_LLM_MODEL=llama-3.3-70b-versatile
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
