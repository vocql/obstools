# VOQCL TOOLS

A static, no-build website: 33 tools for streamers and creators. No server code, no accounts, no uploads.

`index.html` is the whole site: the CSS and all JavaScript are inside it, so there are no other files to keep track of.

## Run it
- **Easiest:** double-click `index.html`. Every tool works except live Twitch playback in Multiview (Twitch requires an http(s) address).
- **Full features (recommended):** serve the folder, then open http://localhost:8000
  - `python3 -m http.server 8000`  (or `npx serve`)
- **Host it:** upload `index.html` to any static host (Netlify, GitHub Pages, Cloudflare Pages, Vercel).

## Notes
- The Follower Tracker's OBS overlay URL (`#/live/<channel>/overlay`) points at this site, so host it or serve it locally.
- ChatIS builds a URL for the free ChatIS service; paste it into an OBS Browser Source.
- CS2 Stats Bar is manual: type in your numbers and export an overlay (live stats would need an API key and a server).
- `src/` holds the separate CSS/JS source files if you want to edit them. Rebuild by pasting them back into `index.html`.
