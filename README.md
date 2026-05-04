<div align="center">
  <h1>🏥 MedClaro</h1>
  <p><strong>AI-Powered Personal Health Intelligence Platform</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
  [![Django](https://img.shields.io/badge/Django-5.0-092E20?logo=django)](https://www.djangoproject.com/)
  [![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
</div>

<br />

## 📖 Overview

**MedClaro** is a comprehensive, full-stack personal health intelligence application designed to help users understand, track, and manage their medical data. By leveraging state-of-the-art AI (Google Gemini), MedClaro securely processes medical reports, decodes complex prescriptions, and translates clinical jargon into easy-to-understand insights.

Designed with a calm, mobile-first user interface, the platform empowers patients and their families to take control of their health timelines without feeling overwhelmed.

---

## ✨ Key Features

- 📄 **Smart Report Analysis:** Upload medical PDFs or images. MedClaro extracts data and provides layered, plain-language explanations.
- 💬 **Interactive Health Chat:** Ask questions directly about your specific reports in a secure, scoped chat environment.
- 📈 **Longitudinal Trends:** Visualize health metrics over time with interactive charts, normalized values, and shaded reference ranges.
- 💊 **Prescription Decoding:** Understand medications, dosages, and potential side effects with AI-assisted OCR and parsing.
- 👨‍👩‍👧‍👦 **Family Management:** Manage health records and timelines for multiple family members from a single unified dashboard.
- 🌍 **Multilingual Support:** Accessible interface and AI explanations in multiple languages for diverse users.
- 🔔 **Smart Reminders:** Integrated health and medication reminders.
- 🔊 **Accessibility First:** Voice readouts for AI-generated medical summaries.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS, shadcn-style UI primitives
- **State & Auth:** NextAuth.js
- **Data Visualization:** Recharts
- **Internationalization:** next-intl

### Backend
- **Framework:** Django 5 & Django REST Framework (DRF)
- **Database:** Relational Database (via Django ORM)
- **Processing:** `pdfplumber` (PDF parsing), `python-magic` (MIME validation)
- **Storage:** AWS S3 / Cloudflare R2 (Presigned URLs for secure access)

### Artificial Intelligence
- **Model:** Google Gemini `gemini-1.5-flash`
- **Capabilities:** Prompt layer with strict scoped system instructions, prompt-injection defenses, and Gemini Vision OCR for image analysis.

---

## 🔒 Security & Privacy

Handling medical data requires strict security measures. MedClaro implements:
- **Application-Level Encryption:** AES-256-GCM encryption for all sensitive report payloads and stored user PII.
- **Robust AI Guardrails:** Defenses against prompt-injection, strict instruction-pattern stripping, and delimiter-wrapped report data.
- **Secure File Storage:** Files are never served publicly; access is strictly mediated via temporary presigned URLs.
- **Rate Limiting & Auth:** JWT-protected endpoints with per-user rate limiting to prevent abuse.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- S3-compatible storage (AWS S3 or Cloudflare R2)
- Google Gemini API Key

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables

1. Copy `.env.example` to `.env` in the root directory.
2. Fill in database, Gemini API keys, Google OAuth, and S3/R2 credentials.
3. Keep `NEXT_PUBLIC_API_URL` pointed at `http://localhost:8000/api` in your frontend environment.

*Note: If the backend is not running, the frontend will elegantly fall back to mock data, allowing UI exploration without a live server.*

---

## 📂 Project Architecture

```text
ProjectHealth/
├── backend/
│   ├── projecthealth_backend/ # Core Django configuration & routing
│   ├── users/                 # Custom user, profile, and family management
│   ├── reports/               # Report uploads, parsing, chat, and trends
│   ├── reminders/             # Medication and appointment reminders
│   └── app/                   # Legacy FastAPI source & prompt templates
└── frontend/
    ├── app/                   # Next.js App Router (Pages & Layouts)
    ├── components/            # Reusable UI & shadcn components
    ├── lib/                   # API layers, Auth configs, mock data
    └── messages/              # Translation dictionaries (next-intl)
```

---

<div align="center">
  <p>Built with 💙 for better health outcomes.</p>
</div>
