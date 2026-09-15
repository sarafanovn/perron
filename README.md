# Perron

A customizable browser start page with draggable widgets (search, weather,
shortcuts), Apple-inspired design, background/color/font theming. Runs
entirely client-side; settings are stored in your browser's `localStorage`.

## Run locally

```bash
docker compose up --build -d
```

Open http://localhost:8080

## Use as your Firefox/Chromium start page

**Firefox:** Settings → Home → Homepage and new windows / New tabs → Custom
URLs → enter `http://localhost:8080`. For a true new-tab override, install
an extension such as "New Tab Override" and point it at the same URL.

**Chromium (Chrome, Edge, Brave, etc.):** Chromium does not allow
overriding the new-tab page without an extension. Install a "New Tab
Redirect" (or similar) extension and set the target URL to
`http://localhost:8080`. The regular Settings → On startup → Open a
specific page option also accepts this URL for startup/homepage behavior.

## Development

```bash
npm install
npm run dev
npm run test
```

## Notes

- Settings (theme, shortcuts, widget layout) are stored per-browser in
  `localStorage` — they do not sync between Firefox and Chromium or
  between machines.
- Weather data comes from the free Open-Meteo API; no API key required.
