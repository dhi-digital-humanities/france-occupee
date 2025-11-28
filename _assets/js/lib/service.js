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
    return this.d['d_breadcrumb'].join(' » ')
  }
}