import config from '../../../_data/config'

export default class MapPlace {
  constructor(data) {
    this.d = data
  }

  country() {
    return this.d['country']
  }

  geo() {
    const lat = this.d['place']['latitude']
    const lng = this.d['place']['longitude']

    return [lat, lng]
  }

  address() {
    const h = this.d['place']['current_house_number']
    const s = this.d['place']['current_street']
    const z = this.d['place']['current_zip']

    return [h, s, z].filter(e => !!e).join(' ')
  }

  city() {
    return this.d['place']['current_city']
  }

  placeId() {
    return this.d['place']['id']
  }

  placeName() {
    return this.d['place']['name']
  }

  imageUrl() {
    if (!this.d['place']['image']) return null

    let base = config().image_path
    if (!base.startsWith('http')) base = `${config().root_url}${base}`

    return `${base}/${this.placeId()}.jpg`
  }
}
