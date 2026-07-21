import {stringify} from 'csv-stringify/sync'

import {indexBy, paginate as upaginate} from './lib/util'
import {Database, util, i18n} from '@wendig/lib'
import config from '../../_data/config'
import * as ms from './lib/matchers'


// init

let storage = {
  places: {},
  services: {},
  sources: {}
}
let database = new Database()
onmessage = database.handler

// const packTest = (services) => {
//   let test = indexBy(services, (a) => `${a['name']}-${a['place_id']}`, true)
//   for (const k of Object.keys(test)) {
//     if (test[k].length < 2) {
//       delete test[k]
//     }
//   }

//   let idMap = {}
//   let drop = []
//   for (const [k, values] of Object.entries(test)) {
//     let value = values[0]
//     value['source_ids'] = [value['source_id']]
//     value['parent_ids'] = [value['parent_source_id']]
//     value['place_ids'] = [value['place_id']]

//     for (const v of values.slice(1)) {
//       value['source_ids'].push(v['source_id'])
//       value['parent_ids'].push(v['parent_source_id'])
//       value['place_ids'].push(v['place_id'])

//       drop.push(v['id'])
//       idMap[v['id']] = value['id']
//     }

//     value['parent_ids'] = util.unique(value['parent_ids']).filter(e => e !== undefined)
//     value['place_ids'] = util.unique(value['place_ids']).filter(e => e !== undefined)
//     value['source_ids'] = util.unique(value['source_ids']).filter(e => e !== undefined)

//     // const keys = ['name', 'place_id', 'status']
//     // for (const key of keys) {
//     //   const values = util.unique(v.map(r => r[key]))
//     //   if (values.length > 1) {
//     //     console.log(k, v, key, values)
//     //   }
//     // }
//   }
//   console.log('test', test)
// }

