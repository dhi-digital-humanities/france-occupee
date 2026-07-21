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
  // assert.deepEqual(ms.tokenize('J. Bond'), ['bond'])
  // assert.deepEqual(ms.tokenize('lou de mer'), ['lou', 'mer'])
})

test('term expansion with thesaurus', () => {
  assert.deepEqual(ms.expand(['st.', 'germain']), ['st.', 'saint', 'germain'])
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

  assert(ms.matchesAnyTerms('japanisch flotte', 'Japanisch-Kaiserliche Marine'))

  assert(!ms.matchesAnyTerms('rma', 'Saint Germain'))
  assert(!ms.matchesAnyTerms('pan', 'Japanisch-Kaiserliche Marine'))
})

test('term matching (multiple)', () => {

})