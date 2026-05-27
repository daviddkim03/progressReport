# ProgressReport

> A full-stack web application that generates professional PDF progress reports for students — built with **React + Vite** (frontend) and **Node.js + Express + Puppeteer** (backend).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Student selector** — dropdown populated live from the backend
- **Date range picker** — pick any start/end date window
- **One-click PDF generation** — Puppeteer renders a styled, printable PDF server-side
- **Auto-download** — the PDF lands in your browser's Downloads folder automatically
- **Stats computed per report** — average, highest, lowest score + performance trend
- **Clean service-layer architecture** — config / routes / services / templates fully separated

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite 5, Axios             |
| Backend   | Node.js 18+, Express 4, Puppeteer 22|
| PDF       | Puppeteer (headless Chromium)        |
| Fonts     | DM Serif Display + DM Sans (Google) |
| Dev tools | nodemon, concurrently                |

---

## Project Structure

```
ProgressReport/
│
├── start.sh                  ← Mac/Linux one-click launcher
├── start.bat                 ← Windows  one-click launcher
├── package.json              ← Root scripts (concurrently)
├── requirements.txt          ← Dependency reference doc
├── README.md
│
├── backend/
│   ├── .env.example          ← Copy to .env before running
│   ├── package.json
│   └── src/
│       ├── server.js         ← Express app entry point
│       ├── config/
│       │   └── classmarker.js        ← Mock data & student config
│       ├── routes/
│       │   ├── students.routes.js    ← GET /api/students
│       │   └── report.routes.js      ← POST /api/report
│       ├── services/
│       │   ├── classmarker.service.js ← Data fetching logic
│       │   ├── stats.service.js       ← Score computation (pure)
│       │   └── pdf.service.js         ← Puppeteer PDF generation
│       └── templates/
│           └── report.template.html  ← Styled HTML report template
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── components/
        │   └── ui/
        │       └── Button.jsx          ← Reusable button component
        ├── features/
        │   └── report/
        │       ├── api/
        │       │   └── reportApi.js    ← Axios calls
        │       ├── components/
        │       │   ├── StudentSelector.jsx
        │       │   ├── DateRangePicker.jsx
        │       │   └── GenerateReportButton.jsx
        │       └── hooks/
        │           └── useGenerateReport.js  ← All form/report logic
        ├── pages/
        │   └── ReportPage.jsx          ← Main page
        ├── services/
        │   └── apiClient.js            ← Axios instance (baseURL)
        └── utils/
            └── downloadFile.js         ← Blob → browser download
```

---

## Prerequisites

You need **Node.js 18 or newer** installed on your machine.

| OS      | Download |
|---------|----------|
| Mac     | https://nodejs.org  OR  `brew install node` |
| Windows | https://nodejs.org (use the LTS installer) |
| Linux   | `sudo apt install nodejs npm`  (Ubuntu/Debian) |

Verify your install:
```bash
node -v   # should print v18.x.x or higher
npm -v    # should print 9.x.x or higher
```

> **Note:** Puppeteer automatically downloads a compatible version of Chromium (~170 MB) the first time you run `npm install` in the backend folder. This is normal and required for PDF generation.

---

## Quick Start

### Mac / Linux

```bash
# 1. Enter the project folder
cd ProgressReport

# 2. Make the script executable (first time only)
chmod +x start.sh

# 3. Run everything
./start.sh
```

The script will:
- Check for Node.js
- Copy `.env.example` → `.env` automatically
- Install all dependencies (backend + frontend)
- Start both servers
- Print the URLs to visit

### Windows

```
Double-click  start.bat
```

Or from PowerShell / Command Prompt:
```powershell
cd ProgressReport
.\start.bat
```

Two new terminal windows will open — one for the backend, one for the frontend.

### Using npm (any OS)

From the **project root**:
```bash
# Install root + all workspace deps in one shot
npm install && npm run install:all

# Start both servers concurrently (coloured output)
npm run dev
```

---

## Manual Setup

If you prefer to run each server separately:

### Backend
```bash
cd ProgressReport/backend

# Copy environment file
cp .env.example .env        # Mac/Linux
copy .env.example .env      # Windows

# Install (downloads Puppeteer/Chromium on first run)
npm install

# Start in dev mode (auto-restarts on changes)
npm run dev

# OR start in production mode
npm start
```

Backend runs on → **http://localhost:5000**

---

### Frontend
```bash
# In a second terminal
cd ProgressReport/frontend

npm install

npm run dev
```

Frontend runs on → **http://localhost:5173**

---

## Environment Variables

Backend reads from `backend/.env`:

| Variable | Default | Description                    |
|----------|---------|--------------------------------|
| `PORT`   | `5000`  | Port the Express server binds to |

The `start.sh` / `start.bat` scripts create this file automatically.  
To set it manually:

```bash
cp backend/.env.example backend/.env
# Then edit backend/.env if you need a different port
```

> If you change `PORT`, also update `baseURL` in `frontend/src/services/apiClient.js`.

---

## API Reference

### `GET /api/students`

Returns all available students.

**Response**
```json
{
  "success": true,
  "data": [
    { "id": "stu-001", "name": "Amara Osei" },
    { "id": "stu-002", "name": "Liam Nakamura" }
  ]
}
```

---

### `POST /api/report`

Generates and streams a PDF report.

**Request body**
```json
{
  "studentId": "stu-001",
  "startDate": "2024-01-01",
  "endDate":   "2024-03-31"
}
```

**Response**  
Binary PDF stream with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="progress-report-amara-osei-2024-01-01-to-2024-03-31.pdf"
```

**Error responses**
| Status | Cause |
|--------|-------|
| `400`  | Missing / invalid fields, or startDate > endDate |
| `404`  | Student ID not found |
| `500`  | Internal server error (PDF generation failed) |

---

## How It Works

```
Browser                   Backend
  │                          │
  ├─ GET /api/students ──────►│ classmarker.service → returns mock list
  │◄─ [{ id, name }, …] ─────┤
  │                          │
  │  (user fills form)       │
  │                          │
  ├─ POST /api/report ───────►│ 1. validate input
  │  { studentId,            │ 2. classmarker.service → fetch results
  │    startDate, endDate }  │ 3. stats.service → compute avg/high/low/trend
  │                          │ 4. pdf.service → render HTML template
  │                          │ 5. Puppeteer → print to PDF buffer
  │◄─ [PDF binary stream] ───┤ 6. stream back as application/pdf
  │                          │
  downloadFile() saves PDF   │
  to browser Downloads       │
```

---

## Troubleshooting

**`Error: Cannot find module 'puppeteer'`**  
→ Run `npm install` inside the `backend/` folder.

**Puppeteer fails to launch Chromium**  
On Linux you may need extra dependencies:
```bash
sudo apt-get install -y libgbm-dev libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

**CORS error in browser console**  
→ Make sure the backend is running on port `5000`. Check `backend/.env` and ensure the frontend's `apiClient.js` `baseURL` matches.

**Port already in use**  
```bash
# Find and kill the process using port 5000 (Mac/Linux)
lsof -ti:5000 | xargs kill -9
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**PDF is blank or fonts look wrong**  
→ The report template loads Google Fonts over the network. If you're offline, it falls back to system serif/sans-serif fonts gracefully — content is still correct.

---

## License

MIT — free to use, modify, and distribute.
