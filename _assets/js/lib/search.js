import config from '../../../_data/config'
import Service from './service'

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
    return this.postMessage({action: 'services-map', criteria}).then(data => {
      data['results'] = data['results'].map(r => new Service(r))

      return data
    })
  }
}
