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

    // add place - join place.json với service.json thông qua place_id
    const place_id = service['place_id']
    service['place'] = storage['places'][place_id]

    // cleanup
    delete service['d_breadcrumb']
    delete service['last_editor_basic_user_id']
    delete service['filemaker_ids']
    delete service['fts']

    // sort
    service['sort'] = fold(service['name']) //.replaceAll(/ /g, '')
    let fts_data = [service['name']]
    if (service['place']) {
      fts_data.push(service['place']['name'])
      fts_data.push(service['place']['current_city'])
      fts_data.push(service['place']['current_street'])
    }
    service['fts'] = fold(fts_data.join(' '))

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

  const r = new RegExp(target, 'i')
  const actuals = (Array.isArray(actual) ? actual : [actual])

  for (const a of actuals) {
    if (!a) continue
    if (a.match(r)) return true
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
  if (!Array.isArray(target)) target = [target]

  return target.indexOf(actual) != -1
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

const matchesHierarchy = (hierarchy, record) => {
  if (!hierarchy) return true

  let tracker = []
  let r = record
  while (!!r) {
    if (r['id'] in hierarchy) {
      const v = hierarchy[r['id']]

      for (const t of tracker) hierarchy[t] = v

      return v
    }

    tracker.push(r['parent_id'])
    r = storage['services'][r['parent_id']]
  }

  const country = record['source']['country']
  return hierarchy[country]
}

const hasGeo = (record) => {
  if (!record['place']) return false
  if (!record['place']['latitude']) return false
  if (!record['place']['longitude']) return false

  return true
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
    if (record['status'] === 'deleted') return false // TODO: fix data

    if (criteria['fav']) {
      if (!matchesIds(criteria['id'], record['id'])) return false
    }

    const isParent = ((record['child_ids'] || []).length > 0)
    if (criteria['onlyParents'] && !isParent) return false

    if (!matchesHierarchy(criteria['hierarchy'], record)) return false

    if (criteria['onlyGeo'] && !hasGeo(record)) return false

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
      const fts = record['fts']
      if (!matchesTerms(criteria['terms'], fts)) return false
      if (!matchesYears(criteria['years'], record)) return false
    }

    return true
  })

  const sorted = util.sortBy(results, r => r['sort'])

  return paginate(sorted, criteria)
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

const fold = (str) => {
  if (str == undefined) {return str}

  return str.toString().trim().toLowerCase().
    replaceAll(/[äáàâå]/g, 'a').
    replaceAll(/[öóòôðø]/g, 'o').
    replaceAll(/[iíìî]/g, 'i').
    replaceAll(/[ëéèê]/g, 'e').
    replaceAll(/[üúùû]/g, 'u').
    replaceAll(/[ÿ]/g, 'y').
    replaceAll(/[ćč]/g, 'c').
    replaceAll(/[ł]/g, 'l').
    replaceAll(/[śš]/g, 's').
    replaceAll(/[ż]/g, 'z').
    replaceAll(/æ/g, 'ae').
    replaceAll(/ß/g, 'ss').
    replaceAll(/ł/g, 'l')
}

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
  if (criteria['hierarchy']) {
    const values = Object.values(criteria['hierarchy'])

    const allFalse = values.every(v => !v)
    if (allFalse) delete criteria['hierarchy']

    const allTrue = values.every(v => v)
    if (allTrue) delete criteria['hierarchy']
  }

  const toFold = ['name', 'city', 'address', 'organization', 'terms']
  for (const f of toFold) {
    if (f in criteria) criteria[f] = fold(criteria[f])
  }

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
