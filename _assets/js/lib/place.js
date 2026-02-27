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

  hasAddress() {
    return (this.address() !== '')
  }

  hasFormerAddress() {
    const fa = this.formerAddress(false)
    if (fa === '') return false

    const ca = this.address(false)

    return fa !== ca
  }

  address(zip=true) {
    let parts = []
    parts.push(this.d['current_house_number'])
    parts.push(this.d['current_street'])

    if (zip) {
      parts.push(this.d['current_zip'])
    }

    return parts.filter(e => !!e).join(' ')
  }

  formerAddress() {
    let parts = []
    parts.push(this.d['former_house_number'])
    parts.push(this.d['former_street'])

    return parts.filter(e => !!e).join(' ')
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
