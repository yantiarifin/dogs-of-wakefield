#!/usr/bin/env node
// Scans portraits/, generates the two web-sized copies of each portrait, and
// refreshes portraits.json. Existing `passed` flags are preserved, so this is
// safe to re-run whenever new portraits are dropped into the folder.
//
//   node scripts/build-gallery.mjs
//
// The 3000px originals stay out of git (see .gitignore) — only thumbs/ and
// display/ are deployed, so the site never serves a multi-megabyte image.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORTRAITS_DIR = join(ROOT, 'portraits')
const THUMBS_DIR = join(PORTRAITS_DIR, 'thumbs')
const DISPLAY_DIR = join(PORTRAITS_DIR, 'display')
const MANIFEST = join(ROOT, 'portraits.json')

const THUMB_SIZE = 700    // grid cards
const DISPLAY_SIZE = 1600 // modal — comfortably sharp on a retina laptop
const SOURCE_RE = /\.(jpe?g|png)$/i
// Filenames look like "Porkchop-2025-07-30.jpg" — trailing ISO date, name may
// contain hyphens itself, so anchor on the date at the end.
const NAME_DATE_RE = /^(.+)-(\d{4}-\d{2}-\d{2})$/

function readExistingFlags() {
  if (!existsSync(MANIFEST)) return new Map()
  try {
    const { portraits = [] } = JSON.parse(readFileSync(MANIFEST, 'utf8'))
    return new Map(portraits.map(p => [p.id, p]))
  } catch (err) {
    console.error(`Could not parse existing ${MANIFEST}, starting fresh:`, err.message)
    return new Map()
  }
}

function resize(sourceFile, outDir, outFile, maxSize, quality) {
  execFileSync('sips', [
    '--resampleHeightWidthMax', String(maxSize),
    '--setProperty', 'format', 'jpeg',
    '--setProperty', 'formatOptions', String(quality),
    join(PORTRAITS_DIR, sourceFile),
    '--out', join(outDir, outFile),
  ], { stdio: 'pipe' })
}

const existing = readExistingFlags()
mkdirSync(THUMBS_DIR, { recursive: true })
mkdirSync(DISPLAY_DIR, { recursive: true })

const sources = readdirSync(PORTRAITS_DIR)
  .filter(f => SOURCE_RE.test(f))
  .sort()

const portraits = []
let built = 0

for (const file of sources) {
  const id = file.replace(SOURCE_RE, '')
  const match = NAME_DATE_RE.exec(id)
  if (!match) {
    console.warn(`Skipping "${file}" — expected a Name-YYYY-MM-DD filename.`)
    continue
  }

  const [, name, date] = match
  const outFile = `${id}.jpg`

  if (!existsSync(join(THUMBS_DIR, outFile))) {
    resize(file, THUMBS_DIR, outFile, THUMB_SIZE, 80)
    built++
  }
  if (!existsSync(join(DISPLAY_DIR, outFile))) {
    resize(file, DISPLAY_DIR, outFile, DISPLAY_SIZE, 82)
    built++
  }

  portraits.push({
    id,
    name,
    date,
    thumb: `portraits/thumbs/${outFile}`,
    display: `portraits/display/${outFile}`,
    // Set to true to mark a dog as having crossed the rainbow bridge.
    passed: existing.get(id)?.passed ?? false,
  })
}

// Alphabetical by name, with repeat names (Scooby, Winston) ordered by date.
portraits.sort((a, b) =>
  a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.date.localeCompare(b.date))

writeFileSync(MANIFEST, `${JSON.stringify({ portraits }, null, 2)}\n`)

const passed = portraits.filter(p => p.passed).length
console.log(`${portraits.length} portraits (${built} new image${built === 1 ? '' : 's'} resized), ${passed} marked as passed.`)
console.log(`Wrote ${MANIFEST}`)
