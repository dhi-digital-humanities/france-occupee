import config from '../../../_data/config'

export default class Place {
  constructor(data) {
    this.d = data
  }

  id() {
    return this.d['id']
  }

  name() {
    return this.d['name'] || ''
  }

  city() {
    return this.d['current_city']
  }

  address() {
    const h = this.d['current_house_number']
    const s = this.d['current_street']
    const z = this.d['current_zip']

    return [h, s, z].filter(e => !!e).join(' ')
  }

  geo() {
    const lat = this.d['latitude']
    const lng = this.d['longitude']

    return [lat, lng]
  }

  imageUrl() {
    if (!this.d['image']) return null

    let base = config().image_path
    if (!base.startsWith('http')) base = `${config().root_url}${base}`

    return `${base}/${this.id()}.jpg`
  }
}
