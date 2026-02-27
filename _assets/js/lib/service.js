import Place from './place'

export default class Service {
  constructor(data) {
    this.d = data
  }

  id() {
    return this.d['id']
  }

  city() {
    return this.place().city()
  }

  date() {
    const y = this.d['source']['d_edition_year']
    const m = this.d['source']['d_edition_month']

    return `${y}/${m}`
  }

  name() {
    return this.d['name']
  }

  place() {
    if (!this.placeObject) {
      this.placeObject = new Place(this.d['place'])
    }

    return this.placeObject
  }

  address() {
    return this.place().address()
  }

  geo() {
    return this.place().geo()
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

  hasImage() {
    return !!this.d['image']
  }

  placeName() {
    return this.place().name()
  }

  imageUrl() {
    return this.place().imageUrl()
  }
}