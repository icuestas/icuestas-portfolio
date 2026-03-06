# Ivan Cuestas — Portfolio

Personal portfolio site for Ivan Cuestas, Senior Frontend Engineer specializing in React & TypeScript.

**Live:** `https://your-site.netlify.app` ← update after deploying

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 4](https://astro.build) — hybrid SSR |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) + custom glassmorphism utilities |
| Adapter | [@astrojs/netlify](https://docs.astro.build/en/guides/integrations-guide/netlify/) |
| Email | [Nodemailer](https://nodemailer.com) via Gmail SMTP |
| Language | TypeScript |
| i18n | Astro built-in routing — English (`/`) + Spanish (`/es/`) |

---

## Project Structure

```
src/
├── components/
│   ├── Navbar.astro      # Fixed nav with language switcher (🇺🇸 / 🇪🇸)
│   ├── Hero.astro        # Landing section
│   ├── About.astro       # Bio, philosophy, stats, CV download
│   ├── Projects.astro    # 3-card project grid  ← fill in your projects here
│   ├── Skills.astro      # Core Stack vs Familiar With layout
│   └── Contact.astro     # Contact form with SMTP + honeypot
├── i18n/
│   ├── translations.ts   # All EN + ES strings in one place
│   └── index.ts          # useTranslations(), getLangFromUrl(), getAlternateUrl()
├── pages/
│   ├── index.astro       # English route  /
│   ├── es/
│   │   └── index.astro   # Spanish route  /es/
│   └── api/
│       └── contact.ts    # Server-side SMTP handler (Nodemailer)
└── styles/
    └── global.css        # Tailwind base + glassmorphism components
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Gmail credentials:

```dotenv
SMTP_USER=you@gmail.com
SMTP_PASS=your_16_char_app_password   # Gmail App Password, NOT your regular password
SMTP_TO=you@gmail.com                 # Where contact form emails are delivered
```

> **Gmail App Password:** Enable 2-Factor Authentication, then go to
> [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
> and create an App Password for "Mail". Use the 16-character code (no spaces).

### 3. Start the dev server

```bash
npm run dev
# English → http://localhost:4321/
# Spanish → http://localhost:4321/es/
```

---

## Customizing Content

### Your projects

Open [src/components/Projects.astro](src/components/Projects.astro) and replace the 3 placeholder entries.
Each project object accepts:

```ts
{
  title: string | bilingual expression,
  description: string | bilingual expression,   // lang === 'es' ? '...' : '...'
  tags: string[],
  color: string,      // Tailwind gradient classes, e.g. 'from-cyan-600 to-blue-800'
  liveUrl: string | null,
  githubUrl: string,
  featured: boolean,
}
```

### All text / copy

All UI strings live in [src/i18n/translations.ts](src/i18n/translations.ts).
Edit the `en` and `es` objects to update any label, heading, or placeholder across the whole site.

### Personal details to update

| File | What to change |
|---|---|
| [Hero.astro](src/components/Hero.astro) | GitHub + LinkedIn URLs |
| [About.astro](src/components/About.astro) | Photo (replace placeholder div with `<img>`), CV link |
| [Contact.astro](src/components/Contact.astro) | No hardcoded values — driven by translations |
| [translations.ts](src/i18n/translations.ts) | All copy, placeholders, labels |
| [index.astro](src/pages/index.astro) | `og:image` once you have a social preview image |

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

**Short version — Netlify (free):**

1. Push this repo to GitHub.
2. Connect it on [app.netlify.com](https://app.netlify.com) → Import project.
3. Build settings are auto-detected from `netlify.toml` — no changes needed.
4. Add the 3 env vars (`SMTP_USER`, `SMTP_PASS`, `SMTP_TO`) in Site configuration → Environment variables.
5. Deploy.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |

---

## Security

- SMTP credentials are server-side only — never exposed to the browser
- Contact form uses a **honeypot field** to silently discard bot submissions
- Input validation and field length limits in the API route
- HTML sanitization on all email output
- Security headers (`X-Frame-Options`, CSP, `Referrer-Policy`, etc.) via `netlify.toml`
