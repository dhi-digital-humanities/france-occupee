import * as riot from 'riot'
import {i18n, RiotPlugins} from '@wendig/lib'

import config from './lib/dotenv'

riot.install(RiotPlugins.i18n)

// import the component
import Example from './components/example.riot'
import WorldMap from './components/world_map.riot'

// register the component
riot.register('example', Example)
riot.register('world-map', WorldMap)

// set up translations then mount all registered components
i18n.fetch(`${config.root_url}/data/translations.json`).then((data) => {
    console.log('translations loaded')

    i18n.setLocale('fr')

    riot.mount('[is]')
})
