import riot from './lib/riot'

import {i18n, RiotPlugins, BusRiotPlugin} from '@wendig/lib'

import config from '../../_data/config'
import {detectLocale} from './lib/util'
import FontLoader from './lib/font_loader'

// import components
import App from './components/app.riot'
import FavControl from './components/fav_control.riot'
import HelpIcon from './components/help_icon.riot'
import Icon from './components/icon.riot'
import Input from './components/input.riot'
import LoadingIndicator from './components/loading_indicator.riot'
import LocaleToggle from './components/locale_toggle.riot'
import MainSearch from './components/main_search.riot'
import Modal from './components/modal.riot'
import OrderControl from './components/order_control.riot'
import Pagination from './components/pagination.riot'
import Raw from './components/raw.riot'
import Results from './components/results.riot'
import Standalone from './components/standalone.riot'
import SubForm from './components/sub_form.riot'
import TreeView from './components/tree_view.riot'
import WorldMap from './components/world_map.riot'
import YearSelector from './components/year_selector.riot'
import PlacePopup from './components/place_popup.riot'

// register components
riot.register('app', App)
riot.register('fav-control', FavControl)
riot.register('help-icon', HelpIcon)
riot.register('icon', Icon)
riot.register('fo-input', Input)
riot.register('loading-indicator', LoadingIndicator)
riot.register('locale-toggle', LocaleToggle)
riot.register('main-search', MainSearch)
riot.register('modal', Modal)
riot.register('order-control', OrderControl)
riot.register('pagination', Pagination)
riot.register('raw', Raw)
riot.register('results', Results)
riot.register('sub-form', SubForm)
riot.register('standalone', Standalone)
riot.register('tree-view', TreeView)
riot.register('world-map', WorldMap)
riot.register('year-selector', YearSelector)
riot.register('place-popup', PlacePopup)

FontLoader.setup()

console.log('fetching translations')

// set up translations then mount all registered components
i18n.fetch(`${config().root_url}/data/translations.json`).then((data) => {
  console.log('translations loaded')

  RiotPlugins.setup(riot)
  riot.install(cmp => {
    cmp.config = config
    return cmp
  })
  riot.install(RiotPlugins.i18n)
  riot.install(RiotPlugins.parent)
  riot.install(RiotPlugins.setTitle)
  riot.install(BusRiotPlugin)

  i18n.setLocale(detectLocale())
  // i18n.setLocale('de')

  riot.mount('[is]')
})
