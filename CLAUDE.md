# CLAUDE.md — ePerformance Project Guide

This file documents the codebase structure, conventions, and workflows for AI assistants working on the **ePerformance** project.

---

## Project Overview

**ePerformance** is a professional services website for K. STEPHANE, a strategic consultant targeting French-speaking African entrepreneurs. The core offering is a paid coaching program for profitable customer acquisition.

The project consists of:
- A **static marketing website** (HTML/CSS/JS, no framework)
- A **backend diagnostic API** (Express.js) that processes form submissions, calls the Claude API for personalized analysis, and sends emails via Brevo
- A **Netlify serverless function** mirror of the same backend logic

**Live domain**: `eperformance.pro`

---

## Repository Structure

```
/
├── server.js                       # Express backend (Render deployment)
├── package.json                    # Node.js config — single dependency: express
├── index.html                      # Main landing page
├── diagnostic_eperformance.html    # Multi-step diagnostic form (main conversion)
├── guide.html                      # Strategic guide page
├── formation.html                  # Training program page
├── kstephane.html                  # Consultant bio page
├── cas-client-mlm.html             # MLM case study
├── mentions-legales.html           # Legal notice (French law)
├── politique-confidentialite.html  # Privacy policy
├── cookies.html                    # Cookie policy
├── merci-candidature.html          # Post-application thank you
├── merci-ebook.html                # Post-ebook-download thank you
├── 404.html                        # 404 error page
├── netlify/
│   └── functions/
│       └── diagnostic.js           # Netlify serverless version of server.js
├── ebook/index.html                # Ebook landing (duplicate route)
├── formation/index.html            # Formation landing (duplicate route)
├── guide/index.html                # Guide landing (duplicate route)
├── kstephane/index.html            # Bio landing (duplicate route)
├── cookies/index.html              # Cookies landing (duplicate route)
├── CNAME                           # DNS: eperformance.pro
├── robots.txt                      # Disallows merci-* pages
├── sitemap.xml                     # 6 canonical URLs
├── og-image.jpg                    # OpenGraph share image
├── couverture-ebook.jpg            # Ebook cover
├── apple-touch-icon.png            # PWA icon 192px
├── icon-192.png                    # PWA icon 192px
├── icon-512.png                    # PWA icon 512px
└── favicon.ico                     # Browser favicon
```

**No build step.** Files are deployed as-is.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| Backend | Node.js + Express.js 4.x |
| Serverless | Netlify Functions |
| AI | Claude API (`claude-haiku-4-5-20251001`) |
| Email | Brevo SMTP API |
| Analytics | Google Analytics 4, Microsoft Clarity, Meta Pixel |
| Fonts | Google Fonts (Cormorant Garamond, DM Sans) |
| Icons | Font Awesome 6.5.0 (CDN) |
| Deployment | Render (backend), GitHub Pages / Netlify (frontend) |

---

## Environment Variables

The backend requires two secrets — set them in the hosting platform (Render / Netlify):

| Variable | Purpose |
|----------|---------|
| `ANTHROPICAPIKEY` | Claude API key (Anthropic) |
| `BREVOAPIKEY` | Brevo email service API key |
| `PORT` | HTTP port (defaults to 3000 if unset) |

**Never commit API keys.** There is no `.env` file in this repo.

---

## Running Locally

```bash
npm install          # installs express only
ANTHROPICAPIKEY=xxx BREVOAPIKEY=xxx node server.js
```

The server starts on `http://localhost:3000`.

There is **no dev server, hot reload, or build command**. Edit HTML files directly and open them in a browser.

---

## Core Data Flow: Diagnostic

```
User fills form (diagnostic_eperformance.html)
  → POST /diagnostic (server.js or netlify/functions/diagnostic.js)
    → Calculate metrics (CAC, LTV, payback, LTV:CAC ratio, maturity score)
    → Identify structural flaws (up to 3)
    → Call Claude API → personalized narrative analysis (max 400 tokens)
    → Build two HTML email templates (prospect view + admin dashboard)
    → Send both emails via Brevo API
  → Return JSON { success: true } or { error: ... }
User sees success screen
```

### Metrics Calculated Server-Side

| Metric | Formula |
|--------|---------|
| CAC | `budget_pub / clients_par_mois` |
| LTV | `vente_moyenne × duree_vie_client_multiplier` |
| Payback | `CAC / absolute_margin` |
| LTV:CAC | `LTV / CAC` (healthy ≥ 3.0) |
| Maturity Score | Base 50 + adjustments (0–100 scale) |

---

## Code Conventions

### HTML & CSS

- **No framework** — all styles are inline `<style>` blocks within each HTML file.
- **CSS custom properties** define the design system at `:root`:
  ```css
  --bg: #08080c;       /* dark background */
  --gold: #c9a96e;     /* primary accent / brand */
  --blue: #1a42c0;     /* CTA buttons */
  --wa: #25D366;       /* WhatsApp green */
  ```
