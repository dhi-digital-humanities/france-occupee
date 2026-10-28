import {util} from '@wendig/lib'

let groups = []

const cache = new Map()
const fetch = (key, retrieve) => {
  if (!cache.has(key)) cache.set(key, retrieve())

  return cache.get(key)
}

const termsCache = new Map()
const patternCache = new Map()

const applyThesaurusData = (data) => {
  groups = data.map(terms => terms.map(t => tokenize(t)).filter(t => t.length > 0))
  termsCache.clear()
}

function rEscape(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

const tokenize = (string) => {
  if (!string) return []
  if (Array.isArray(string)) return string

  return fetch(string, () => {
    return(
      util.fold(string).
      replace(/[’‘]/g, "'").
      split(/[\s\-]+/)
    )
  })
}

const patterns = (token) => {
  if (!patternCache.has(token)) {
    const rEsc = rEscape(token)

    patternCache.set(token, [
      new RegExp("(^|\\s|\\(|\\-)" + rEsc),
      new RegExp(rEsc + "($|\\s|\\)|\\-)")
    ])
  }

  return patternCache.get(token)
}

const groupTerms = (tokens) => {
  const key = tokens.join(' ')
  if (termsCache.has(key)) return termsCache.get(key)

  const result = []
  let i = 0

  while (i < tokens.length) {
    let found = null

    for (const group of groups) {
      for (const alternative of group) {
        if (alternative.length > tokens.length - i) continue
        if (found && alternative.length <= found.alternative.length) continue
        if (!alternative.every((t, j) => t === tokens[i + j])) continue

        found = {group, alternative}
      }
    }

    if (found) {
      result.push(found.group)
      i += found.alternative.length
    } else {
      result.push([[tokens[i]]])
      i += 1
    }
  }

  termsCache.set(key, result)
  return result
}

const alternativeMatches = (alternative, actualTokens) => {
  return alternative.every(t => {
    const [start, end] = patterns(t)

    return actualTokens.some(a => start.test(a) || end.test(a))
  })
}

const termMatches = (term, actualTokens) => {
  return term.some(alternative => alternativeMatches(alternative, actualTokens))
}

const matchesAnyTerms = (target, actual) => {
  const queryTerms = groupTerms(tokenize(target))
  if (queryTerms.length === 0) return true
  if (!actual) return false

  const actualTokens = tokenize(actual)
  if (actualTokens.length === 0) return false

  return queryTerms.some(term => termMatches(term, actualTokens))
}

const matchesAllTerms = (target, actual) => {
  if (!target || target.length === 0) return true
  if (!actual) return false

  const actualTokens = tokenize(actual)
  if (actualTokens.length === 0) return false

  return groupTerms(tokenize(target)).every(term => termMatches(term, actualTokens))
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
  const actual = record['source'] && record['source']['d_edition_year']
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
  applyThesaurusData
}
