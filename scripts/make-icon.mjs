// Generates src-tauri/app-icon.svg: a pixel-block "S" with a stepped echo on a black
// macOS-style rounded square. Render to PNG, then run `pnpm tauri icon <png>`.
import { writeFileSync } from 'node:fs'

const GLYPH = [
  '.####.',
  '##..##',
  '##....',
  '.####.',
  '....##',
  '##..##',
  '.####.',
]

const SIZE = 1024
const TILE = 824 // Apple icon grid: 824px body inside a 1024px canvas
const INSET = (SIZE - TILE) / 2
const RADIUS = 185
const CELL = 66

const cols = GLYPH[0].length
const rows = GLYPH.length
const originX = Math.round((SIZE - cols * CELL) / 2) - 14
const originY = Math.round((SIZE - rows * CELL) / 2) - 14

function glyph(dx, dy, fill) {
  const rects = GLYPH.flatMap((row, y) => [...row].map((c, x) => c === '#'
    ? `<rect x="${originX + x * CELL + dx}" y="${originY + y * CELL + dy}" width="${CELL}" height="${CELL}"/>`
    : '')).join('')
  return `<g fill="${fill}" shape-rendering="crispEdges">${rects}</g>`
}

// Each echo = a grey copy covered by a slightly-less-offset black copy, leaving a thin edge
const echo = [
  glyph(30, 30, '#5a5a5a'), glyph(25, 25, '#000'),
  glyph(16, 16, '#9a9a9a'), glyph(11, 11, '#000'),
].join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c1c1c"/>
      <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <clipPath id="tile"><rect x="${INSET}" y="${INSET}" width="${TILE}" height="${TILE}" rx="${RADIUS}"/></clipPath>
  </defs>
  <rect x="${INSET}" y="${INSET}" width="${TILE}" height="${TILE}" rx="${RADIUS}" fill="url(#bg)"/>
  <g clip-path="url(#tile)">${echo}${glyph(0, 0, '#f5f5f5')}</g>
  <rect x="${INSET + 1}" y="${INSET + 1}" width="${TILE - 2}" height="${TILE - 2}" rx="${RADIUS - 1}" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
</svg>
`

writeFileSync(new URL('../src-tauri/app-icon.svg', import.meta.url), svg)
console.log('wrote src-tauri/app-icon.svg')
