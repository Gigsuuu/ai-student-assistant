# CogniStudy AI — Engineering Student Assistant 🚀

An AI-powered student assistant web application built for engineering exam preparation and active recall using **Next.js (App Router)**, **Tailwind CSS**, and the **Google Gemini API**.

Students can paste lecture notes or upload course documents (`.txt` or `.pdf`) to instantly generate structured summaries, test their knowledge with interactive multiple-choice quizzes, drill key terms with 3D flip flashcards, and ask grounded questions to an AI Teaching Assistant.

---

## 🌟 Key Features & Architecture

### 1. The 4 Core Study Features
- **📑 Document Summarizer (`/api/summarize`)**:
  - **Key Concepts**: Core engineering theories and abstractions with clear technical explanations.
  - **High-Yield Bullet Takeaways**: Exam-focused summary points and trade-offs.
  - **Important Definitions**: Formatted terminology cards for critical vocabulary, formulas, and theorems.
  - **Export Options**: One-click "Copy Summary" to clipboard and complete `.txt` study note export.
- **📝 Interactive Quiz Generator (`/api/quiz`)**:
  - Generates **5 concept-checking multiple-choice questions** strictly grounded in the study notes.
  - Instant visual feedback on answer selection (Emerald for correct, Rose for incorrect).
  - Detailed pedagogical explanations displayed for each question.
  - Real-time scoring progress bar, percentage tracker, and celebratory completion banner with retake and retry options.
- **🗂️ 3D Flashcard Creator (`/api/flashcards`)**:
  - Synthesizes **6 to 8 active-recall flashcards** (Front: Term/Concept; Back: Definition/Formula).
  - Interactive 3D flip animation with click and keyboard controls (`Space`/`Enter` to flip, `ArrowLeft`/`ArrowRight` to navigate).
  - Practice modes: **Single Card Practice View** with shuffle support and **Grid Overview View**.
- **💬 Academic Q&A Chat (`/api/chat`)**:
  - Context-grounded AI Teaching Assistant that answers student questions **strictly from the provided lecture material** to eliminate hallucinations.
  - Clickable suggested starter prompts for rapid exploration.
  - Bounded conversation history (last 10 turns) to prevent payload overflow, with friendly single-turn failure recovery and retry buttons.

### 2. Defensive Architecture & Resilience
- **Multi-Model Fallback Chain**:
  - Automatically fails over across Google Gemini models in sequence:
    $$\text{gemini-3.5-flash-lite} \longrightarrow \text{gemini-3.6-flash} \longrightarrow \text{gemini-3.8-flash}$$
  - Handles transient `503 Service Unavailable` and `429 Too Many Requests` errors with **exponential backoff and random jitter** (~1s, ~2s) over 2 retries per model before cascading to the next tier.
- **12,000-Character Input Truncation & Visual Warning**:
  - Pre-truncates input text to **12,000 characters** across all endpoints (`truncateDocument`) to guarantee sub-30s response times and stay within Gemini token boundaries.
  - A prominent visual warning badge alerts students when their notes exceed 12,000 characters, clarifying that only the first 12,000 characters are analyzed for maximum speed.
- **Client-Side State Caching**:
  - React state caches summaries, quizzes, and flashcards keyed by document text hash (`studyText.trim()`).
  - Switching between tabs is instantaneous with zero redundant API calls, while editing text automatically invalidates the cache for fresh generations.
- **Input Guardrails & Duplicate Submission Prevention**:
  - Generate and Send buttons are disabled when study notes are empty or whitespace-only, with subtle inline helper prompts.
  - Submission handlers enforce `if (isLoading) return;` locks to prevent duplicate simultaneous clicks.
- **File Upload Validation & Corrupted PDF Protection**:
  - Enforces a **10 MB maximum file size**, rejects empty (0-byte) files, and restricts inputs to `.txt` and `.pdf`.
  - Validates PDF magic headers (`%PDF-`) and catches corrupted, password-protected, or unreadable PDFs with user-friendly error banners.
- **JSON Parsing Resilience**:
  - Safely extracts JSON from Markdown code blocks (` ```json ... ``` `), strips conversational preambles/postambles, and repairs trailing commas.
  - Frontend tabs provide clean **"Retry Generation"** buttons instead of crashing if generation is interrupted.
- **IPv4 DNS Resolution Fix**:
  - Enforces `dns.setDefaultResultOrder("ipv4first")` and Node CLI flags to eliminate IPv6 socket hang timeouts on Windows machines contacting Google APIs.

