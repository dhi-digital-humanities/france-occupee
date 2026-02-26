import config from '../../../_data/config'
import Service from './service'
import MapPlace from './map_place'

import {Url, util, Search as WendigSearch} from '@wendig/lib'

export default class Search extends WendigSearch {
  constructor() {
    let url = config().root_url + '/assets/db.js';
    if (!config().root_url) {
      const u = Url.current()
      u.setPath('/assets/db.js')
      url = u.url()
    }

    super(url)
  }

  services(criteria) {
    return this.postMessage({action: 'services', criteria}).then(data => {
      data['results'] = data['results'].map(r => new Service(r))

      return data
    })
  }

  servicesMap(criteria) {
    return this.postMessage({action: 'places-map', criteria}).then(data => {
      data['results'] = data['results'].map(r => new MapPlace(r))

      return data
    })
  }

  servicesByPlace(placeId, page = 1, perPage = 10) {
    return this.postMessage({
      action: 'services-by-place',
      placeId: placeId,
      page: page,
      perPage: perPage
    }).then(data => {
      data['results'] = data['results'].map(r => new Service(r))
      return data
    })
  }

  csv(ids) {
    const criteria = {fav: 'true', csv: 'true', id: ids}

    return this.postMessage({action: 'services', criteria})
  }
}
