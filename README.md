# VOQCL TOOLS

A static, no-build website: 32 tools for streamers and creators. No server code, no accounts, no uploads.

## Run it
- **Easiest:** double-click `index.html`. Every tool works except live Twitch playback in Multiview (Twitch requires an http(s) address).
- **Full features (recommended):** serve the folder, then open http://localhost:8000
  - `python3 -m http.server 8000`  (or `npx serve`)
- **Host it:** upload the folder to any static host (Netlify, GitHub Pages, Cloudflare Pages, Vercel). For Multiview on a real domain nothing extra is needed — the site passes its own hostname to Twitch.

## Files
- `index.html` – page shell and navigation
- `css/style.css` – theme (black/charcoal, custom scrollbar)
- `js/core.js` – helpers; `js/tools.js`, `js/multiview.js`, `js/tools2.js` – the tools; `js/app.js` – router and shortcuts

## Multiview
Add Twitch or YouTube streams by name or link; the platform is auto-detected (plain names = Twitch, `@handle` is not embeddable on YouTube, use a video/live link or `youtube.com/channel/UC…`). Embedded players require a normal http(s) host. If a host blocks embeds (as claude.ai's preview does) each tile shows an *Open* button instead.

## Chat & follower tools
- **ChatIS Chat Overlay** builds a URL for the free ChatIS service (chatis.is2511.com). Paste it into an OBS Browser Source.
- **Live Follower Tracker** reads counts from the free DecAPI service every 15s. Its OBS overlay URL (`#/live/<channel>/overlay`) points at this site, so host it or serve it locally.

## OBS overlays
Follower/Goal, Emote Overlay, Stream Countdown and Stream Timer export a standalone `.html` file.
In OBS: Sources → Browser → tick **Local file** → pick the exported file → set size (e.g. 1920×1080).

## Shortcuts
`/` or `Ctrl/Cmd+K` – jump to search · `Esc` – leave a field. Shortcuts are ignored while you type in inputs.

## Limits
Overlays cannot read live Twitch/YouTube data or chat (that needs a server and API keys). Background Remover is colour-based, not AI.
