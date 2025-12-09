import {Url} from '@wendig/lib'

const detectLocale = () => {
  const url = Url.current()
  const parts = url.path().match(/^\/([a-z]{2})(\/.*|$)/)

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

export {
  detectLocale,
  indexBy
}