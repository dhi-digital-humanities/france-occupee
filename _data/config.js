import dotenv from 'dotenv'

export default function () {
    dotenv.config()

    return {
        env: process.env.APP_ENV,
        root_url: process.env.ROOT_URL,
        fonts: []
    }
}
