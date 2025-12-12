export default class Cache {
  constructor() {
    this.data = {}
  }

  fetch(namespace, key, f) {
    if (!(namespace in this.data)) this.data[namespace] = {}
    if (!(key in this.data[namespace])) this.data[namespace][key] = f()

    return this.data[namespace][key]
  }
}