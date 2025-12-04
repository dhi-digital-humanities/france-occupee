const detectLocale = () => {
  const url = Url.current()
  const parts = url.path().match(/^\/([a-z]{2})(\/.*|$)/)

  if (parts) return parts[1]

  return 'fr'
}

export {
  detectLocale
}