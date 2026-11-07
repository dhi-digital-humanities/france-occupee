import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'

// Photos live in data/placeimages/{place_id}.jpg and the app builds the URL
// from the id, so image_path must follow the same convention.
test('place image paths follow the id convention', () => {
  const places = JSON.parse(readFileSync('data/places.json', 'utf8'))
  const withImage = places.filter(place => place.image_path)

  assert(withImage.length > 0)

  const wrong = withImage.
    filter(place => place.image_path !== `${place.id}.jpg`).
    map(place => `${place.id}: ${place.image_path}`)
  assert.deepEqual(wrong, [])

  const missing = withImage.
    filter(place => !existsSync(join('data/placeimages', place.image_path))).
    map(place => place.image_path)
  assert.deepEqual(missing, [])
})
