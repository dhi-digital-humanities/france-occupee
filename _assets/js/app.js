import * as riot from 'riot'

import {i18n, RiotPlugins, BusRiotPlugin} from '@wendig/lib'

import config from './lib/dotenv'

// import the component
import App from './components/app.riot'
import FavControl from './components/fav_control.riot'
import Icon from './components/icon.riot'
import Input from './components/input.riot'
import MainSearch from './components/main_search.riot'
import Pagination from './components/pagination.riot'
import Results from './components/results.riot'
import SubForm from './components/sub_form.riot'
import WorldMap from './components/world_map.riot'
import YearSelector from './components/year_selector.riot'

// register the component
riot.register('app', App)
riot.register('fav-control', FavControl)
riot.register('icon', Icon)
riot.register('fo-input', Input)
riot.register('main-search', MainSearch)
riot.register('pagination', Pagination)
riot.register('sub-form', SubForm)
riot.register('results', Results)
riot.register('world-map', WorldMap)
riot.register('year-selector', YearSelector)

// set up translations then mount all registered components
i18n.fetch(`${config.root_url}/data/translations.json`).then((data) => {
    console.log('translations loaded')

    RiotPlugins.setup(riot)
    riot.install(RiotPlugins.i18n)
    riot.install(RiotPlugins.parent)
    riot.install(RiotPlugins.setTitle)
    riot.install(BusRiotPlugin)

    i18n.setLocale('fr')

    riot.mount('[is]')
})
