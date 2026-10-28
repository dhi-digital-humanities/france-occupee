import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'fs'

import * as ms from '../_assets/js/lib/matchers.js'

const td = JSON.parse(readFileSync('./data/thesaurus.json'))
ms.applyThesaurusData(td)

test('tokenization', () => {
  assert.deepEqual(ms.tokenize('japanisch'), ['japanisch'])
  assert.deepEqual(
    ms.tokenize('Japanisch-Kaiserliche Marine'),
    ['japanisch', 'kaiserliche', 'marine']
  )
  assert.deepEqual(ms.tokenize('Grüne Grütze'), ['grune', 'grutze'])
  assert.deepEqual(ms.tokenize('Côtes d’Armor'), ['cotes', "d'armor"])
  // assert.deepEqual(ms.tokenize('J. Bond'), ['bond'])
  // assert.deepEqual(ms.tokenize('lou de mer'), ['lou', 'mer'])
})

test('term matching (any)', () => {
  assert(ms.matchesAnyTerms('saint', 'saint-germain'))
  assert(ms.matchesAnyTerms('saint', 'Saint-Germain'))
  assert(ms.matchesAnyTerms('saint', 'Saint-Rémy-de-Provence'))
  assert(ms.matchesAnyTerms('saint', 'St. Germain'))
  assert(ms.matchesAnyTerms('st.', 'Saint Germain'))
  assert(ms.matchesAnyTerms('st.', 'Saint-Germain'))
  assert(ms.matchesAnyTerms('main', 'Saint Germain'))
  assert(ms.matchesAnyTerms('japan', 'Japanisch-Kaiserliche Marine'))
  assert(ms.matchesAnyTerms('japanisch', 'Japanisch-Kaiserliche Marine'))
  assert(ms.matchesAnyTerms('liche', 'Japanisch-Kaiserliche Marine'))

  assert(!ms.matchesAnyTerms('rma', 'Saint Germain'))
  assert(!ms.matchesAnyTerms('pan', 'Japanisch-Kaiserliche Marine'))
})

test('thesaurus alternatives are matched as whole terms', () => {
  assert(!ms.matchesAllTerms(ms.tokenize('maison close'), 'Maison de la culture'))
  assert(ms.matchesAllTerms(ms.tokenize('maison close'), 'Wehrmachtbordell Paris'))
  assert(ms.matchesAllTerms(ms.tokenize('bordell'), 'Wehrmachtbordell Paris'))
  assert(!ms.matchesAllTerms(ms.tokenize('bordell'), 'Maison de la culture'))
  assert(!ms.matchesAllTerms(ms.tokenize('close'), 'Maison de la culture'))
})

test('thesaurus groups do not leak through shared tokens', () => {
  assert(!ms.matchesAllTerms(ms.tokenize('saint'), 'Sankt-Ludwig'))
  assert(ms.matchesAllTerms(ms.tokenize('saint louis'), 'Sankt-Ludwig'))
  assert(!ms.matchesAllTerms(ms.tokenize('saint louis'), 'Saint-Germain-en-Laye'))
  assert(!ms.matchesAllTerms(ms.tokenize('basses alpes'), 'Rue de la Paix'))
  assert(ms.matchesAllTerms(ms.tokenize('basses alpes'), 'Alpes-de-Haute-Provence'))
  assert(ms.matchesAllTerms(ms.tokenize('Côtes-du-Nord'), 'Côtes d’Armor'))
  assert(ms.matchesAllTerms(ms.tokenize('Côtes d’Armor'), 'Côtes-du-Nord'))
})

test('thesaurus terms span compounds and word order', () => {
  assert(ms.matchesAllTerms(ms.tokenize('aeroport'), 'Flugplatz'))
  assert(ms.matchesAllTerms(ms.tokenize('flug platz'), 'Aéroport de Paris'))
  assert(ms.matchesAllTerms(ms.tokenize('verbindungs stab'), 'Feldkommandantur 517'))
  assert(ms.matchesAllTerms(ms.tokenize('verbindungs stab'), 'Verbindungsstab der Luftwaffe'))
  assert(!ms.matchesAllTerms(ms.tokenize('verbindungs stab'), 'Feld der Ehre'))
  assert(!ms.matchesAllTerms(ms.tokenize('kommando stab'), 'Verbindungsstab der Luftwaffe'))
})

test('year matching', () => {
  const record = {source: {d_edition_year: 1943}}

  assert(ms.matchesYears(null, record))
  assert(ms.matchesYears([1943], record))
  assert(!ms.matchesYears([1944], record))
  assert(!ms.matchesYears([1943], {source: {}}))
  assert(!ms.matchesYears([1943], {}))
})
