import test from 'node:test'
import assert from 'node:assert/strict'
import {readdirSync, readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'

// Every image a component points at must actually ship in assets/images/, or the
// browser renders a broken image (this is how the tree-view plus/minus went missing).
test('component image references resolve', () => {
  const missing = []

  for (const name of readdirSync('_assets/js/components').filter(f => f.endsWith('.riot'))) {
    const source = readFileSync(join('_assets/js/components', name), 'utf8')

    for (const [, file] of source.matchAll(/\/assets\/images\/([A-Za-z0-9_./-]+)/g)) {
      if (!existsSync(join('assets/images', file))) missing.push(`${name} -> assets/images/${file}`)
    }
  }

  assert.deepEqual(missing, [])
})

// FontLoader registers the UI face at runtime; a renamed or missing file
// silently falls back to the generic sans.
test('font loader references resolve', () => {
  const source = readFileSync('_assets/js/lib/font_loader.js', 'utf8')
  const missing = []

  for (const [, file] of source.matchAll(/\/assets\/fonts\/([A-Za-z0-9_./-]+)/g)) {
    if (!existsSync(join('assets/fonts', file))) missing.push(`assets/fonts/${file}`)
  }

  assert.deepEqual(missing, [])
})

// Eleventy copies some assets straight out of node_modules (e.g. the
// bootstrap-icons sprite behind the order-control chevrons). If the package is
// not installed the build silently skips it and the icon vanishes.
test('eleventy passthrough sources from node_modules resolve', () => {
  const config = readFileSync('eleventy.config.mjs', 'utf8')
  const missing = []

  for (const [, file] of config.matchAll(/['"]node_modules\/([^'"]+)['"]/g)) {
    if (!existsSync(join('node_modules', file))) missing.push(`node_modules/${file}`)
  }

  assert.deepEqual(missing, [])
})
