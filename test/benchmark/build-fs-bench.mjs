// Builds the corpora used by fs-bench.html.
//
// Every service name is routed into a language corpus by the country of the
// source it was taken from, so `de` gets the German sources (Telefonverzeichnis
// Paris, Recherche DHI deutsche Dienststellen, ...) and everything else is
// treated as French (Bottin administratif Etat Francais, ...).
//
// Place strings from places.json are deliberately left out: current_country
// holds full country names ("France", "Jersey") and is only set on 886 of
// 15662 records, so the de/fr routing has no equivalent for them.
//
// Usage: node test/benchmark/build-fs-bench.mjs

import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(here, '../../data')

const read = name => JSON.parse(readFileSync(resolve(dataDir, `${name}.json`), 'utf8'))

const services = read('services')
const sources = read('sources')

const sourceById = new Map(sources.map(source => [source.id, source]))

const bucketOf = source => source.country === 'de' ? 'de' : 'fr'
const clean = value => typeof value === 'string' ? value.trim() : ''

const corpora = {de: [], fr: []}
const skipped = {noSource: 0, noName: 0}

for (const service of services) {
  const name = clean(service.name)
  if (!name) {
    skipped.noName++
    continue
  }

  const source = sourceById.get(service.source_id)
  if (!source) {
    skipped.noSource++
    continue
  }

  corpora[bucketOf(source)].push(name)
}

for (const source of sources) {
  const name = clean(source.name)
  if (!name) {
    skipped.noName++
    continue
  }

  corpora[bucketOf(source)].push(name)
}

// same split as tokenize() in _assets/js/lib/matchers.js:36, so the token count
// below matches what fs-bench.html feeds the stemmer. Unique-token counts are
// deliberately left out — folding collapses spellings differently, and the page
// reports that number where it matters.
const tokenize = string => string.split(/[\s\-]+/).filter(Boolean)

const stats = []

for (const [key, strings] of Object.entries(corpora)) {
  const tokens = strings.flatMap(tokenize)
  const json = JSON.stringify(strings)

  writeFileSync(resolve(here, `fs_bench.${key}.json`), json)

  stats.push({
    corpus: key,
    file: `fs_bench.${key}.json`,
    strings: strings.length,
    chars: strings.reduce((sum, string) => sum + string.length, 0),
    tokens: tokens.length,
    bytes: Buffer.byteLength(json)
  })
}

console.table(stats)

if (skipped.noSource || skipped.noName) {
  console.warn(`skipped ${skipped.noSource} services without source, ${skipped.noName} without name`)
}

console.log(`wrote ${stats.length} corpora to ${here}`)