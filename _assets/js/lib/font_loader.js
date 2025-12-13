import config from '../../../_data/config'

export default class FontLoader {
  static async setup() {
    const font = new FontFace(
      "ayumi",
      `url(${config().root_url}/assets/fonts/ayumi_normal-webfont.ttf)`
    )

    await font.load()
    document.fonts.add(font)
  }
}
