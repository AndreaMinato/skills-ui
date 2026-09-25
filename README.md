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

## Layout

- `src-tauri/src/lib.rs` — `run_skills(args, cwd)` command spawning the CLI
- `src/lib/skillsCli.ts` — invoke wrapper + output parsers
- `src/composables/` — `useCli` (runner/log), `useScope`, `useInstalled`, `useSearch`
- `src/components/` — `installed/`, `search/`, `shell/` (scope bar, activity log)
