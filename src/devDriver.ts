/**
 * Dev-only test hook: long-polls a local driver server for JS snippets, runs
 * them in the page and posts back the result. Enabled only when the app is
 * started with `VITE_DEV_DRIVER=http://127.0.0.1:<port> pnpm tauri dev`.
 */
export async function startDevDriver(baseUrl: string) {
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
  for (;;) {
    try {
      const res = await fetch(`${baseUrl}/next`)
      if (res.status !== 200)
        continue
      const { id, code } = await res.json() as { id: number, code: string }
      let result: unknown
      let ok = true
      try {
        result = await new AsyncFunction(code)()
      }
      catch (e) {
        ok = false
        result = e instanceof Error ? `${e.message}\n${e.stack}` : String(e)
      }
      await fetch(`${baseUrl}/result`, {
        method: 'POST',
        body: JSON.stringify({ id, ok, result }),
      })
    }
    catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
}
