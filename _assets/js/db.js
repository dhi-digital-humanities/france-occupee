import {util} from '@wendig/lib'
import {Database} from '@wendig/lib'
import config from './lib/dotenv'


// init

let storage = {}
let database = new Database()
onmessage = database.handler

let promises = []
promises.push(
  fetch(`${config.root_url}/data/place.json`).then(r => r.json()).then(data => {
    storage['places'] = data
  })
)

promises.push(
  fetch(`${config.root_url}/data/service.json`).then(r => r.json()).then(data => {
    storage['services'] = data
  })
)

promises.push(
  fetch(`${config.root_url}/data/source.json`).then(r => r.json()).then(data => {
    storage['sources'] = data
  })
)

promises.push(
  fetch(`${config.root_url}/data/service_bridge.json`).then(r => r.json()).then(data => {
    storage['service_bridge'] = data
  })
)

Promise.all(promises).then(data => {
  console.log('ALL loaded')
  database.loaded()
})


// actions

database.action('my-action', data => {
  const criteria = sanitizeCriteria(data.criteria)

  const results = storage['places'].filter(record => {
    // ... return false if record doesn't match criteria ...

    return true
  })

  return paginate(results, criteria)
})


// helpers

const sanitizeCriteria = (input) => {
  let criteria = input || {}
  criteria['page'] = criteria['page'] || 1
  criteria['per_page'] = criteria['per_page'] || 24

  return criteria
}

const paginate = (records, criteria, highlight) => {
  const {page, per_page} = criteria
  const total = records.length
  const start = (criteria.page - 1) * criteria.per_page
  const results = records.slice(start, start + criteria.per_page)

  return {
    page,
    per_page,
    total,
    results,
    highlight
  }
}
