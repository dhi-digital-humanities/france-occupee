import config from '../../../_data/config'

const faces = [
  {weight: '300', url: '/assets/fonts/oswald_light-webfont.ttf'},
  {weight: '400', url: '/assets/fonts/oswald_regular-webfont.ttf'},
  {weight: '600', url: '/assets/fonts/oswald_semibold-webfont.ttf'}
]

export default class FontLoader {
  static async setup() {
    const fonts = faces.map(({weight, url}) => new FontFace(
      'Oswald',
      `url(${config().root_url}${url})`,
      {weight}
    ))

    await Promise.all(fonts.map(font => font.load()))

    fonts.forEach(font => document.fonts.add(font))
  }
}