const setup = async () => {
  const places = await fetch(`${config().root_url}/data/places.json`).then(r => r.json())
  const sources = await fetch(`${config().root_url}/data/sources.json`).then(r => r.json())
  const services = await fetch(`${config().root_url}/data/services.json`).then(r => r.json())
  const thesaurus = await fetch(`${config().root_url}/data/thesaurus.json`).then(r => r.json())

  ms.applyThesaurusData(thesaurus)

  // packTest(services)

  // console.log(places.length)
  // console.log(services.length)
  // console.log(sources.length)

  storage['places'] = indexBy(places, 'id')
  storage['servicesByPlaceId'] = indexBy(services, s => s['place_id'], true)
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

    // sort
    service['sort'] = {}
    service['sort']['name'] = fold(service['name'])
    let fts_data = [service['name']]
    fts_data.push(service['comment'] || '')
    // fts_data = fts_data.concat(service['d_breadcrumb'])
    if (service['place']) {
      fts_data.push(service['place']['name'])
      fts_data.push(service['place']['current_city'])
      fts_data.push(service['place']['current_street'])
      fts_data.push(service['place']['current_house_number'])
      fts_data.push(service['place']['current_zip'])
      fts_data.push(service['place']['current_country'])
      fts_data.push(service['place']['former_city'])
      fts_data.push(service['place']['former_street'])
      fts_data.push(service['place']['former_house_number'])
      fts_data.push(service['place']['former_zip'])
      fts_data.push(service['place']['former_country'])

      service['sort']['city'] = fold(service['place']['current_city'])
      service['sort']['address'] = fold(service['place']['current_address'])
    }
    service['fts'] = fold(fts_data.join(' '))
    service['sort']['fts'] = service['fts']
    service['sort']['date'] = service['date']

    // cleanup
    delete service['d_breadcrumb']

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


const dig = (obj, chain = []) => {
  let result = obj

  while (result && chain.length > 0) {
    const key = chain.shift()
    result = result[key]
  }

  return result
}

const findServices = (criteria, basis=null) => {
  const services = basis || Object.values(storage['services'])

  return services.filter(record => {
    if (!ms.matchesIds(criteria['id'], record['id'])) return false

    const isParent = ((record['child_ids'] || []).length > 0)
    if (criteria['onlyParents'] && !isParent) return false

    if (!ms.matchesHierarchy(criteria['hierarchy'], record)) return false

    if (criteria['onlyGeo'] && !ms.hasGeo(record)) return false

    const name = record['name']
    if (!ms.matchesAllTerms(criteria['name'], name)) return false

    const city = dig(record, ['place', 'current_city'])
    if (!ms.matchesAllTerms(criteria['city'], city)) return false

    if (!ms.matchesAddress(criteria['address'], record)) return false

    const organization = record['hierarchy']
    if (!ms.matchesAllTerms(criteria['organization'], organization)) return false

    const parentId = record['parent_id']
    if (!ms.matchesParentId(criteria['parentId'], parentId)) return false

    const country = dig(record, ['source', 'country'])
    if (!ms.matchesExactly(criteria['country'], country)) return false

    const status = record['status']
    if (!ms.matchesExactly(criteria['status'], status)) return false

    const placeStatus = dig(record, ['place', 'status'])
    if (!ms.matchesExactly(criteria['placeStatus'], placeStatus)) return false

    if (!criteria['fav']) {
      if (!ms.matchesAllTerms(criteria['terms'], record['fts'])) return false
      if (!ms.matchesYears(criteria['years'], record)) return false
    }

    return true
  })
}

const toCsv = (results) => {
  const rows = results.map(r => {
    const y = r['source']['d_edition_year']
    const m = r['source']['d_edition_month']

    return [
      r['place'] ? r['place']['current_city'] : '',
      r['name'],
      r['hierarchy'],
      `${y}/${m}`,
      r['source']['country']
    ]
  })

  return stringify(rows, {delimiter: ';'})
}

database.action('services', data => {
  const criteria = sanitizeCriteria(data.criteria)
  const results = findServices(criteria)
  const sorted = sortResults(results, criteria)

  return (
    criteria['csv'] == 'true' ?
    {csv: toCsv(sorted)} :
    paginate(sorted, criteria)
  )
})

database.action('places-map', data => {
  const criteria = sanitizeCriteria(data.criteria)
  const results = findServices(criteria)

  const byPlaceId = indexBy(results, r => r['place_id'], true)
  const places = Object.entries(byPlaceId).map(([placeId, services]) => {
    let d = {
      place: storage['places'][placeId],
      country: services[0]['source']['country']
    }
    
    return d
  })

  return paginate(places, criteria)
})

database.action('place', data => {
  const criteria = sanitizeCriteria(data.criteria)
  const placeId = criteria['id']
  const place = storage['places'][placeId]
  const services = storage['servicesByPlaceId'][placeId]

  delete criteria['id']
  const filtered = findServices(criteria, services)
  const sorted = util.sortBy(filtered, service => {
    const source = service['source']
    return source['edition_date'] || 'zzz'
  })

  return {place, services: sorted}
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

const sortResults = (results, criteria) => {
  const c = criteria['sort'] || 'name'

  const sorted = util.sortBy(results, r => r[c])
  return reverse(sorted, criteria)
}

const reverse = (results, criteria) => {
  const d = criteria['direction'] || 'asc'

  return (d === 'desc' ? results.reverse() : results)
}

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
  if (criteria['id'] && !Number.isInteger(criteria['id'])) {
    criteria['id'] = criteria['id'].
      split(/\s*,\s*/).
      map(y => parseInt(y))
  }
  if (!Array.isArray(criteria['parentId'])) {
    criteria['parentId'] = (
      criteria['parentId'] ?
      parseInt(criteria['parentId'] || -1) :
      null
    )
  }
  if (criteria['hierarchy']) {
    const values = Object.values(criteria['hierarchy'])

    const allFalse = values.every(v => !v)
    if (allFalse) delete criteria['hierarchy']

    const allTrue = values.every(v => v)
    if (allTrue) delete criteria['hierarchy']
  }

  const toFold = ['name', 'city', 'address', 'organization', 'terms']
  for (const f of toFold) {
    if (f in criteria) criteria[f] = ms.tokenize(criteria[f])
  }

  return criteria
}

const paginate = (records, criteria) => {
  const total = records.length
  const page = criteria.page
  let perPage = criteria.perPage

  const results = upaginate(records, perPage, page)

  return {
    page,
    perPage,
    total,
    results
  }
}
