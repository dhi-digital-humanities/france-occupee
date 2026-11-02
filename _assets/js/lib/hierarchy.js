const decode = (value) => {
  if (!value) return undefined

  const result = {}

  for (const token of value.split(',')) {
    if (!token) continue

    if (token.charAt(0) === '-') {
      result[token.slice(1)] = false
    } else {
      result[token] = true
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const encode = (nodes, inherited = false) => {
  const tokens = []
  collect(nodes, inherited, tokens)

  return tokens.join(',')
}

// only differences from the inherited parent state are stored, "-id" marks an explicit uncheck
const collect = (nodes, inherited, tokens) => {
  for (const node of nodes) {
    if (node.checked !== inherited) {
      for (const key of node.keys) {
        tokens.push(node.checked ? `${key}` : `-${key}`)
      }
    }

    collect(node.children, node.checked, tokens)
  }
}

export {
  decode,
  encode
}
