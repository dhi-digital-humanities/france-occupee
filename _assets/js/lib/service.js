import config from '../../../_data/config'

export default class Service {
  constructor(data) {
    this.d = data
  }

  id() {
    return this.d['id']
  }

  city() {
    return this.d['place']['current_city']
  }

  date() {
    const y = this.d['source']['d_edition_year']
    const m = this.d['source']['d_edition_month']

    return `${y}/${m}`
  }

  name() {
    return this.d['name']
  }

  address() {
    const h = this.d['place']['current_house_number']
    const s = this.d['place']['current_street']
    const z = this.d['place']['current_zip']

    return [h, s, z].filter(e => !!e).join(' ')
  }

  geo() {
    const lat = this.d['place']['latitude']
    const lng = this.d['place']['longitude']

    return [lat, lng]
  }

  hierarchy() {
    return this.d['hierarchy']
  }

  country() {
    return this.d['source']['country']
  }

  placeId() {
    return this.d['place_id']
  }

  placeName() {
    return this.d['place']['name'] || ''
  }

  hasImage() {
    return !!this.d['image']
  }

  imageUrl() {
    if (!this.d['place']['image']) return null

    let base = config().image_path
    if (!base.startsWith('http')) base = `${config().root_url}${base}`

    return `${base}/${this.placeId()}.jpg`
  }
}