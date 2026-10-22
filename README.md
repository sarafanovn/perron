# Perron

A customizable browser start page with draggable widgets (search, weather,
shortcuts), Apple-inspired design, background/color/font theming. Runs
entirely client-side; settings are stored in your browser's `localStorage`.

## Use as your Firefox new-tab page (recommended)

Build and load the bundled Firefox extension — no server required:

```bash
make extension
```

This produces an unsigned `.zip` under `web-ext-artifacts/`. Release
Firefox only installs add-ons signed by Mozilla, so for permanent use
either install Perron from addons.mozilla.org or sign your own build
(free, nothing gets published):

```bash
# once: keys from https://addons.mozilla.org/developers/addon/api/key/
# (.amo-keys is gitignored)
cat > .amo-keys <<'KEYS'
WEB_EXT_API_KEY=<JWT issuer>
WEB_EXT_API_SECRET=<JWT secret>
KEYS

make sign
```

This writes a signed `.xpi` to `web-ext-artifacts/`; install it via
`about:addons` → gear icon → "Install Add-on From File…". Each signed
build needs a new `version` in `package.json`. For quick local testing, use `about:debugging#/runtime/this-firefox` → "Load
Temporary Add-on…" → select `dist-extension/manifest.json` (temporary
add-ons are removed when Firefox restarts).

Every new tab now shows Perron directly — no self-hosted server needed.

## Self-hosting (Chromium, or centrally-hosted setups)

Chromium does not allow overriding the new-tab page without an
extension, and doesn't support this repo's Firefox extension. Run
Perron as a server instead (requires only Docker):

```bash
make up
```

Open http://localhost:8080. See `make help` for other Docker targets
(`down`, `restart`, `rebuild`, `logs`, `ps`).

**Firefox (self-hosted):** Settings → Home → Homepage and new windows /
New tabs → Custom URLs → enter `http://localhost:8080`. For a true
new-tab override without the bundled extension, install one such as "New
Tab Override" and point it at the same URL.

**Chromium (Chrome, Edge, Brave, etc.):** Install a "New Tab Redirect"
(or similar) extension and set the target URL to `http://localhost:8080`.
The regular Settings → On startup → Open a specific page option also
accepts this URL for startup/homepage behavior.

## Development

Requires Node.js locally:

```bash
make install
make dev
make test
```

## Building the extension from source

These steps reproduce the exact contents of the published add-on (they
are also what addons.mozilla.org reviewers use with the uploaded source
archive):

1. Install Node.js 24 or newer.
2. `npm ci`
3. `npm run build:extension`

The unpacked extension is written to `dist-extension/`;
`npm run package:extension` zips it into `web-ext-artifacts/`.

## Releasing

CI (`.github/workflows/extension.yml`) lints and builds the extension on
every push and pull request. To publish a new version to
addons.mozilla.org:

1. Bump `version` in `package.json` (AMO rejects a version it has
   already seen) and commit.
2. `git tag v<version> && git push --tags`

The tag build attaches the `.zip` to a GitHub release and submits the
add-on and source archive to AMO for review. The AMO step runs only once
the repository secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` (from
https://addons.mozilla.org/developers/addon/api/key/) are set.

## Notes

- Settings (theme, shortcuts, widget layout) are stored per-browser in
  `localStorage` — they do not sync between Firefox and Chromium or
  between machines.
- Weather data comes from the free Open-Meteo API; no API key required.
- The Firefox extension and any self-hosted instance store settings
  separately (different origins) — they do not share `localStorage`.
