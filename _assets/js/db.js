import {util} from '@wendig/lib'
import {Database} from '@wendig/lib'
import config from '../../_data/config'


// init

let storage = {
  places: {},
  services: {},
  sources: {}
}
let database = new Database()
onmessage = database.handler

const setup = async () => {
  const places = await fetch(`${config().root_url}/data/place.json`).then(r => r.json())
  const services = await fetch(`${config().root_url}/data/service.json`).then(r => r.json())
  const sources = await fetch(`${config().root_url}/data/source.json`).then(r => r.json())

  // console.log(places.length)
  // console.log(services.length)
  // console.log(sources.length)

  storage['places'] = util.indexBy(places, 'id')
  storage['services'] = util.indexBy(services, 'id')
  storage['sources'] = util.indexBy(sources, 'id')

  storage['roots'] = {}

  for (const [id, service] of Object.entries(storage['services'])) {
    // build hierarchy
    service['hierarchy'] = service['d_breadcrumb'].join(' » ')

    // add source
    const source_id = service['source_id']
    service['source'] = storage['sources'][source_id]

    // add place - join place.json với service.json thông qua place_id
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
    if (record['name'] === true) return false // TODO: fix data

    // Đảm bảo place được join đúng qua place_id
    if (!record['place_id']) return false
    if (!record['place']) return false
    if (!record['place']['latitude']) return false
    if (!record['place']['longitude']) return false

    // Áp dụng các filter criteria tương tự như services action
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
  }).slice(0, 1000)

  criteria['perPage'] = results.length

  return paginate(results, criteria)
})

database.action('services-by-place', data => {
  const placeId = data.placeId
  if (!placeId) return { page: 1, perPage: 0, total: 0, results: [] }

  const results = Object.values(storage['services']).filter(record => {
    if (record['name'] === true) return false
    if (record['place_id'] !== placeId) return false
    return true
  })

  const sorted = util.sortBy(results, r => {
    const y = dig(r, ['source', 'd_edition_year']) || 0
    const m = dig(r, ['source', 'd_edition_month']) || 0
    return `${y}-${String(m).padStart(2, '0')}`
  })

  const criteria = { page: data.page || 1, perPage: data.perPage || 10 }
  return paginate(sorted, criteria)
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
