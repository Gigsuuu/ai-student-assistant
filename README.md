# CogniStudy AI — Engineering Student Assistant 🚀

An AI-Powered Student Assistant web application built for the **Computer Engineering Hackathon** using **Next.js (App Router)**, **Tailwind CSS**, and the official **Google Gemini API** (`@google/generative-ai`).

Students can paste lecture notes, upload `.txt` or `.pdf` course files, and immediately access four interactive revision tabs tailored for engineering exam preparation.

---

## 🌟 Key Features

### 1. Multi-Format Material Ingestion (Left Panel)
- **Direct Paste & Editing**: Dedicated code/notes editor with live word and character counters and estimated reading time.
- **Document Uploader**: Drag-and-drop support for `.txt` files (instant client-side `FileReader`) and `.pdf` files (server-side `pdf-parse` pipeline).
- **One-Click CE Sample Loader**: Pre-loaded with *CS/CE 301: Virtual Memory, Paging & Translation Lookaside Buffers (TLB)* so judges and reviewers can test all features in one click.

### 2. Four Interactive Study Tabs (Right Panel)
- **📑 Document Summarizer** (`/api/summarize`):
  - 💡 **Key Concepts**: Core engineering principles and conceptual abstractions.
  - 📌 **Bullet Takeaways**: High-yield takeaways and trade-offs.
  - 📖 **Important Definitions**: Glossary cards for critical terminology, formulas, and theorems.
  - *One-click "Copy Summary" to clipboard in Markdown format.*
- **📝 Quiz Generator** (`/api/quiz`):
  - Formulates **5 conceptual multiple-choice questions** directly grounded in the notes.
  - Instant visual feedback on answer selection (Emerald Green for correct, Crimson for incorrect).
  - Shows clear **pedagogical explanations** for every question once answered.
  - Live score tracking (`Progress`, `Current Score %`, and celebratory completion banner with retake options).
- **🗂️ Flashcard Creator** (`/api/flashcards`):
  - Generates **6 to 8 interactive 3D click-to-flip cards** (Term/Concept on front, Definition/Mechanics on back).
  - Navigation controls: Previous / Next, card counter (`Card 3 of 8`), and card shuffling.
  - Keyboard shortcuts: `Space` or `Enter` to flip, `ArrowLeft` / `ArrowRight` to navigate.
  - View mode toggle: **Single Card Practice View** vs. **Grid Overview View**.
- **💬 Academic Q&A Chat** (`/api/chat`):
  - Contextual AI Teaching Assistant that answers questions **strictly based on the uploaded lecture material** to eliminate hallucinations.
  - Quick-start suggested prompts for common engineering questions.
  - Conversational message thread with user & assistant avatars, timestamps, and "Clear Chat" option.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS, Lucide Icons (`lucide-react`)
- **AI Engine**: Google Gemini API (`@google/generative-ai`), powered by `gemini-3.8-flash`
- **PDF Extraction**: `pdf-parse` Node.js pipeline
- **Runtime**: Node.js LTS (v26.13.1)

---

## 📂 Project Structure

```
├── .env.local                    # Environment variables (GEMINI_API_KEY)
├── next.config.mjs               # Webpack & Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration & palette
├── package.json                  # Dependencies & scripts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts         # Context-grounded Q&A API
│   │   │   ├── flashcards/route.ts   # 6-8 Flashcards JSON generator
│   │   │   ├── parse-pdf/route.ts    # Server-side PDF text parser
│   │   │   ├── quiz/route.ts         # 5 MCQs with instant feedback API
│   │   │   └── summarize/route.ts    # Structured concepts & glossary API
│   │   ├── globals.css               # Tailwind & 3D card flip styles
│   │   ├── layout.tsx                # App root layout & metadata
│   │   └── page.tsx                  # Dashboard layout & tab controller
│   ├── components/
│   │   ├── Header.tsx                # Hackathon branding header
│   │   ├── StudyInputPanel.tsx       # Document upload, paste & stats panel
│   │   └── tabs/
│   │       ├── SummarizerTab.tsx     # Concepts, takeaways & glossary
│   │       ├── QuizTab.tsx           # 5 MCQs with score tracking
│   │       ├── FlashcardsTab.tsx     # 3D interactive flip flashcards
│   │       └── ChatTab.tsx           # Academic grounded Q&A chat
│   └── lib/
│       ├── gemini.ts                 # Gemini client & clean JSON parser
│       ├── sampleNotes.ts            # Pre-loaded Computer Engineering sample
│       └── types.ts                  # Shared TypeScript interfaces
```

---

## 🚀 Getting Started

### 1. Configure Gemini API Key
In `.env.local`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```
