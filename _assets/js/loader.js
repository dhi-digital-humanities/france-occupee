import config from '../../_data/config'
import {util} from '@wendig/lib'

const setup = () => {
  const root_url = config().root_url

  const style = util.createElement(`<link rel="stylesheet" type="text/css" href="${root_url}/assets/app.css"></link>`)
  document.querySelector('head').append(style)

  const app = util.createElement('<div is="app"></div>')
  document.querySelector('main section.two-cols').append(app)

  let script = document.createElement('script')
  script.setAttribute('src', `${root_url}/assets/app.js`)
  script.setAttribute('defer', true)
  document.querySelector('body').append(script)
}

// setup()