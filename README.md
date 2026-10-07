# Skills UI

Tauri 2 + Vue 3 desktop GUI for the [skills.sh](https://skills.sh) CLI (`npx skills@latest`).

- **Installed** — list (`ls --json`), filter, update one/all (`update`), remove (`remove`)
- **Browse & add** — search (`find <q>`), add a result (`add owner/repo --skill x`), or add any package/URL with optional skills/agents
- **Scope** — Global (`-g`) or a chosen project folder (used as cwd)
- **Activity** — every command + its output

Commands run via the user's login shell (`$SHELL -ilc`) so nvm/fnm/volta PATHs work from the GUI.

## Dev

Requires Rust ([rustup](https://rustup.rs)) + Node.

```sh
pnpm install
pnpm tauri dev      # run app
pnpm tauri build    # bundle
```

## Releases & auto-update

The app checks `releases/latest/download/latest.json` on GitHub at startup (click the version
label to check manually) and offers to install + restart. Update bundles are signed; the public key
lives in `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.

One-time setup:

```sh
pnpm tauri signer generate -w ~/.tauri/skills-ui.key   # keep the key + password safe
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/skills-ui.key
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD         # prompts for the password
```

Release:

```sh
pnpm release 0.2.0                   # bumps versions, commits, tags v0.2.0
git push && git push origin v0.2.0   # .github/workflows/release.yml builds + publishes
```

macOS builds are not notarized: on first launch, open System Settings → Privacy & Security and click "Open Anyway", or run `xattr -dr com.apple.quarantine "/Applications/Skills UI.app"`.

## Layout

- `src-tauri/src/lib.rs` — `run_skills(args, cwd)` command spawning the CLI
- `src/lib/skillsCli.ts` — invoke wrapper + output parsers
- `src/composables/` — `useCli` (runner/log), `useScope`, `useInstalled`, `useSearch`
- `src/components/` — `installed/`, `search/`, `shell/` (scope bar, activity log)

## Dev test hook

`src/devDriver.ts` is loaded only in dev when `VITE_DEV_DRIVER` is set. It long-polls
`$VITE_DEV_DRIVER/next` for JS snippets, runs them in the page and POSTs results to
`/result`. It's used to drive the real Tauri window in tests (WKWebView has no WebDriver on macOS).
