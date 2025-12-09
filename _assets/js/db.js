import {indexBy} from './lib/util'
import {Database, util} from '@wendig/lib'
import config from '../../_data/config'


// init

let storage = {
  places: {},
  services: {},
  sources: {}
}
let database = new Database()
onmessage = database.handler

const packTest = (services) => {
  let test = indexBy(services, (a) => `${a['name']}-${a['place_id']}`, true)
  for (const k of Object.keys(test)) {
    if (test[k].length < 2) {
      delete test[k]
    }
  }

  let idMap = {}
  let drop = []
  for (const [k, values] of Object.entries(test)) {
    let value = values[0]
    value['source_ids'] = [value['source_id']]
    value['parent_ids'] = [value['parent_source_id']]
    value['place_ids'] = [value['place_id']]

    for (const v of values.slice(1)) {
      value['source_ids'].push(v['source_id'])
      value['parent_ids'].push(v['parent_source_id'])
      value['place_ids'].push(v['place_id'])

      drop.push(v['id'])
      idMap[v['id']] = value['id']
    }

    value['parent_ids'] = util.unique(value['parent_ids']).filter(e => e !== undefined)
    value['place_ids'] = util.unique(value['place_ids']).filter(e => e !== undefined)
    value['source_ids'] = util.unique(value['source_ids']).filter(e => e !== undefined)

    // const keys = ['name', 'place_id', 'status']
    // for (const key of keys) {
    //   const values = util.unique(v.map(r => r[key]))
    //   if (values.length > 1) {
    //     console.log(k, v, key, values)
    //   }
    // }
  }
  console.log(test)
}

const setup = async () => {
  const places = await fetch(`${config().root_url}/data/place.json`).then(r => r.json())
  const sources = await fetch(`${config().root_url}/data/source.json`).then(r => r.json())
  const services = await fetch(`${config().root_url}/data/service.json`).then(r => r.json())

  // packTest(services)

  // console.log(places.length)
  // console.log(services.length)
  // console.log(sources.length)

  storage['places'] = indexBy(places, 'id')
  storage['services'] = indexBy(services, 'id')
  storage['sources'] = indexBy(sources, 'id')

  storage['roots'] = {}

  for (const [id, service] of Object.entries(storage['services'])) {
    // build hierarchy
    service['hierarchy'] = service['d_breadcrumb'].join(' » ')

    // add source
    const source_id = service['source_id']
    service['source'] = storage['sources'][source_id]

    // add place
    const place_id = service['place_id']
    service['place'] = storage['places'][place_id]

    // build hierarchy
    const parent_id = service['parent_service_id']
    if (!parent_id) {
      storage['roots'][id] = service
      continue
    }

    delete service['parent_service_id']
    service['parent_id'] = parent_id

    const parent = storage['services'][parent_id]
    parent['child_ids'] = parent['child_ids'] || []
    parent['child_ids'].push(service['id'])
  }

  database.loaded()
}
setup()

// actions

const matchesTerms = (target, actual) => {
  if (!target) return true
  if (!actual) return false

  const r = new RegExp(util.fold(target), 'i')
  const actuals = (Array.isArray(actual) ? actual : [actual])

  for (const a of actuals) {
    if (!a) continue
    if (util.fold(a).match(r)) return true
  }

  return false
}

const matchesIds = (target, actual) => {
  if (!target) return true

  return target.indexOf(actual) != -1
}

const matchesParentId = (target, actual) => {
  if (!target) return true
  if (target === -1) return !actual
  
  return target === actual
}

const matchesExactly = (target, actual) => {
  if (!target) return true

  return target === actual
}

const matchesYears = (years, record) => {
  if (!years) return true
  const actual = dig(record, ['source', 'd_edition_year'])
  if (!actual) return false

  return years.indexOf(actual) != -1
}

const dig = (obj, chain = []) => {
  let result = obj

  while (result && chain.length > 0) {
    const key = chain.shift()
    result = result[key]
  }

  return result
}

database.action('services', data => {
  const criteria = sanitizeCriteria(data.criteria)

  const results = Object.values(storage['services']).filter(record => {
    if (record['name'] === true) return false // TODO: fix data
    if (record['status'] === 'deleted') return false // TODO: fix data

    if (criteria['fav']) {
      if (!matchesIds(criteria['id'], record['id'])) return false
    }

    const name = record['name']
    if (!matchesTerms(criteria['name'], name)) return false

    const city = dig(record, ['place', 'current_city'])
    if (!matchesTerms(criteria['city'], city)) return false

    const address = dig(record, ['place', 'current_street'])
    if (!matchesTerms(criteria['address'], address)) return false

    const organization = record['hierarchy']
    if (!matchesTerms(criteria['organization'], organization)) return false

    const parentId = record['parent_id']
    if (!matchesParentId(criteria['parentId'], parentId)) return false

    const country = dig(record, ['source', 'country'])
    if (!matchesExactly(criteria['country'], country)) return false

    if (!criteria['fav']) {
      if (!matchesTerms(criteria['terms'], [name, city, address])) return false
      if (!matchesYears(criteria['years'], record)) return false
    }

    return true
  })

  const sorted = util.sortBy(results, r => {
    const dirty = (typeof r['name'] === 'string' ? r['name'] : '')
    const clean = dirty.replaceAll(/[\(\)]+/g)

    return clean
  })

  return paginate(sorted, criteria)
})


database.action('services-map', data => {
  const criteria = sanitizeCriteria(data.criteria)

  const results = Object.values(storage['services']).filter(record => {
    if (record['name'] === true) return false
    if (!record['place']) return false
    if (!record['place']['latitude']) return false

    return true
  }).slice(0, 1000)

  criteria['perPage'] = results.length

  return paginate(results, criteria)
})


// helpers

const sanitizeCriteria = (input) => {
  let criteria = input || {}
  criteria['page'] = criteria['page'] || 1
  criteria['perPage'] = criteria['perPage'] || 24
  if (criteria['years']) {
    criteria['years'] = criteria['years'].
      split(/\s*,\s*/).
      map(y => parseInt(y))
  }
  if (criteria['id']) {
    criteria['id'] = criteria['id'].
      split(/\s*,\s*/).
      map(y => parseInt(y))
  }
  criteria['parentId'] = (
    criteria['parentId'] ?
    parseInt(criteria['parentId'] || -1) :
    null
  )

  return criteria
}

const paginate = (records, criteria) => {
  const total = records.length
  const page = criteria.page
  let perPage = criteria.perPage
  if (perPage === 'max') perPage = total

  const start = (page - 1) * perPage
  const results = records.slice(start, start + perPage)

  return {
    page,
    perPage,
    total,
    results
  }
}
