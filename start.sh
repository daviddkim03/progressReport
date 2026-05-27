#!/usr/bin/env bash
# ============================================================
#  ProgressReport — unified start script
#  Works on macOS and Linux
#  Usage:  ./start.sh
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}${BOLD}[ProgressReport]${RESET} $*"; }
ok()   { echo -e "${GREEN}✔${RESET}  $*"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $*"; }
die()  { echo -e "${RED}✖  $*${RESET}"; exit 1; }

# ── Check Node is installed ───────────────────────────────────
command -v node >/dev/null 2>&1 || die "Node.js is not installed. See README.md for instructions."
command -v npm  >/dev/null 2>&1 || die "npm is not installed. It should come with Node.js."
ok "Node $(node -v) / npm $(npm -v) found"

# ── Deploy backend to Railway ─────────────────────────────────
if command -v railway >/dev/null 2>&1; then
  log "Deploying backend to Railway…"
  cd "$BACKEND_DIR"
  railway up --detach 2>/dev/null || warn "Railway deploy had warnings (non-fatal)"
  ok "Railway deploy triggered"
  cd "$ROOT_DIR"
else
  warn "Railway CLI not found — skipping deploy. Install with: npm install -g @railway/cli"
fi

# ── Backend: copy .env if missing ────────────────────────────
if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  ok "Created backend/.env from .env.example"
fi

# ── Install dependencies ──────────────────────────────────────
log "Installing backend dependencies (this includes Puppeteer + Chromium ~170 MB on first run)…"
cd "$BACKEND_DIR" && npm install
ok "Backend dependencies installed"

log "Installing frontend dependencies…"
cd "$FRONTEND_DIR" && npm install
ok "Frontend dependencies installed"

# ── Launch both servers ───────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${BOLD}Starting ProgressReport${RESET}"
echo -e "  Backend  → ${CYAN}http://localhost:5000${RESET}"
echo -e "  Frontend → ${CYAN}http://localhost:5173${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop both servers"
echo ""

# Run backend in background, capture its PID
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!

# Give backend a moment to bind the port
sleep 1

# Run frontend in foreground (Ctrl+C here kills both via trap)
trap "kill $BACKEND_PID 2>/dev/null; echo ''; log 'Servers stopped.'" EXIT INT TERM

cd "$FRONTEND_DIR"
npm run dev