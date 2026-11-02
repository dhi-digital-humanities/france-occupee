import test from 'node:test'
import assert from 'node:assert/strict'

import {decode, encode} from '../_assets/js/lib/hierarchy.js'

test('hierarchy url decoding', () => {
  assert.deepEqual(decode('de,12,-34'), {'de': true, '12': true, '34': false})
  assert.deepEqual(decode('fr'), {'fr': true})
  assert.equal(decode(''), undefined)
  assert.equal(decode(undefined), undefined)
})

test('hierarchy url encoding', () => {
  const nodes = [
    {
      keys: ['de'],
      checked: true,
      children: [
        {keys: ['10', '11'], checked: true, children: []},
        {
          keys: ['12'],
          checked: false,
          children: [
            {keys: ['13'], checked: true, children: []}
          ]
        }
      ]
    },
    {
      keys: ['fr'],
      checked: false,
      children: [
        {keys: ['20'], checked: false, children: []}
      ]
    }
  ]

  assert.equal(encode(nodes), 'de,-12,13')
  assert.deepEqual(
    decode(encode(nodes)),
    {'de': true, '12': false, '13': true}
  )
  assert.equal(encode([]), '')
})