---

## 🛠️ Tech Stack & Prerequisites

### Technologies Used
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS, PostCSS, Lucide Icons (`lucide-react`)
- **AI Integration**: Google Gemini REST API (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`)
- **Document Processing**: `pdf-parse` (Server-side Node.js buffer extraction)
- **Utilities**: `clsx`, `tailwind-merge`

### Prerequisites
Before running the application, make sure you have:
1. **Node.js**: LTS version (`v18.17.0` or higher, recommended `v20+`)
2. **npm**: `v9.0.0` or higher (bundled with Node.js)
3. **Git**: Installed and configured
4. **Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## 🚀 Step-by-Step Local Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Gigsuuu/ai-student-assistant.git
cd ai-student-assistant
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the `.env.example` template to `.env.local`:
```bash
# On Linux / macOS / Git Bash:
cp .env.example .env.local

# On Windows (PowerShell):
Copy-Item .env.example .env.local

# On Windows (Command Prompt):
copy .env.example .env.local
```

Open `.env.local` in your editor and insert your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

> **Tip**: Click the **"Load CE Sample"** button on the top-right of the left panel to instantly load a full Computer Engineering lecture note (*Lecture 14: Virtual Memory, Paging & TLBs*) to test all 4 study tools with zero typing.

### 5. Production Build & Verification
To test an optimized production build locally:
```bash
npm run build
npm start
```

---

## 📂 Project Structure & Team Workflow

### Directory Layout
```
ai-student-assistant/
├── .env.example                  # Environment variable reference template
├── .env.local                    # Local secrets (GEMINI_API_KEY - gitignored)
├── next.config.mjs               # Next.js build configuration
├── package.json                  # Scripts & project dependencies
├── tailwind.config.ts            # Tailwind styling theme & animations
├── tsconfig.json                 # TypeScript compiler configuration
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── chat/
    │   │   │   └── route.ts      # Grounded Academic Q&A API (bounded history)
    │   │   ├── flashcards/
    │   │   │   └── route.ts      # 6-8 Flashcard JSON generator (resilient parser)
    │   │   ├── parse-pdf/
    │   │   │   └── route.ts      # Secure PDF buffer text extraction (10MB limit)
    │   │   ├── quiz/
    │   │   │   └── route.ts      # 5 MCQ quiz generator with explanations
    │   │   └── summarize/
    │   │       └── route.ts      # Structured summary & definition generator
    │   ├── globals.css           # Global CSS and 3D card flip keyframes
    │   ├── layout.tsx            # Root HTML shell & metadata
    │   └── page.tsx              # Main dashboard controller & client-side cache
    ├── components/
    │   ├── Header.tsx            # Hackathon branding and status badges
    │   ├── StudyInputPanel.tsx   # File upload, paste textarea, 12k char warning & stats
    │   └── tabs/
    │       ├── SummarizerTab.tsx # Key concepts, takeaways & export tools
    │       ├── QuizTab.tsx       # 5 MCQs with instant feedback & retry logic
    │       ├── FlashcardsTab.tsx # 3D flip cards with single/grid views & retry
    │       └── ChatTab.tsx       # Grounded TA chat with retryable turns
    └── lib/
        ├── gemini.ts             # Multi-model fallback chain, retry backoff & JSON cleaner
        ├── sampleNotes.ts        # Built-in Computer Engineering sample study material
        └── types.ts              # Shared TypeScript definitions
```

### Team Branching & Pull Request Workflow
To maintain code quality and prevent merge conflicts during hackathon sprints, our team follows a strict Git workflow:
1. **Never commit directly to `main`**: The `main` branch is protected and reserved for stable, deployable releases.
2. **Feature Branches**:
   - Create a feature branch off latest `main`:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b feat/your-feature-name
     ```
   - Use descriptive branch prefixes:
     - `feat/*`: New features or UI components (e.g., `feat/edge-cases`, `feat/ui-polish`)
     - `fix/*`: Bug fixes or endpoint patches
3. **Local Validation**:
   - Verify code compiles and passes type-checking before pushing:
     ```bash
     npm run build
     ```
4. **Pull Requests (PR)**:
   - Push your branch to GitHub:
     ```bash
     git push origin feat/your-feature-name
     ```
   - Open a Pull Request into `main` with a clear description of changes.
   - At least one teammate review or verification step is required before merging.
