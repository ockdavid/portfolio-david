# David Landeo — Portfolio

Personal portfolio site for **David J. Landeo Vargas** — Data Engineer based in Madrid.

Live: [My portfolio](https://davidlandeo.me/)

---

## 📁 Project structure

```
.
├── index.html           ← the whole site (single page, hand-written HTML/CSS)
├── tweaks-panel.jsx     ← in-page Tweaks panel (palette switcher, persists to localStorage)
└── assets/
    ├── photo-dark.png       ← profile photo (dark theme)
    ├── photo-light.png      ← profile photo (light theme)
    └── David-Landeo-CV.pdf  ← downloadable CV
```

That's it. **No build step, no dependencies to install.** Just open `index.html` in a browser.

---

## 🛠 Working on it locally in VS Code

1. **Open the folder** in VS Code: `File → Open Folder…`
2. (Recommended) Install the **Live Server** extension by Ritwick Dey.
3. Right-click `index.html` → **"Open with Live Server"** — your browser opens with hot-reload on save.

Alternatively, any static server works:

```bash
# Python 3
python3 -m http.server 8000

# Node (with npx)
npx serve .
```

Then visit `http://localhost:8000`.

### Editing tips

- **All structure + content** lives in `index.html`. Sections are clearly commented (`<!-- ── Hero ── -->`, `<!-- ── Experience ── -->`, etc.) — search for the section name to jump to it.
- **All styles** are in the single `<style>` block at the top of `index.html`. The CSS uses custom properties (`--accent`, `--bg`, etc.) for theming. Light theme overrides live under `:root[data-theme="light"]`.
- **Theme toggle** writes to `localStorage` (`v3-theme` key).
- **Tweaks panel** (bottom-right) lets you swap the accent palette live. If you don't want it on the deployed site, remove the `<div id="tweaks-mount">` element and the two `<script type="text/babel">` blocks at the bottom of `index.html`.

### Common edits

| What | Where in `index.html` |
|---|---|
| Hero headline / tagline | search `I build` |
| Profile card (avatar + key info) | search `class="profile-card"` |
| KPI numbers | search `class="kpi-card"` |
| About paragraphs | search `class="about"` |
| Stack pills | search `class="stack-rows"` |
| Work experience entries | search `class="exp"` |
| Education / certifications | search `id="education"` |
| Selected projects | search `id="projects"` |
| Lab notebook (small projects) | search `class="lab-grid"` |
| Contact channels + links | search `id="contact"` |
| Footer | search `<footer>` |

---

## 🚀 Deploying on GitHub Pages

### One-time setup

1. Create a new repository on GitHub — e.g. `david-landeo.github.io` (use your GitHub username for a personal site at `https://<username>.github.io`) **or** any other name (you'll get `https://<username>.github.io/<repo-name>/`).
2. Push this folder:

   ```bash
   cd path/to/deploy
   git init
   git add .
   git commit -m "Initial portfolio commit"
   git branch -M main
   git remote add origin git@github.com:<your-username>/<repo-name>.git
   git push -u origin main
   ```

3. In GitHub, go to **Settings → Pages**.
4. Under **"Build and deployment"** set **Source** = `Deploy from a branch`, **Branch** = `main` / `/ (root)`, then **Save**.
5. Wait ~1 minute. Your site will be live at the URL shown on that page.

### Subsequent updates

```bash
git add .
git commit -m "describe the change"
git push
```

Pages redeploys automatically in <1 minute.

---

## 🌐 Custom domain (optional)

1. In **Settings → Pages → Custom domain**, enter your domain (e.g. `davidlandeo.com`).
2. In your DNS provider, add a `CNAME` record pointing your domain to `<your-username>.github.io`.
3. Enable **Enforce HTTPS** once the certificate is issued (a few minutes later).

---

## 📷 Replacing the profile photo

Drop new `photo-dark.png` / `photo-light.png` into `assets/` (any aspect ratio — CSS crops to a square with `object-fit: cover`).

If you want a single photo for both themes, point both `<img>` tags in `index.html` (search `class="avatar"`) to the same file.

---

## 📄 Updating the CV PDF

Replace `assets/David-Landeo-CV.pdf` with the new file (keep the same filename) — the "download CV" and "CV · download" links will pick it up automatically.

---

## 🧰 Tech

- Plain **HTML + CSS** — no framework, no bundler.
- **React 18 + Babel standalone** loaded from CDN, only for the in-page Tweaks panel.
- **Google Fonts**: Inter + JetBrains Mono.

Built in 2026. © David Landeo.
