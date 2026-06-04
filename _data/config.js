export default function () {
  return {
    env: process.env.APP_ENV,
    root_url: process.env.ROOT_URL,
    image_path: process.env.IMAGE_PATH || '',
    pmtiles_url: process.env.PMTILES_URL,
    matomo_url: process.env.MATOMO_URL,
    matomo_site_id: process.env.MATOMO_SITE_ID,
    fonts: []
  }
}