- **Typography**: `'Cormorant Garamond'` (serif) for headlines, `'DM Sans'` (sans-serif) for body.
- **Breakpoints**: 860px → 580px → 480px → 360px (mobile-first cascade).
- **Class naming**: hyphen-separated English (`btn-primary`, `form-shell`, `load-ov`).
- **IDs**: camelCase (`mobOv`, `progFill`, `closeBtn`).
- Each page is **self-contained** — its full CSS is in its own `<style>` tag.

### JavaScript

- **Vanilla JS only** — no imports, no bundler.
- DOM queries via `getElementById` and `querySelector`.
- Async form submission uses `fetch` + `async/await`.
- Form state persisted to `localStorage` during the session.
- Conditional field visibility toggled via `.cond.show` class.
- Validation errors shown via `.ferr.show` class.

### Form Field Naming (diagnostic form)

Form fields use **French snake_case**:
`clients_par_mois`, `vente_moyenne`, `panier_moyen`, `budget_pub`, `duree_vie_client`, `usage_whatsapp`, `taux_retention`, `marge_pourcentage`

### Backend (server.js / diagnostic.js)

- Business logic, email templates, and Claude prompt are all in a single file — do not split without good reason.
- Inline HTML email templates are built by string concatenation — keep this pattern consistent.
- Lookup tables (sector hooks, budget labels) are plain JS objects at the top of the function.
- CORS is restricted to `https://eperformance.pro` — do not loosen this.
- All API calls are wrapped in try/catch with fallback strings so the form never fails silently.

### Content Language

- **User-facing content**: French (target audience: Francophone Africa).
- **Code, comments, variable names**: English or French — both appear; follow the local convention in the file you are editing.
- **Commit messages**: Simple imperative, no conventional-commit prefix required (existing style: `Update index.html`, `Add files via upload`).

---

## Deployment

### Render (backend API)

- Entry point: `server.js`
- Start command: `node server.js`
- Set environment variables `ANTHROPICAPIKEY` and `BREVOAPIKEY` in the Render dashboard.
- CORS is hard-coded to allow `https://eperformance.pro` only.

### Netlify (frontend + serverless fallback)

- Static files are deployed from the root.
- `netlify/functions/diagnostic.js` mirrors the `/diagnostic` endpoint for serverless execution.
- Set the same environment variables in Netlify's dashboard.

### GitHub Pages

- The `CNAME` file points to `eperformance.pro`.
- Push to `main` to deploy static pages.

---

## Third-Party Integrations

| Service | ID / Config | Purpose |
|---------|------------|---------|
| Google Analytics 4 | `G-Z7QW8BCYQ1` | Traffic tracking |
| Microsoft Clarity | `w2e89n0biv` | Session recording / heatmaps |
| Meta Pixel | `1592627695615531` | Facebook ad conversion tracking |
| Brevo | env var `BREVOAPIKEY` | Transactional email |
| Claude API | env var `ANTHROPICAPIKEY` | AI diagnostic narrative |
| WhatsApp | `+225 01 51 17 06 66` | Direct contact CTA |

---

## Key Files to Know

| File | Why It Matters |
|------|---------------|
| `server.js` | All backend logic: metrics, Claude call, email templates, routing |
| `diagnostic_eperformance.html` | Primary conversion page — the multi-step diagnostic form |
| `index.html` | Main landing page — all marketing copy and CTAs live here |
| `netlify/functions/diagnostic.js` | Must stay in sync with `server.js` |

---

## What Does NOT Exist

- No linter (ESLint, Stylelint)
- No formatter (Prettier)
- No bundler (Webpack, Vite)
- No test suite
- No CI/CD pipeline (no `.github/workflows/`)
- No `.gitignore` (no generated files to ignore given the no-build setup)
- No README.md

When adding tooling, introduce it incrementally and document it here.

---

## Common Tasks

### Update page content
Edit the relevant `.html` file directly. Styles are in the `<style>` block at the top of each file.

### Change Claude model or prompt
Edit the `generateClaudeAnalysis` function in `server.js` (and mirror the change in `netlify/functions/diagnostic.js`).

### Add a new page
1. Create `page-name.html` in the root.
2. Create `page-name/index.html` for clean URL routing.
3. Add the URL to `sitemap.xml`.
4. Update `robots.txt` if the page should be excluded from indexing.

### Change the diagnostic scoring logic
The score and flaw-detection logic live in the `/diagnostic` POST handler in `server.js`. Update `netlify/functions/diagnostic.js` to match.

### Add a new form field
1. Add the input in `diagnostic_eperformance.html`.
2. Parse and use it in the backend handler in `server.js`.
3. Mirror the backend change in `netlify/functions/diagnostic.js`.

---

## Security Notes

- API keys must remain in environment variables — never hardcode.
- CORS is intentionally restrictive; do not add wildcard origins.
- The diagnostic endpoint accepts arbitrary user input — validate/sanitize before using in prompts or emails.
- No authentication layer exists; the API is rate-limited only by the hosting platform.
