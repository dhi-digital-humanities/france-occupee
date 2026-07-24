import {Url} from '@wendig/lib'

let logging = false

const detectLocale = () => {
  const url = Url.current()
  const parts = url.path().match(/^\/(de|fr|en)(\/.*|$)/)

  if (parts) return parts[1]

  return 'fr'
}

function indexBy(array, criteria, multiple=false) {
  let result = {}
  for (const a of array) {
    const key = (
      typeof criteria === 'string' || criteria instanceof String ?
      a[criteria] :
      criteria(a)
    )

    if (multiple) {
      result[key] = result[key] || []
      result[key].push(a)
    } else {
      result[key] = a
    }
  }
  return result
}

const paginate = (items, perPage, page) => {
  const total = items.length
  if (perPage === 'max') perPage = total

  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}

const log = (...args) => {
  if (args.length === 1) {
    if (args[0] === true) {
      logging = true
      return
    }

    if (args[0] === false) {
      logging = false
      return
    }
  }
  
  if (logging) console.log(...args)
}

export {
  detectLocale,
  indexBy,
  paginate,
  log
}