import config from './dotenv'

import {Url, util, Search as WendigSearch} from '@wendig/lib'

export default class Search extends WendigSearch {
  constructor() {
    let url = config.ROOT_URL + '/assets/db.js';
    if (!config.ROOT_URL) {
      const u = Url.current()
      u.setPath('/assets/db.js')
      url = u.url()
    }

    super(url)
  }

  myAction(criteria) {
    return this.postMessage({action: 'my-action', criteria}).then(data => {
      return data
    })
  }
}
