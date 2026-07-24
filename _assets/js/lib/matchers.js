import {util} from '@wendig/lib'
import {log} from './util'

let thesaurus = {}

const cache = new Map()
const fetch = (key, retrieve) => {
  if (!cache.has(key)) cache.set(key, retrieve())

  return cache.get(key)
}

const applyThesaurusData = (data) => {
  for (const terms of data) {
    const tokenized = tokenize(terms.map(t => tokenize(t))).flat()

    for (const t1 of tokenized) {
      for (const t2 of tokenized) {
        thesaurus[t1] = thesaurus[t1] || []
        thesaurus[t1].push(t2)
      }
    }
  }
}

function rEscape(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

const expand = (terms) => {
  const result = []

  for (const t of terms) {
    result.push(...(thesaurus[t] || [t]))
  }

  return result
}

const tokenize = (string) => {
  if (!string) return []
  if (Array.isArray(string)) return string

  return fetch(string, () => {
    return(
      util.fold(string).
      split(/[\s\-]+/)
    )
  })
}

const matchesAnyTerms = (target, actual) => {
  const targetTokenized = tokenize(target)
  if (targetTokenized.length === 0) return true

  const actualExpanded = expand(tokenize(actual))
  if (actualExpanded.length === 0) return false

  const targetPatterns = targetTokenized.map(t => {
    const rEsc = rEscape(t)
    const start = new RegExp("(^|\\s|\\(|\\-)" + rEsc)
    const end = new RegExp(rEsc + "($|\\s|\\)|\\-)")

    return [start, end]
  })

  log(targetTokenized)
  log(actual)
  log(actualExpanded)
  log(targetPatterns)

  for (const a of actualExpanded) {
    if (!a) continue

    for (const [s, e] of targetPatterns) {
      if (a.match(s) || a.match(e)) return true
    }
  }

  return false
}

const matchesAllTerms = (target, actual) => {
  if (!target || target.length === 0) return true
  if (!actual) return false

  return target.every(t => matchesAnyTerms(t, actual))
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

const matchesHierarchy = (hierarchy, record, services) => {
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
    r = services[r['parent_id']]
  }

  const country = record['source']['country']
  return hierarchy[country]
}

const matchesAddress = (address, record) => {
  if (!address) return true
  if (!record['place']) return false

  const parts = [
    record['place']['current_street'],
    record['place']['current_house_number'],
    record['place']['current_zip'],
    record['place']['current_city'],
    record['place']['current_country'],
    record['place']['former_street'],
    record['place']['former_house_number'],
    record['place']['former_zip'],
    record['place']['former_city'],
    record['place']['former_country']
  ].filter(e => !!e).map(e => e.toString()).join(' ')

  return matchesAllTerms(address, parts)
}

const hasGeo = (record) => {
  if (!record['place']) return false
  if (!record['place']['latitude']) return false
  if (!record['place']['longitude']) return false

  return true
}

export {
  matchesAnyTerms,
  matchesAllTerms,
  matchesExactly,
  matchesHierarchy,
  matchesIds,
  matchesParentId,
  matchesAddress,
  matchesYears,
  hasGeo,
  tokenize,
  expand,
  applyThesaurusData
}
