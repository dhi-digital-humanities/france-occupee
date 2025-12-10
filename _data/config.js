export default function () {
  return {
    env: process.env.APP_ENV,
    root_url: process.env.ROOT_URL,
    image_path: process.env.IMAGE_PATH || '',
    fonts: []
  }
}
