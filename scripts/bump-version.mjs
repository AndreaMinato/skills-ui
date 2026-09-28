// Usage: pnpm release <x.y.z>
// Sets the version in package.json, tauri.conf.json and Cargo.toml, then commits and tags.
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const version = process.argv[2]?.replace(/^v/, '')
if (!version || !/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version)) {
  console.error('Usage: pnpm release <x.y.z>')
  process.exit(1)
}

const run = cmd => execSync(cmd, { stdio: 'inherit' })

if (execSync('git status --porcelain').toString().trim()) {
  console.error('Working tree is not clean; commit or stash first.')
  process.exit(1)
}

function updateJson(path) {
  const json = JSON.parse(readFileSync(path, 'utf8'))
  json.version = version
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`)
}

updateJson('package.json')
updateJson('src-tauri/tauri.conf.json')

const cargoPath = 'src-tauri/Cargo.toml'
writeFileSync(cargoPath, readFileSync(cargoPath, 'utf8').replace(/^version = ".*"$/m, `version = "${version}"`))
// Refresh Cargo.lock with the new package version
run('cargo update --workspace --manifest-path src-tauri/Cargo.toml')

run('git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock')
run(`git commit -m "chore: release v${version}"`)
run(`git tag v${version}`)
console.log(`\nTagged v${version}. Push to trigger the release:\n  git push && git push origin v${version}`)
